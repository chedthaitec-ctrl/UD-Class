import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import * as XLSX from "xlsx";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const classroomId = params.id;
    const dateParam = req.nextUrl.searchParams.get("date");

    const classroom = await prisma.classroom.findUnique({
      where: { id: classroomId },
      include: {
        students: { orderBy: { seatNumber: "asc" } },
        attendances: {
          include: {
            records: { include: { student: true } },
          },
          orderBy: { date: "desc" },
        },
      },
    });

    if (!classroom) {
      return NextResponse.json({ success: false, error: "Classroom not found" }, { status: 404 });
    }

    const wb = XLSX.utils.book_new();

    // 1. Sheet สรุปตามวันที่เลือก
    const targetDate = dateParam || new Date().toISOString().split("T")[0];
    const targetAtt = classroom.attendances.find((att) => {
      const attDateStr = new Date(att.date).toISOString().split("T")[0];
      return attDateStr === targetDate;
    });

    const recordMap: Record<string, string> = {};
    if (targetAtt) {
      targetAtt.records.forEach((r) => {
        recordMap[r.studentId] = r.status;
      });
    }

    let present = 0;
    let late = 0;
    let absent = 0;
    let sickLeave = 0;
    let personalLeave = 0;

    const dailyRows = classroom.students.map((std, idx) => {
      const status = recordMap[std.id] || (targetAtt ? "ABSENT" : "PRESENT");
      let statusLabel = "มาเรียน";

      if (status === "PRESENT") {
        statusLabel = "มาเรียน";
        present++;
      } else if (status === "LATE") {
        statusLabel = "มาสาย";
        late++;
      } else if (status === "ABSENT") {
        statusLabel = "ขาด";
        absent++;
      } else if (status === "SICK_LEAVE" || status === "SICK") {
        statusLabel = "ลาป่วย";
        sickLeave++;
      } else if (status === "PERSONAL_LEAVE" || status === "LEAVE") {
        statusLabel = "ลากิจ";
        personalLeave++;
      }

      return {
        "ลำดับ": idx + 1,
        "เลขที่": std.seatNumber > 0 ? std.seatNumber : "-",
        "ชื่อ-นามสกุล": std.name,
        "สถานะ": statusLabel,
        "วันที่": targetDate,
        "ห้องเรียน": classroom.name,
      };
    });

    // Summary footer rows
    dailyRows.push(
      { "ลำดับ": "" as any, "เลขที่": "" as any, "ชื่อ-นามสกุล": "" as any, "สถานะ": "" as any, "วันที่": "" as any, "ห้องเรียน": "" as any },
      {
        "ลำดับ": "สรุปยอดรวม" as any,
        "เลขที่": `มาเรียน: ${present}` as any,
        "ชื่อ-นามสกุล": `มาสาย: ${late}` as any,
        "สถานะ": `ขาด: ${absent}` as any,
        "วันที่": `ลาป่วย: ${sickLeave} / ลากิจ: ${personalLeave}` as any,
        "ห้องเรียน": `รวม: ${classroom.students.length} คน (เข้าเรียน ${classroom.students.length > 0 ? Math.round(((present + late) / classroom.students.length) * 100) : 0}%)` as any,
      }
    );

    const wsDaily = XLSX.utils.json_to_sheet(dailyRows);
    XLSX.utils.book_append_sheet(wb, wsDaily, `วันที่_${targetDate}`);

    // 2. Sheet สรุปภาพรวมสะสมทุกครั้งตลอดทั้งเทอม
    if (classroom.attendances.length > 0) {
      let totalAllPresent = 0;
      let totalAllLate = 0;
      let totalAllAbsent = 0;
      let totalAllSick = 0;
      let totalAllPersonal = 0;

      const cumulativeRows = classroom.students.map((std, idx) => {
        let stdPresent = 0;
        let stdLate = 0;
        let stdAbsent = 0;
        let stdSick = 0;
        let stdPersonal = 0;

        classroom.attendances.forEach((att) => {
          const rec = att.records.find((r) => r.studentId === std.id);
          if (rec) {
            if (rec.status === "PRESENT") stdPresent++;
            else if (rec.status === "LATE") stdLate++;
            else if (rec.status === "ABSENT") stdAbsent++;
            else if (rec.status === "SICK_LEAVE" || rec.status === "SICK") stdSick++;
            else if (rec.status === "PERSONAL_LEAVE" || rec.status === "LEAVE") stdPersonal++;
          }
        });

        totalAllPresent += stdPresent;
        totalAllLate += stdLate;
        totalAllAbsent += stdAbsent;
        totalAllSick += stdSick;
        totalAllPersonal += stdPersonal;

        const totalDays = classroom.attendances.length;
        const attendedRate = totalDays > 0 ? Math.round(((stdPresent + stdLate) / totalDays) * 100) : 0;

        return {
          "ลำดับ": idx + 1,
          "เลขที่": std.seatNumber > 0 ? std.seatNumber : "-",
          "ชื่อ-นามสกุล": std.name,
          "มาเรียน (ครั้ง)": stdPresent,
          "มาสาย (ครั้ง)": stdLate,
          "ขาด (ครั้ง)": stdAbsent,
          "ลาป่วย (ครั้ง)": stdSick,
          "ลากิจ (ครั้ง)": stdPersonal,
          "จำนวนวันที่เช็คชื่อรวม": totalDays,
          "อัตราการเข้าเรียนสะสม (%)": `${attendedRate}%`,
        };
      });

      const totalPossibleAttendances = classroom.students.length * classroom.attendances.length;
      const classAverageRate = totalPossibleAttendances > 0 
        ? Math.round(((totalAllPresent + totalAllLate) / totalPossibleAttendances) * 100) 
        : 0;

      // เพิ่มแถวสรุปผลรวมทั้งเทอม
      cumulativeRows.push(
        { "ลำดับ": "" as any, "เลขที่": "" as any, "ชื่อ-นามสกุล": "" as any, "มาเรียน (ครั้ง)": "" as any, "มาสาย (ครั้ง)": "" as any, "ขาด (ครั้ง)": "" as any, "ลาป่วย (ครั้ง)": "" as any, "ลากิจ (ครั้ง)": "" as any, "จำนวนวันที่เช็คชื่อรวม": "" as any, "อัตราการเข้าเรียนสะสม (%)": "" as any },
        {
          "ลำดับ": "สรุปผลรวมทั้งเทอม" as any,
          "เลขที่": `นักเรียนทั้งหมด ${classroom.students.length} คน` as any,
          "ชื่อ-นามสกุล": `รวมวันเช็คชื่อ ${classroom.attendances.length} วัน` as any,
          "มาเรียน (ครั้ง)": totalAllPresent as any,
          "มาสาย (ครั้ง)": totalAllLate as any,
          "ขาด (ครั้ง)": totalAllAbsent as any,
          "ลาป่วย (ครั้ง)": totalAllSick as any,
          "ลากิจ (ครั้ง)": totalAllPersonal as any,
          "จำนวนวันที่เช็คชื่อรวม": totalPossibleAttendances as any,
          "อัตราการเข้าเรียนสะสม (%)": `เฉลี่ยทั้งห้อง ${classAverageRate}%` as any,
        }
      );

      const wsCumulative = XLSX.utils.json_to_sheet(cumulativeRows);
      XLSX.utils.book_append_sheet(wb, wsCumulative, "สถิติสะสมภาพรวม");
    }

    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    const filename = `Attendance_${encodeURIComponent(classroom.name)}_${targetDate}.xlsx`;

    return new NextResponse(buffer, {
      headers: {
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    });
  } catch (error: any) {
    console.error("Attendance export error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
