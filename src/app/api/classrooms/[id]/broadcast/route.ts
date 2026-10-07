import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { pushLineMessage } from "@/lib/line/client";
import { createAssignmentFlex } from "@/lib/line/flex/assignmentFlex";
import { createReminderFlex } from "@/lib/line/flex/reminderFlex";
import { createAttendanceFlex } from "@/lib/line/flex/attendanceFlex";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const classroom = await prisma.classroom.findUnique({
      where: { id: params.id },
      include: { students: true },
    });

    if (!classroom) {
      return NextResponse.json({ success: false, error: "Classroom not found" }, { status: 404 });
    }

    if (!classroom.lineGroupId) {
      return NextResponse.json(
        { success: false, error: "ห้องเรียนนี้ยังไม่ได้ผูกกับ LINE Group ID" },
        { status: 400 }
      );
    }

    const { type, text, assignmentId, attendanceId } = await req.json();
    let messages: any[] = [];

    if (type === "text") {
      messages.push({
        type: "text",
        text: `📢 ประกาศจากครูผู้สอน (${classroom.name}):\n\n${text}`,
      });
    } else if (type === "assignment" && assignmentId) {
      const assignment = await prisma.assignment.findUnique({
        where: { id: assignmentId },
        include: { submissions: true },
      });

      if (assignment) {
        messages.push(
          createAssignmentFlex({
            assignmentId: assignment.id,
            title: assignment.title,
            description: assignment.description,
            dueDate: assignment.dueDate,
            expReward: assignment.expReward,
            maxScore: assignment.maxScore,
            submittedCount: assignment.submissions.length,
            totalStudents: classroom.students.length,
          })
        );
      }
    } else if (type === "reminder" && assignmentId) {
      const assignment = await prisma.assignment.findUnique({
        where: { id: assignmentId },
        include: { submissions: true },
      });

      if (assignment) {
        const submittedIds = new Set(assignment.submissions.map((s) => s.studentId));
        const unsubmitted = classroom.students.filter((s) => !submittedIds.has(s.id));

        messages.push(
          createReminderFlex({
            assignmentId: assignment.id,
            title: assignment.title,
            dueDate: assignment.dueDate,
            unsubmittedStudents: unsubmitted.map((s) => ({
              seatNumber: s.seatNumber,
              name: s.name,
            })),
            expReward: assignment.expReward,
          })
        );
      }
    } else if (type === "attendance" && attendanceId) {
      const attendance = await prisma.attendance.findUnique({
        where: { id: attendanceId },
        include: { records: true },
      });

      if (attendance) {
        const records = attendance.records;
        const present = records.filter((r) => r.status === "PRESENT").length;
        const late = records.filter((r) => r.status === "LATE").length;
        const absent = records.filter((r) => r.status === "ABSENT").length;
        const leave = records.filter((r) => r.status === "LEAVE").length;

        messages.push(
          createAttendanceFlex({
            classroomName: classroom.name,
            date: attendance.date,
            presentCount: present,
            lateCount: late,
            absentCount: absent,
            leaveCount: leave,
            totalStudents: classroom.students.length,
          })
        );
      }
    }

    if (messages.length === 0) {
      return NextResponse.json({ success: false, error: "No messages to broadcast" }, { status: 400 });
    }

    const pushSuccess = await pushLineMessage(classroom.lineGroupId, messages);

    return NextResponse.json({
      success: true,
      pushSuccess,
      lineGroupId: classroom.lineGroupId,
      messagesSent: messages.length,
      note: pushSuccess
        ? "ส่งข้อความเข้ากลุ่ม LINE สำเร็จ"
        : "จำลองการส่งสำเร็จ (ยังไม่ได้ตั้งค่า LINE_CHANNEL_ACCESS_TOKEN จริงใน .env)",
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
