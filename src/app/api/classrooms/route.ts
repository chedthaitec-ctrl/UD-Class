import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const classrooms = await prisma.classroom.findMany({
      include: {
        teacher: true,
        _count: {
          select: {
            students: true,
            assignments: true,
            attendances: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, classrooms });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, lineGroupId, academicYear = "2569", term = "1", teacherId } = body;

    // หาคุณครูคนแรกหากไม่ได้ระบุ
    let teacher = null;
    if (teacherId) {
      teacher = await prisma.teacher.findUnique({ where: { id: teacherId } });
    }
    if (!teacher) {
      teacher = await prisma.teacher.findFirst();
    }
    if (!teacher) {
      teacher = await prisma.teacher.create({
        data: {
          name: "ครูเชษฐ์ พัฒนาวิชาการ",
          email: "chedtha.teacher@school.ac.th",
        },
      });
    }

    const classroom = await prisma.classroom.create({
      data: {
        teacherId: teacher.id,
        name,
        lineGroupId: lineGroupId ? lineGroupId.trim() : null,
        academicYear,
        term,
      },
    });

    return NextResponse.json({ success: true, classroom });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
