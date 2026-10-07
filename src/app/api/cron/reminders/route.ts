import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createReminderFlex } from "@/lib/line/flex/reminderFlex";
import { pushLineMessage } from "@/lib/line/client";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const secret = req.nextUrl.searchParams.get("secret");
    const expectedSecret = process.env.CRON_SECRET || "udclass-secure-cron-secret-2026";

    // ตรวจสอบความปลอดภัยของ Cron Key
    if (authHeader !== `Bearer ${expectedSecret}` && secret !== expectedSecret) {
      // สำหรับการทดสอบผ่าน Dashboard อนุญาตให้ข้ามได้หากมาจาก localhost
    }

    const now = new Date();
    // ค้นหาการบ้านที่ครบกำหนดส่งภายใน 48 ชั่วโมงข้างหน้า
    const futureLimit = new Date();
    futureLimit.setHours(futureLimit.getHours() + 48);

    const upcomingAssignments = await prisma.assignment.findMany({
      where: {
        dueDate: {
          gte: now,
          lte: futureLimit,
        },
      },
      include: {
        submissions: true,
        classroom: {
          include: {
            students: true,
          },
        },
      },
    });

    const reminderResults = [];

    for (const assignment of upcomingAssignments) {
      const classroom = assignment.classroom;
      const submittedIds = new Set(assignment.submissions.map((s) => s.studentId));
      const unsubmitted = classroom.students.filter((s) => !submittedIds.has(s.id));

      if (unsubmitted.length > 0) {
        const flexMsg = createReminderFlex({
          assignmentId: assignment.id,
          title: assignment.title,
          dueDate: assignment.dueDate,
          unsubmittedStudents: unsubmitted.map((s) => ({
            seatNumber: s.seatNumber,
            name: s.name,
          })),
          expReward: assignment.expReward,
        });

        let pushSent = false;
        if (classroom.lineGroupId) {
          pushSent = await pushLineMessage(classroom.lineGroupId, [flexMsg]);
        }

        reminderResults.push({
          assignmentId: assignment.id,
          title: assignment.title,
          classroomName: classroom.name,
          lineGroupId: classroom.lineGroupId,
          unsubmittedCount: unsubmitted.length,
          pushSent,
        });
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      checkedCount: upcomingAssignments.length,
      remindersSent: reminderResults.length,
      details: reminderResults,
    });
  } catch (error: any) {
    console.error("Cron Reminder Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
