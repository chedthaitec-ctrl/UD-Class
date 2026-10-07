import { NextRequest, NextResponse } from "next/server";
import { hatchEgg } from "@/lib/gamification/engine";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { studentId } = await req.json();

    if (!studentId) {
      return NextResponse.json({ success: false, error: "Missing studentId" }, { status: 400 });
    }

    const result = await hatchEgg(studentId);

    const updatedStudent = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        egg: {
          include: { hatchedMonster: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      hatched: result.hatched,
      monster: result.monster,
      student: updatedStudent,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
