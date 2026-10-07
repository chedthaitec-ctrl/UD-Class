import { NextRequest, NextResponse } from "next/server";
import { addStudentExp } from "@/lib/gamification/engine";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { studentId, classroomId, amount = 15, points = 0 } = await req.json();

    if (studentId) {
      const result = await addStudentExp(studentId, parseInt(amount, 10), parseInt(points, 10));
      return NextResponse.json({ success: true, result });
    }

    if (classroomId) {
      const students = await prisma.student.findMany({
        where: { classroomId },
      });

      for (const s of students) {
        await addStudentExp(s.id, parseInt(amount, 10), parseInt(points, 10));
      }

      return NextResponse.json({
        success: true,
        awardedCount: students.length,
        expPerStudent: amount,
      });
    }

    return NextResponse.json({ success: false, error: "Missing studentId or classroomId" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
