import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0; // Dynamic on load

export default async function DashboardPage() {
  // Fetch statistics directly via Prisma
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

  // Today's attendance stats
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayAttendance = await prisma.attendance.findFirst({
    where: { date: { gte: today } },
    include: { records: true },
  });

  const presentCount = todayAttendance?.records.filter(r => r.status === "PRESENT").length || 0;
  const totalAttended = todayAttendance?.records.length || 0;
  const attendanceRate = totalAttended > 0 ? Math.round((presentCount / totalAttended) * 100) : 100;

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-emerald-500/10 to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              <span>🌟 ระบบห้องเรียน Gamification พลัง AI & LINE Bot</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              ยินดีต้อนรับ, ครูเชษฐ์ พัฒนาวิชาการ
            </h2>
            <p className="text-sm text-slate-300 max-w-xl">
              จัดการห้องเรียน เช็คชื่อมอบหมายงาน ส่งข้อความแจ้งเตือนอัตโนมัติเข้ากลุ่ม LINE พร้อมระบบเพาะพันธุ์ไข่มอนสเตอร์สะสม EXP เพื่อสร้างแรงจูงใจในการเรียนรู้
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/simulator"
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition shadow-lg shadow-emerald-500/25 flex items-center gap-2"
            >
              <span>💬</span>
              <span>ทดสอบ LINE Bot จำลอง</span>
            </Link>
            <Link
              href="/classrooms"
              className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white transition backdrop-blur border border-white/10 flex items-center gap-2"
            >
              <span>🏫</span>
              <span>จัดการห้องเรียน</span>
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Classrooms */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">ห้องเรียนทั้งหมด</span>
            <span className="text-lg">🏫</span>
          </div>
          <div className="text-2xl font-black text-slate-900">{classroomsCount}</div>
          <p className="text-[11px] text-emerald-600 font-medium mt-1">พร้อมเปิดการสอน</p>
        </div>

        {/* Students */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">นักเรียนทั้งหมด</span>
            <span className="text-lg">🎒</span>
          </div>
          <div className="text-2xl font-black text-slate-900">{studentsCount}</div>
          <p className="text-[11px] text-slate-500 font-medium mt-1">
            ผูก LINE แล้ว {lineLinkedStudentsCount} คน
          </p>
        </div>

        {/* Assignments */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">การบ้านที่มอบหมาย</span>
            <span className="text-lg">📝</span>
          </div>
          <div className="text-2xl font-black text-slate-900">{assignmentsCount}</div>
          <p className="text-[11px] text-blue-600 font-medium mt-1">มีการบ้านที่ต้องส่ง</p>
        </div>

        {/* Attendance Rate */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">การเข้าเรียนวันนี้</span>
            <span className="text-lg">📋</span>
          </div>
          <div className="text-2xl font-black text-slate-900">{attendanceRate}%</div>
          <p className="text-[11px] text-emerald-600 font-medium mt-1">
            มาเรียน {presentCount} คน (+15 EXP)
          </p>
        </div>

        {/* Hatched Monsters */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm hover:shadow-md transition col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">มอนสเตอร์ที่ฟักแล้ว</span>
            <span className="text-lg">🐣</span>
          </div>
          <div className="text-2xl font-black text-emerald-600">{hatchedEggsCount}</div>
          <p className="text-[11px] text-slate-500 font-medium mt-1">จากภารกิจสะสม EXP</p>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Classrooms and Active Homework (2 Cols) */}
        <div className="lg:col-span-2 space-y-8">
          {/* Classrooms Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">ห้องเรียนของฉัน</h3>
                <p className="text-xs text-slate-500">ห้องเรียนที่ดูแลและการเชื่อมโยงกับ LINE Group</p>
              </div>
              <Link
                href="/classrooms"
                className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
              >
                ดูทั้งหมด ({classrooms.length}) →
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {classrooms.map((cls) => {
                const isLineConnected = !!cls.lineGroupId;
                return (
                  <div
                    key={cls.id}
                    className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-sm hover:border-slate-300 transition flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold ${
                            isLineConnected
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-slate-100 text-slate-600 border border-slate-200"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isLineConnected ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
                            }`}
                          />
                          {isLineConnected ? "LINE Group เชื่อมต่อแล้ว" : "ยังไม่ได้ผูกกลุ่ม"}
                        </span>
                        <span className="text-xs text-slate-400 font-medium">
                          ปี {cls.academicYear} / เทอม {cls.term}
                        </span>
                      </div>

                      <h4 className="font-bold text-slate-900 text-base mb-1">
                        {cls.name}
                      </h4>
                      <p className="text-xs text-slate-500 mb-4 line-clamp-1">
                        ผู้สอน: {cls.teacher.name}
                      </p>

                      <div className="grid grid-cols-2 gap-2 p-2.5 bg-slate-50 rounded-lg text-xs mb-4">
                        <div>
                          <span className="text-slate-400 block text-[10px]">นักเรียน</span>
                          <span className="font-bold text-slate-800">{cls._count.students} คน</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">การบ้าน</span>
                          <span className="font-bold text-slate-800">{cls._count.assignments} ชิ้น</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                      <Link
                        href={`/classrooms/${cls.id}`}
                        className="flex-1 text-center py-2 rounded-lg text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition"
                      >
                        เข้าสู่ห้องเรียน
                      </Link>
                      <Link
                        href={`/classrooms/${cls.id}/attendance`}
                        className="px-3 py-2 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition"
                        title="เช็คชื่อทันที"
                      >
                        📋 เช็คชื่อ
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Assignments Monitor */}
          <div className="bg-white rounded-xl p-6 border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">ติดตามสถานะการส่งการบ้าน</h3>
                <p className="text-xs text-slate-500">การบ้านล่าสุดและอัตราการส่งงานของนักเรียน</p>
              </div>
              <Link
                href="/classrooms"
                className="text-xs font-semibold text-slate-600 hover:text-slate-900"
              >
                ดูทั้งหมด →
              </Link>
            </div>

            <div className="space-y-3">
              {recentAssignments.map((asg) => {
                const totalSubs = asg.submissions.length;
                const dueDateFormatted = new Intl.DateTimeFormat("th-TH", {
                  dateStyle: "medium",
                  timeStyle: "short",
                }).format(new Date(asg.dueDate));
                const isPast = new Date() > new Date(asg.dueDate);

                return (
                  <div
                    key={asg.id}
                    className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">{asg.title}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                          +{asg.expReward} EXP
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">
                        ห้อง: {asg.classroom.name} • กำหนดส่ง:{" "}
                        <span className={isPast ? "text-rose-600 font-semibold" : "text-slate-600"}>
                          {dueDateFormatted}
                        </span>
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-xs font-bold text-slate-900">
                          ส่งแล้ว {totalSubs} คน
                        </div>
                        <div className="text-[10px] text-slate-400">
                          คะแนนเต็ม {asg.maxScore}
                        </div>
                      </div>

                      <Link
                        href={`/classrooms/${asg.classroomId}/assignments`}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition whitespace-nowrap"
                      >
                        ดูผล & ตรวจงาน
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Leaderboard & Quick Tools (1 Col) */}
        <div className="space-y-8">
          {/* Top Trainers Leaderboard */}
          <div className="bg-white rounded-xl p-6 border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">อันดับเทรนเนอร์ยอดเยี่ยม</h3>
                <p className="text-xs text-slate-500">นักเรียนที่มีคะแนน & EXP สูงสุด</p>
              </div>
              <span className="text-xl">🏆</span>
            </div>

            <div className="space-y-3">
              {topStudents.map((std, idx) => {
                const rankColor =
                  idx === 0
                    ? "bg-amber-100 text-amber-800 border-amber-300"
                    : idx === 1
                    ? "bg-slate-200 text-slate-700 border-slate-300"
                    : idx === 2
                    ? "bg-orange-100 text-orange-800 border-orange-300"
                    : "bg-slate-100 text-slate-600 border-slate-200";

                return (
                  <div
                    key={std.id}
                    className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-slate-200 transition"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black border ${rankColor}`}
                      >
                        {idx + 1}
                      </span>
                      <div>
                        <p className="text-xs font-bold text-slate-900 leading-snug">
                          {std.name}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          เลขที่ {std.seatNumber} • Lv.{std.level}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-black text-emerald-600 block">
                        {std.totalPoints} แต้ม
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {std.exp} EXP
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick LINE Bot Commands Cheat Sheet */}
          <div className="bg-slate-900 text-white rounded-xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-emerald-400 flex items-center gap-2">
                <span>🤖</span>
                <span>คำสั่งลัด LINE Bot</span>
              </h3>
              <Link
                href="/simulator"
                className="text-[11px] font-semibold text-slate-400 hover:text-white"
              >
                ลองเล่นเลย →
              </Link>
            </div>
            <p className="text-xs text-slate-300">
              นักเรียนและคุณครูสามารถพิมพ์คำสั่งเหล่านี้ในกลุ่ม LINE ได้ตลอดเวลา:
            </p>

            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700">
                <span className="font-mono text-emerald-400 font-bold block">#การบ้าน</span>
                <span className="text-[11px] text-slate-300">แสดงการบ้านทั้งหมด พร้อมปุ่มส่งงาน (LIFF)</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700">
                <span className="font-mono text-amber-400 font-bold block">#ไข่</span>
                <span className="text-[11px] text-slate-300">เช็คสถานะการฟักไข่ และมอนสเตอร์ที่สุ่มได้</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700">
                <span className="font-mono text-cyan-400 font-bold block">#ลงทะเบียน [เลขที่]</span>
                <span className="text-[11px] text-slate-300">ผูก LINE ID กับเลขที่นักเรียนเพื่อรับ EXP</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700">
                <span className="font-mono text-rose-400 font-bold block">#ทวงงาน</span>
                <span className="text-[11px] text-slate-300">สรุปรายชื่อเพื่อนที่ยังไม่ส่งการบ้านเข้ากลุ่ม</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
