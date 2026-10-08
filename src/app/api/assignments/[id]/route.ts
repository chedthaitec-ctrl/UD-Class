import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { addStudentExp } from "@/lib/gamification/engine";
import { pushLineMessage } from "@/lib/line/client";
import { createGradeFeedbackFlex } from "@/lib/line/flex/gradeFeedbackFlex";

export const dynamic = "force-dynamic";

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
    const {
      action,
      studentId,
      content,
      submissionType = "GENERAL",
      quizAnswers,
      score,
      feedback,
      aiFeedback,
      annotationData,
      submissionId,
      notifyStudentLine = true,
    } = body;

    const assignment = await prisma.assignment.findUnique({
      where: { id: params.id },
      include: {
        classroom: true,
      },
    });

    if (!assignment) {
      return NextResponse.json({ success: false, error: "Assignment not found" }, { status: 404 });
    }

    // 1. นักเรียนส่งงาน (Submit)
    if (action === "submit") {
      const now = new Date();
      const isLate = now > assignment.dueDate;

      let finalScore: number | null = null;
      let finalStatus = isLate ? "LATE" : "SUBMITTED";

      // If this is a QUIZ or quiz answers are provided: AUTO-GRADE IMMEDIATELY!
      if (assignment.type === "QUIZ" || quizAnswers) {
        let calculatedScore = 0;
        let totalPossible = 0;

        if (assignment.quizQuestions) {
          try {
            const questions = JSON.parse(assignment.quizQuestions);
            const answersObj = typeof quizAnswers === "string" ? JSON.parse(quizAnswers) : (quizAnswers || {});

            questions.forEach((q: any) => {
              const points = q.points || 1;
              totalPossible += points;
              if (answersObj[q.id] === q.answer) {
                calculatedScore += points;
              }
            });

            // Scale to assignment maxScore if needed
            if (totalPossible > 0) {
              finalScore = Math.round((calculatedScore / totalPossible) * assignment.maxScore);
            } else {
              finalScore = calculatedScore;
            }
          } catch (e) {
            console.error("Error auto-grading quiz:", e);
          }
        }

        finalStatus = "GRADED";
      }

      // ค้นหา submission เดิมถ้าเคยส่งแล้ว
      const existing = await prisma.submission.findFirst({
        where: {
          assignmentId: assignment.id,
          studentId,
        },
      });

      const parsedQuizAnswers = quizAnswers
        ? typeof quizAnswers === "string"
          ? quizAnswers
          : JSON.stringify(quizAnswers)
        : null;

      let submission;
      if (existing) {
        submission = await prisma.submission.update({
          where: { id: existing.id },
          data: {
            content: content || (finalScore !== null ? `ผลสอบควิซ: ${finalScore}/${assignment.maxScore}` : ""),
            submissionType,
            quizAnswers: parsedQuizAnswers,
            score: finalScore !== null ? finalScore : existing.score,
            submittedAt: now,
            status: finalScore !== null ? "GRADED" : (isLate ? "LATE" : "SUBMITTED"),
          },
        });
      } else {
        submission = await prisma.submission.create({
          data: {
            assignmentId: assignment.id,
            studentId,
            content: content || (finalScore !== null ? `ผลสอบควิซ: ${finalScore}/${assignment.maxScore}` : ""),
            submissionType,
            quizAnswers: parsedQuizAnswers,
            score: finalScore,
            submittedAt: now,
            status: finalStatus,
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
        instantGraded: finalScore !== null,
        score: finalScore,
        maxScore: assignment.maxScore,
      });
    }

    // 2. บันทึกเฉพาะลายเส้น Annotation จาก iPad
    if (action === "save_annotation" && submissionId) {
      const submission = await prisma.submission.update({
        where: { id: submissionId },
        data: {
          annotationData,
        },
      });
      return NextResponse.json({ success: true, submission });
    }

    // 3. คุณครูตรวจงานและให้คะแนน (Grade) พร้อมส่งแจ้งเตือนรายบุคคล
    if (action === "grade" && submissionId) {
      const parsedScore = parseFloat(score);

      const updateData: any = {
        score: parsedScore,
        status: "GRADED",
      };

      if (feedback !== undefined) updateData.feedback = feedback;
      if (aiFeedback !== undefined) updateData.aiFeedback = aiFeedback;
      if (annotationData !== undefined) updateData.annotationData = annotationData;

      const submission = await prisma.submission.update({
        where: { id: submissionId },
        data: updateData,
        include: { student: true },
      });

      // ถ้าได้คะแนนสูง (>= 80%) มอบโบนัส EXP เพิ่ม +20
      if (parsedScore >= assignment.maxScore * 0.8) {
        await addStudentExp(submission.studentId, 20, 20);
      }

      // แจ้งผลคะแนนรายบุคคลผ่าน LINE หากนักเรียนเชื่อมต่อ LINE และเปิดการแจ้งเตือน
      let lineNotified = false;
      if (notifyStudentLine && submission.student.lineUserId) {
        try {
          const flexMsg = createGradeFeedbackFlex({
            studentName: submission.student.name,
            assignmentTitle: assignment.title,
            score: parsedScore,
            maxScore: assignment.maxScore,
            expGained: parsedScore >= assignment.maxScore * 0.8 ? 20 : 0,
            feedback: feedback || null,
            aiFeedbackSummary: aiFeedback || null,
          });

          await pushLineMessage(submission.student.lineUserId, [flexMsg]);
          lineNotified = true;
        } catch (err) {
          console.warn("Could not push line message to student:", err);
        }
      }

      return NextResponse.json({
        success: true,
        submission,
        lineNotified,
      });
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
