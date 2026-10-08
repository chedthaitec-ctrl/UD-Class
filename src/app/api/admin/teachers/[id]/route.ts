import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const teacher = await prisma.teacher.findUnique({
      where: { id: params.id },
      include: {
        classrooms: {
          include: {
            _count: {
              select: {
                students: true,
                assignments: true,
                attendances: true,
              },
            },
          },
        },
      },
    });

    if (!teacher) {
      return NextResponse.json(
        { success: false, error: "ไม่พบข้อมูลครูท่านนี้" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, teacher });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || (currentUser.role !== "ADMIN" && !currentUser.originalAdminId)) {
      return NextResponse.json(
        { success: false, error: "เฉพาะผู้ดูแลระบบใหญ่เท่านั้นที่ได้รับอนุญาตให้แก้ไขคุณครู" },
        { status: 403 }
      );
    }

    const teacherId = params.id;
    const body = await req.json();
    const { name, email, password, role, department, phone } = body;

    const teacher = await prisma.teacher.findUnique({
      where: { id: teacherId },
    });

    if (!teacher) {
      return NextResponse.json(
        { success: false, error: "ไม่พบข้อมูลคุณครู" },
        { status: 404 }
      );
    }

    // หากมีการเปลี่ยนอีเมล ตรวจสอบว่าซ้ำกับคนอื่นหรือไม่
    if (email && email.trim().toLowerCase() !== teacher.email.toLowerCase()) {
      const existing = await prisma.teacher.findUnique({
        where: { email: email.trim().toLowerCase() },
      });
      if (existing) {
        return NextResponse.json(
          { success: false, error: "อีเมลนี้มีคุณครูท่านอื่นใช้งานแล้ว" },
          { status: 409 }
        );
      }
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim();
    if (email !== undefined) updateData.email = email.trim().toLowerCase();
    if (password !== undefined && password.trim() !== "") updateData.password = password.trim();
    if (role !== undefined) updateData.role = role === "ADMIN" ? "ADMIN" : "TEACHER";
    if (department !== undefined) updateData.department = department.trim();
    if (phone !== undefined) updateData.phone = phone ? phone.trim() : null;

    const updated = await prisma.teacher.update({
      where: { id: teacherId },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      message: `อัปเดตข้อมูล ${updated.name} เรียบร้อยแล้ว`,
      teacher: updated,
    });
  } catch (error: any) {
    console.error("Admin teacher PUT error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const teacherId = params.id;
    const currentUser = await getCurrentUser();

    if (!currentUser || (currentUser.role !== "ADMIN" && !currentUser.originalAdminId)) {
      return NextResponse.json(
        { success: false, error: "เฉพาะผู้ดูแลระบบใหญ่เท่านั้นที่ได้รับอนุญาตให้ลบคุณครู" },
        { status: 403 }
      );
    }

    // ป้องกันการลบบัญชีตัวเอง
    if (currentUser && currentUser.id === teacherId) {
      return NextResponse.json(
        { success: false, error: "ไม่สามารถลบบัญชีที่คุณกำลังใช้งานอยู่ได้" },
        { status: 400 }
      );
    }

    const teacher = await prisma.teacher.findUnique({
      where: { id: teacherId },
      include: {
        classrooms: {
          include: {
            students: true,
            assignments: true,
            attendances: true,
          },
        },
      },
    });

    if (!teacher) {
      return NextResponse.json(
        { success: false, error: "ไม่พบข้อมูลคุณครู" },
        { status: 404 }
      );
    }

    // รวบรวม IDs ของทรัพยากรที่ครูคนนี้ดูแล เพื่อทำการลบ Cascade อย่างปลอดภัย
    const classroomIds = teacher.classrooms.map((c) => c.id);
    const studentIds = teacher.classrooms.flatMap((c) => c.students.map((s) => s.id));
    const assignmentIds = teacher.classrooms.flatMap((c) => c.assignments.map((a) => a.id));
    const attendanceIds = teacher.classrooms.flatMap((c) => c.attendances.map((a) => a.id));

    await prisma.$transaction([
      // 1. ลบไข่มอนสเตอร์ของนักเรียน
      prisma.studentEgg.deleteMany({
        where: { studentId: { in: studentIds } },
      }),
      // 2. ลบผลงานการส่ง
      prisma.submission.deleteMany({
        where: {
          OR: [
            { studentId: { in: studentIds } },
            { assignmentId: { in: assignmentIds } },
          ],
        },
      }),
      // 3. ลบบันทึกการเช็คชื่อ
      prisma.attendanceRecord.deleteMany({
        where: {
          OR: [
            { studentId: { in: studentIds } },
            { attendanceId: { in: attendanceIds } },
          ],
        },
      }),
      // 4. ลบการเช็คชื่อ
      prisma.attendance.deleteMany({
        where: { id: { in: attendanceIds } },
      }),
      // 5. ลบการบ้าน
      prisma.assignment.deleteMany({
        where: { id: { in: assignmentIds } },
      }),
      // 6. ลบนักเรียน
      prisma.student.deleteMany({
        where: { id: { in: studentIds } },
      }),
      // 7. ลบห้องเรียนของครู
      prisma.classroom.deleteMany({
        where: { id: { in: classroomIds } },
      }),
      // 8. ลบคุณครู
      prisma.teacher.delete({
        where: { id: teacherId },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: `ลบครู "${teacher.name}" และห้องเรียนที่ดูแลทั้งหมดเรียบร้อยแล้ว`,
    });
  } catch (error: any) {
    console.error("Admin teacher DELETE error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
