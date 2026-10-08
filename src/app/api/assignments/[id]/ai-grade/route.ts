import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { evaluateSubmissionWithRubric, RubricCriterion } from "@/lib/ai/rubricGrader";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { submissionId } = body;

    const assignment = await prisma.assignment.findUnique({
      where: { id: params.id },
    });

    if (!assignment) {
      return NextResponse.json({ success: false, error: "Assignment not found" }, { status: 404 });
    }

    let submission = null;
    if (submissionId) {
      submission = await prisma.submission.findUnique({
        where: { id: submissionId },
        include: { student: true },
      });
    }

    let rubricParsed: RubricCriterion[] = [];
    if (assignment.rubric) {
      try {
        rubricParsed = JSON.parse(assignment.rubric);
      } catch (e) {
        console.error("Failed to parse rubric JSON", e);
      }
    }

    const evaluation = await evaluateSubmissionWithRubric({
      assignmentTitle: assignment.title,
      assignmentDescription: assignment.description,
      maxScore: assignment.maxScore,
      rubric: rubricParsed,
      submissionContent: submission?.content || "",
      submissionType: submission?.submissionType || "GENERAL",
      quizAnswers: submission?.quizAnswers || null,
      quizScore: submission?.score || null,
    });

    return NextResponse.json({
      success: true,
      evaluation,
    });
  } catch (error: any) {
    console.error("AI Grade Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
