import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import DashboardView from "@/components/DashboardView";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default async function DashboardPage() {
  let classroomsCount = 0;
  let studentsCount = 0;
  let lineLinkedStudentsCount = 0;
  let assignmentsCount = 0;
  let hatchedEggsCount = 0;
  let classrooms: any[] = [];
  let recentAssignments: any[] = [];
  let topStudents: any[] = [];
  let presentCount = 0;
  let attendanceRate = 100;
  let dbError: string | null = null;
  let currentUser = null;

  try {
    currentUser = await getCurrentUser();

    // กรองตามครูผู้ใช้งาน (ถ้าเป็นครู แยกดูเฉพาะห้องของตัวเอง)
    const teacherFilterId = currentUser?.role === "TEACHER" ? currentUser.id : null;

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
      cCount,
      sCount,
      lCount,
      aCount,
      hCount,
      clsList,
      rAssignments,
      tStudents,
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

    classroomsCount = cCount;
    studentsCount = sCount;
    lineLinkedStudentsCount = lCount;
    assignmentsCount = aCount;
    hatchedEggsCount = hCount;
    classrooms = clsList;
    recentAssignments = rAssignments;
    topStudents = tStudents;

    // Today's attendance stats
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

    presentCount = todayAttendance?.records.filter((r) => r.status === "PRESENT").length || 0;
    const totalAttended = todayAttendance?.records.length || 0;
    attendanceRate = totalAttended > 0 ? Math.round((presentCount / totalAttended) * 100) : 100;
  } catch (err: any) {
    console.error("Dashboard database query error:", err);
    dbError = err?.message || "Database connection error";
  }

  return (
    <DashboardView
      initialUser={currentUser}
      initialStats={{
        classroomsCount,
        studentsCount,
        lineLinkedStudentsCount,
        assignmentsCount,
        hatchedEggsCount,
        presentCount,
        attendanceRate,
      }}
      initialClassrooms={classrooms}
      initialRecentAssignments={recentAssignments}
      initialTopStudents={topStudents}
      initialDbError={dbError}
    />
  );
}
