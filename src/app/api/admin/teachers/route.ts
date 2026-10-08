import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    // อนุญาตให้แอดมินหรือทุกคนในระบบดูรายชื่อครูได้
    const teachers = await prisma.teacher.findMany({
      include: {
        classrooms: {
          select: {
            id: true,
            name: true,
            academicYear: true,
            term: true,
            _count: {
              select: {
                students: true,
                assignments: true,
                attendances: true,
              },
            },
          },
        },
        _count: {
          select: {
            classrooms: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // คำนวณจำนวนนักเรียนรวมที่ครูแต่ละคนดูแล
    const teachersWithStats = teachers.map((t) => {
      const totalStudents = t.classrooms.reduce(
        (sum, c) => sum + (c._count?.students || 0),
        0
      );
      const totalAssignments = t.classrooms.reduce(
        (sum, c) => sum + (c._count?.assignments || 0),
        0
      );
      return {
        ...t,
        stats: {
          classroomsCount: t.classrooms.length,
          studentsCount: totalStudents,
          assignmentsCount: totalAssignments,
        },
      };
    });

    return NextResponse.json({
      success: true,
      currentUser,
      teachers: teachersWithStats,
    });
  } catch (error: any) {
    console.error("Admin teachers GET error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || (currentUser.role !== "ADMIN" && !currentUser.originalAdminId)) {
      return NextResponse.json(
        { success: false, error: "เฉพาะผู้ดูแลระบบใหญ่เท่านั้นที่ได้รับอนุญาตให้เพิ่มคุณครู" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { name, email, password, role = "TEACHER", department, phone } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { success: false, error: "กรุณาระบุชื่อ-นามสกุลของคุณครู" },
        { status: 400 }
      );
    }

    if (!email || !email.trim()) {
      return NextResponse.json(
        { success: false, error: "กรุณาระบุอีเมล" },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    // ตรวจสอบอีเมลซ้ำ
    const existing = await prisma.teacher.findUnique({
      where: { email: cleanEmail },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: "อีเมลนี้ถูกใช้งานแล้วในระบบ กรุณาใช้อีเมลอื่น" },
        { status: 409 }
      );
    }

    const newTeacher = await prisma.teacher.create({
      data: {
        name: name.trim(),
        email: cleanEmail,
        password: password ? password.trim() : "123456",
        role: role === "ADMIN" ? "ADMIN" : "TEACHER",
        department: department?.trim() || "กลุ่มสาระการเรียนรู้",
        phone: phone?.trim() || null,
      },
    });

    return NextResponse.json({
      success: true,
      message: `เพิ่มครู "${newTeacher.name}" เรียบร้อยแล้ว`,
      teacher: newTeacher,
    });
  } catch (error: any) {
    console.error("Admin teachers POST error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
