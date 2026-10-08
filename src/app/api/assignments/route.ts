import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { pushLineMessage } from "@/lib/line/client";
import { createAssignmentFlex } from "@/lib/line/flex/assignmentFlex";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const classroomId = req.nextUrl.searchParams.get("classroomId");
    const where = classroomId ? { classroomId } : {};

    const assignments = await prisma.assignment.findMany({
      where,
      include: {
        classroom: {
          include: { students: true },
        },
        submissions: {
          include: { student: true },
        },
      },
      orderBy: { dueDate: "asc" },
    });

    return NextResponse.json({ success: true, assignments });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      classroomId,
      title,
      description,
      dueDate,
      maxScore = 100,
      expReward = 50,
      type = "GENERAL",
      format = "ALL",
      rubric,
      quizQuestions,
      broadcastToLine = true,
    } = body;

    const assignment = await prisma.assignment.create({
      data: {
        classroomId,
        title: title.trim(),
        description: description ? description.trim() : null,
        type: type || "GENERAL",
        format: format || "ALL",
        dueDate: new Date(dueDate),
        maxScore: parseInt(maxScore, 10),
        expReward: parseInt(expReward, 10),
        rubric: rubric ? (typeof rubric === "string" ? rubric : JSON.stringify(rubric)) : null,
        quizQuestions: quizQuestions ? (typeof quizQuestions === "string" ? quizQuestions : JSON.stringify(quizQuestions)) : null,
      },
      include: {
        classroom: {
          include: { students: true },
        },
      },
    });

    let broadcastResult = null;
    if (broadcastToLine && assignment.classroom.lineGroupId) {
      const flexMsg = createAssignmentFlex({
        assignmentId: assignment.id,
        title: assignment.title,
        description: assignment.description,
        dueDate: assignment.dueDate,
        expReward: assignment.expReward,
        maxScore: assignment.maxScore,
        submittedCount: 0,
        totalStudents: assignment.classroom.students.length,
      });

      broadcastResult = await pushLineMessage(assignment.classroom.lineGroupId, [flexMsg]);
    }

    return NextResponse.json({
      success: true,
      assignment,
      broadcastResult,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
