import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createAttendanceFlex } from "@/lib/line/flex/attendanceFlex";
import { pushLineMessage } from "@/lib/line/client";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const attendances = await prisma.attendance.findMany({
      where: {
        date: {
          gte: today,
          lt: tomorrow,
        },
      },
      include: {
        records: true,
        classroom: {
          include: { students: true },
        },
      },
    });

    const results = [];

    for (const att of attendances) {
      const records = att.records;
      const present = records.filter((r) => r.status === "PRESENT").length;
      const late = records.filter((r) => r.status === "LATE").length;
      const absent = records.filter((r) => r.status === "ABSENT").length;
      const leave = records.filter((r) => r.status === "LEAVE").length;

      const flexMsg = createAttendanceFlex({
        classroomName: att.classroom.name,
        date: att.date,
        presentCount: present,
        lateCount: late,
        absentCount: absent,
        leaveCount: leave,
        totalStudents: att.classroom.students.length,
      });

      let pushSent = false;
      if (att.classroom.lineGroupId) {
        pushSent = await pushLineMessage(att.classroom.lineGroupId, [flexMsg]);
      }

      results.push({
        classroomId: att.classroomId,
        classroomName: att.classroom.name,
        attendanceRate: Math.round(((present + late) / (att.classroom.students.length || 1)) * 100),
        pushSent,
      });
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      attendancesCount: attendances.length,
      summaries: results,
    });
  } catch (error: any) {
    console.error("Cron Attendance Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
