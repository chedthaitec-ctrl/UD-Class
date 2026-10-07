import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { addStudentExp } from "@/lib/gamification/engine";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const assignment = await prisma.assignment.findUnique({
      where: { id: params.id },
      include: {
        classroom: {
          include: {
            students: {
              include: {
                egg: true,
              },
              orderBy: { seatNumber: "asc" },
            },
          },
        },
        submissions: {
          include: {
            student: {
              include: { egg: true },
            },
          },
          orderBy: { submittedAt: "desc" },
        },
      },
    });

    if (!assignment) {
      return NextResponse.json({ success: false, error: "Assignment not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, assignment });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// การให้คะแนน (Grading) หรือการส่งงาน
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { action, studentId, content, score, submissionId } = body;

    const assignment = await prisma.assignment.findUnique({
      where: { id: params.id },
    });

    if (!assignment) {
      return NextResponse.json({ success: false, error: "Assignment not found" }, { status: 404 });
    }

    // 1. นักเรียนส่งงาน (Submit)
    if (action === "submit") {
      const now = new Date();
      const isLate = now > assignment.dueDate;

      // ค้นหา submission เดิมถ้าเคยส่งแล้ว
      const existing = await prisma.submission.findFirst({
        where: {
          assignmentId: assignment.id,
          studentId,
        },
      });

      let submission;
      if (existing) {
        submission = await prisma.submission.update({
          where: { id: existing.id },
          data: {
            content,
            submittedAt: now,
            status: isLate ? "LATE" : "SUBMITTED",
          },
        });
      } else {
        submission = await prisma.submission.create({
          data: {
            assignmentId: assignment.id,
            studentId,
            content,
            submittedAt: now,
            status: isLate ? "LATE" : "SUBMITTED",
          },
        });

        // ได้รับ EXP ทันทีเมื่อส่งงาน (+50 EXP หรือตามกำหนด)
        const expGained = isLate ? Math.floor(assignment.expReward / 2) : assignment.expReward;
        await addStudentExp(studentId, expGained, 10);
      }

      return NextResponse.json({
        success: true,
        submission,
        isLate,
        expGained: assignment.expReward,
      });
    }

    // 2. คุณครูตรวจงานและให้คะแนน (Grade)
    if (action === "grade" && submissionId) {
      const parsedScore = parseFloat(score);
      const submission = await prisma.submission.update({
        where: { id: submissionId },
        data: {
          score: parsedScore,
          status: "GRADED",
        },
        include: { student: true },
      });

      // ถ้าได้คะแนนสูง (>= 80%) มอบโบนัส EXP เพิ่ม +20
      if (parsedScore >= assignment.maxScore * 0.8) {
        await addStudentExp(submission.studentId, 20, 20);
      }

      return NextResponse.json({ success: true, submission });
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.assignment.delete({
      where: { id: params.id },
    });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
