import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    const { searchParams } = new URL(req.url);
    const filterTeacherId = searchParams.get("teacherId");

    // กำหนดว่าต้องกรองข้อมูลเฉพาะครูคนใดคนหนึ่งหรือไม่
    let teacherFilterId: string | null = null;
    if (currentUser?.role === "TEACHER") {
      teacherFilterId = currentUser.id;
    } else if (currentUser?.role === "ADMIN" && filterTeacherId) {
      teacherFilterId = filterTeacherId;
    }

    // สร้าง Where clause สำหรับแต่ละ Entity
    const classroomWhere = teacherFilterId ? { teacherId: teacherFilterId } : {};
    const studentWhere = teacherFilterId
      ? { classroom: { teacherId: teacherFilterId } }
      : {};
    const lineStudentWhere = teacherFilterId
      ? { classroom: { teacherId: teacherFilterId }, lineUserId: { not: null } }
      : { lineUserId: { not: null } };
    const assignmentWhere = teacherFilterId
      ? { classroom: { teacherId: teacherFilterId } }
      : {};
    const eggWhere = teacherFilterId
      ? { student: { classroom: { teacherId: teacherFilterId } }, isHatched: true }
      : { isHatched: true };

    const [
      classroomsCount,
      studentsCount,
      lineLinkedStudentsCount,
      assignmentsCount,
      hatchedEggsCount,
      classrooms,
      recentAssignments,
      topStudents,
    ] = await Promise.all([
      prisma.classroom.count({ where: classroomWhere }),
      prisma.student.count({ where: studentWhere }),
      prisma.student.count({ where: lineStudentWhere }),
      prisma.assignment.count({ where: assignmentWhere }),
      prisma.studentEgg.count({ where: eggWhere }),
      prisma.classroom.findMany({
        where: classroomWhere,
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
      }),
      prisma.assignment.findMany({
        where: assignmentWhere,
        include: {
          classroom: true,
          submissions: true,
        },
        orderBy: { dueDate: "asc" },
        take: 4,
      }),
      prisma.student.findMany({
        where: studentWhere,
        include: {
          classroom: true,
          egg: { include: { hatchedMonster: true } },
        },
        orderBy: { totalPoints: "desc" },
        take: 5,
      }),
    ]);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendanceWhere: any = { date: { gte: today } };
    if (teacherFilterId) {
      attendanceWhere.classroom = { teacherId: teacherFilterId };
    }

    const todayAttendance = await prisma.attendance.findFirst({
      where: attendanceWhere,
      include: { records: true },
    });

    const presentCount = todayAttendance?.records.filter((r) => r.status === "PRESENT").length || 0;
    const totalAttended = todayAttendance?.records.length || 0;
    const attendanceRate = totalAttended > 0 ? Math.round((presentCount / totalAttended) * 100) : 100;

    return NextResponse.json(
      {
        success: true,
        timestamp: new Date().toISOString(),
        currentUser,
        isFilteredByTeacher: !!teacherFilterId,
        stats: {
          classroomsCount,
          studentsCount,
          lineLinkedStudentsCount,
          assignmentsCount,
          hatchedEggsCount,
          presentCount,
          attendanceRate,
        },
        classrooms,
        recentAssignments,
        topStudents,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      }
    );
  } catch (error: any) {
    console.error("Dashboard API error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
