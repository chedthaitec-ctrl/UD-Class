import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
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
      prisma.classroom.count(),
      prisma.student.count(),
      prisma.student.count({ where: { lineUserId: { not: null } } }),
      prisma.assignment.count(),
      prisma.studentEgg.count({ where: { isHatched: true } }),
      prisma.classroom.findMany({
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
        include: {
          classroom: true,
          submissions: true,
        },
        orderBy: { dueDate: "asc" },
        take: 4,
      }),
      prisma.student.findMany({
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
    const todayAttendance = await prisma.attendance.findFirst({
      where: { date: { gte: today } },
      include: { records: true },
    });

    const presentCount = todayAttendance?.records.filter((r) => r.status === "PRESENT").length || 0;
    const totalAttended = todayAttendance?.records.length || 0;
    const attendanceRate = totalAttended > 0 ? Math.round((presentCount / totalAttended) * 100) : 100;

    return NextResponse.json(
      {
        success: true,
        timestamp: new Date().toISOString(),
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
