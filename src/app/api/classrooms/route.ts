import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    const { searchParams } = new URL(req.url);
    const filterTeacherId = searchParams.get("teacherId");

    // สร้างเงื่อนไข Where ตามสิทธิ์
    let whereClause: any = {};

    if (currentUser?.role === "TEACHER") {
      // ครูทั่วไป จะมองเห็นเฉพาะห้องเรียนที่ตนเองสอนเท่านั้น (แยกห้องเรียนของใครของมัน)
      whereClause.teacherId = currentUser.id;
    } else if (currentUser?.role === "ADMIN" && filterTeacherId) {
      // แอดมินสามารถระบุฟิลเตอร์เพื่อดูเฉพาะครูคนนั้นๆ ได้
      whereClause.teacherId = filterTeacherId;
    }

    const classrooms = await prisma.classroom.findMany({
      where: whereClause,
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

    return NextResponse.json({
      success: true,
      currentUser,
      classrooms,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    const body = await req.json();
    const { name, lineGroupId, academicYear = "2569", term = "1", teacherId } = body;

    // กำหนดว่าห้องเรียนนี้เป็นของครูคนใด
    let targetTeacherId = currentUser?.id;

    if (currentUser?.role === "ADMIN" && teacherId) {
      // ถ้าเป็นแอดมิน สามารถเลือกสร้างห้องให้ครูท่านใดก็ได้
      targetTeacherId = teacherId;
    }

    // หากไม่มี teacherId ให้หาหรือ fallback
    if (!targetTeacherId) {
      const defaultTeacher = await prisma.teacher.findFirst();
      if (defaultTeacher) {
        targetTeacherId = defaultTeacher.id;
      } else {
        const createdTeacher = await prisma.teacher.create({
          data: {
            name: "คุณครูผู้สอน",
            email: "teacher@udclass.ac.th",
            role: "TEACHER",
          },
        });
        targetTeacherId = createdTeacher.id;
      }
    }

    const classroom = await prisma.classroom.create({
      data: {
        teacherId: targetTeacherId,
        name: name.trim(),
        lineGroupId: lineGroupId ? lineGroupId.trim() : null,
        academicYear: academicYear || "2569",
        term: term || "1",
      },
      include: {
        teacher: true,
      },
    });

    return NextResponse.json({ success: true, classroom });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
