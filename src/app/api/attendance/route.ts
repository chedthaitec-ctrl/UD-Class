import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { addStudentExp, EXP_RULES } from "@/lib/gamification/engine";
import { pushLineMessage } from "@/lib/line/client";
import { createAttendanceFlex } from "@/lib/line/flex/attendanceFlex";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const classroomId = req.nextUrl.searchParams.get("classroomId");
    const dateParam = req.nextUrl.searchParams.get("date");

    if (!classroomId) {
      return NextResponse.json({ success: false, error: "Missing classroomId" }, { status: 400 });
    }

    const where: any = { classroomId };
    if (dateParam) {
      const targetDate = new Date(dateParam);
      const startOfDay = new Date(new Date(targetDate).setHours(0, 0, 0, 0));
      const endOfDay = new Date(new Date(targetDate).setHours(23, 59, 59, 999));
      where.date = { gte: startOfDay, lte: endOfDay };
    }

    const attendances = await prisma.attendance.findMany({
      where,
      include: {
        records: {
          include: { student: true },
        },
      },
      orderBy: { date: "desc" },
    });

    return NextResponse.json({ success: true, attendances });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { classroomId, date = new Date(), records, broadcastToLine = false } = body;

    const classroom = await prisma.classroom.findUnique({
      where: { id: classroomId },
      include: { students: true },
    });

    if (!classroom) {
      return NextResponse.json({ success: false, error: "Classroom not found" }, { status: 404 });
    }

    const targetDate = new Date(date);
    const startOfDay = new Date(new Date(targetDate).setHours(0, 0, 0, 0));
    const endOfDay = new Date(new Date(targetDate).setHours(23, 59, 59, 999));

    // ตรวจสอบว่าเคยเช็คชื่อในวันนี้แล้วหรือไม่
    const existingAttendance = await prisma.attendance.findFirst({
      where: {
        classroomId,
        date: { gte: startOfDay, lte: endOfDay },
      },
    });

    let attendance;
    if (existingAttendance) {
      // ลบเรคอร์ดเดิมของวันนี้แล้วสร้างใหม่
      await prisma.attendanceRecord.deleteMany({
        where: { attendanceId: existingAttendance.id },
      });
      attendance = existingAttendance;
    } else {
      attendance = await prisma.attendance.create({
        data: {
          classroomId,
          date: targetDate,
        },
      });
    }

    // บันทึกรายการเช็คชื่อแต่ละคน
    let presentCount = 0;
    let lateCount = 0;
    let absentCount = 0;
    let sickLeaveCount = 0;
    let personalLeaveCount = 0;

    for (const record of records) {
      const { studentId, status } = record;

      // Normalization
      let normalizedStatus = status;
      if (status === "LEAVE") {
        normalizedStatus = "PERSONAL_LEAVE";
      }

      await prisma.attendanceRecord.create({
        data: {
          attendanceId: attendance.id,
          studentId,
          status: normalizedStatus,
        },
      });

      // สถิติการเช็คชื่อ (ไม่แจก EXP แล้วตามข้อกำหนด)
      if (normalizedStatus === "PRESENT") {
        presentCount++;
      } else if (normalizedStatus === "LATE") {
        lateCount++;
      } else if (normalizedStatus === "ABSENT") {
        absentCount++;
      } else if (normalizedStatus === "SICK_LEAVE") {
        sickLeaveCount++;
      } else if (normalizedStatus === "PERSONAL_LEAVE") {
        personalLeaveCount++;
      }
    }

    // ส่งสรุปเข้ากลุ่ม LINE หากตั้งค่าไว้
    let pushSuccess = false;
    if (broadcastToLine && classroom.lineGroupId) {
      const flexMsg = createAttendanceFlex({
        classroomName: classroom.name,
        date: targetDate,
        presentCount,
        lateCount,
        absentCount,
        sickLeaveCount,
        personalLeaveCount,
        totalStudents: classroom.students.length,
      });

      pushSuccess = await pushLineMessage(classroom.lineGroupId, [flexMsg]);
    }

    return NextResponse.json({
      success: true,
      attendanceId: attendance.id,
      stats: {
        present: presentCount,
        late: lateCount,
        absent: absentCount,
        sickLeave: sickLeaveCount,
        personalLeave: personalLeaveCount,
        total: records.length,
      },
      pushSuccess,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
