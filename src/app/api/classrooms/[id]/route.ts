import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const classroom = await prisma.classroom.findUnique({
      where: { id: params.id },
      include: {
        teacher: true,
        students: {
          include: {
            egg: {
              include: { hatchedMonster: true },
            },
          },
          orderBy: { seatNumber: "asc" },
        },
        assignments: {
          include: {
            submissions: true,
          },
          orderBy: { dueDate: "asc" },
        },
        attendances: {
          include: {
            records: true,
          },
          orderBy: { date: "desc" },
          take: 10,
        },
      },
    });

    if (!classroom) {
      return NextResponse.json({ success: false, error: "Classroom not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, classroom });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { name, lineGroupId, academicYear, term } = body;

    const classroom = await prisma.classroom.update({
      where: { id: params.id },
      data: {
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

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const classroomId = params.id;

    // ตรวจสอบว่ามีห้องเรียนนี้อยู่จริงหรือไม่
    const classroom = await prisma.classroom.findUnique({
      where: { id: classroomId },
      include: {
        students: true,
        assignments: true,
        attendances: true,
      },
    });

    if (!classroom) {
      return NextResponse.json({ success: false, error: "Classroom not found" }, { status: 404 });
    }

    const studentIds = classroom.students.map((s) => s.id);
    const assignmentIds = classroom.assignments.map((a) => a.id);
    const attendanceIds = classroom.attendances.map((a) => a.id);

    // ลบข้อมูลที่เกี่ยวข้องทั้งหมดเพื่อป้องกัน Foreign Key Error
    await prisma.$transaction([
      // 1. ลบไข่มอนสเตอร์ของนักเรียนในห้องนี้
      prisma.studentEgg.deleteMany({
        where: { studentId: { in: studentIds } },
      }),
      // 2. ลบผลการส่งงาน
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
      // 7. ลบห้องเรียน
      prisma.classroom.delete({
        where: { id: classroomId },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: `ลบห้องเรียน "${classroom.name}" และข้อมูลทั้งหมดเรียบร้อยแล้ว`,
    });
  } catch (error: any) {
    console.error("Delete classroom error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
