import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ClassroomDetailPage({
  params,
}: {
  params: { id: string };
}) {
  let classroom = null;
  try {
    classroom = await prisma.classroom.findUnique({
      where: { id: params.id },
      include: {
        teacher: true,
        students: {
          include: {
            egg: { include: { hatchedMonster: true } },
            submissions: true,
          },
          orderBy: { seatNumber: "asc" },
        },
        assignments: {
          include: { submissions: true },
          orderBy: { dueDate: "asc" },
        },
        attendances: {
          include: { records: true },
          orderBy: { date: "desc" },
          take: 5,
        },
      },
    });
  } catch (err) {
    console.error("Classroom detail database error:", err);
  }

  if (!classroom) return notFound();

  const isLineConnected = !!classroom.lineGroupId;
  const hatchedStudentsCount = classroom.students.filter(
    (s) => s.egg?.isHatched
  ).length;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Classroom Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-slate-800">
        <div className="absolute -right-12 -bottom-12 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-0 right-1/4 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold ${
                  isLineConnected
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                    : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    isLineConnected ? "bg-emerald-400 animate-pulse" : "bg-amber-400"
                  }`}
                />
                {isLineConnected
                  ? `LINE เชื่อมต่อ (${classroom.lineGroupId})`
                  : "ยังไม่ได้ผูก LINE Group"}
              </span>
              <span className="text-[11px] font-bold text-white/80 bg-white/10 px-3 py-1 rounded-full border border-white/10 backdrop-blur-md">
                ปีการศึกษา {classroom.academicYear} / เทอม {classroom.term}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {classroom.name}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 flex items-center gap-1.5">
              <span>👨‍🏫 ครูประจำวิชา:</span>
              <span className="font-semibold text-white">{classroom.teacher.name}</span>
              <span className="text-slate-400">({classroom.teacher.email})</span>
            </p>
          </div>

          {/* Quick Tabs Links */}
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/classrooms/${classroom.id}/attendance`}
              className="px-4 py-2.5 rounded-2xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition shadow-lg shadow-emerald-500/25 flex items-center gap-1.5 active:scale-95"
            >
              <span>📋</span>
              <span>เช็คชื่อวันนี้</span>
            </Link>
            <Link
              href={`/classrooms/${classroom.id}/assignments`}
              className="px-4 py-2.5 rounded-2xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white transition backdrop-blur border border-white/10 flex items-center gap-1.5"
            >
              <span>📝</span>
              <span>การบ้าน ({classroom.assignments.length})</span>
            </Link>
            <Link
              href={`/classrooms/${classroom.id}/monsters`}
              className="px-4 py-2.5 rounded-2xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition shadow-lg shadow-amber-500/25 flex items-center gap-1.5 active:scale-95"
            >
              <span>🐣</span>
              <span>ไข่มอนสเตอร์</span>
            </Link>
            <Link
              href={`/classrooms/${classroom.id}/students`}
              className="px-4 py-2.5 rounded-2xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white transition backdrop-blur border border-white/10 flex items-center gap-1.5"
            >
              <span>🎒</span>
              <span>นักเรียน ({classroom.students.length})</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Classroom Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Students */}
        <div className="modern-card bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white flex items-center justify-center text-2xl font-bold shadow-md shadow-indigo-500/20 shrink-0">
            🎒
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              นักเรียนในห้อง
            </p>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">
              {classroom.students.length}{" "}
              <span className="text-xs font-bold text-slate-400">คน</span>
            </h3>
            <p className="text-[10px] text-emerald-600 font-bold mt-1">
              ผูก LINE แล้ว {classroom.students.filter((s) => s.lineUserId).length} คน
            </p>
          </div>
        </div>

        {/* Total Assignments */}
        <div className="modern-card bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 text-white flex items-center justify-center text-2xl font-bold shadow-md shadow-violet-500/20 shrink-0">
            📝
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              การบ้านทั้งหมด
            </p>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">
              {classroom.assignments.length}{" "}
              <span className="text-xs font-bold text-slate-400">งาน</span>
            </h3>
            <p className="text-[10px] text-indigo-600 font-bold mt-1">
              พร้อมระบบทวงงานอัตโนมัติ
            </p>
          </div>
        </div>

        {/* Hatched Monsters */}
        <div className="modern-card bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 text-white flex items-center justify-center text-2xl font-bold shadow-md shadow-amber-500/20 shrink-0">
            🐣
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              ฟักมอนสเตอร์แล้ว
            </p>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">
              {hatchedStudentsCount} / {classroom.students.length}
            </h3>
            <p className="text-[10px] text-amber-600 font-bold mt-1">
              สะสม EXP ครบ 100
            </p>
          </div>
        </div>

        {/* Attendance count */}
        <div className="modern-card bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center text-2xl font-bold shadow-md shadow-emerald-500/20 shrink-0">
            📋
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              ประวัติเช็คชื่อ
            </p>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">
              {classroom.attendances.length}{" "}
              <span className="text-xs font-bold text-slate-400">ครั้ง</span>
            </h3>
            <p className="text-[10px] text-emerald-600 font-bold mt-1">
              แจก +15 EXP ทุกครั้ง
            </p>
          </div>
        </div>
      </div>

      {/* Classroom Content Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Recent Assignments and Roster Preview */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Assignments */}
          <div className="modern-card bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-black text-slate-900 text-base tracking-tight">
                  รายการการบ้านห้องนี้
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  ติดตามการส่งงานและการแจก EXP
                </p>
              </div>
              <Link
                href={`/classrooms/${classroom.id}/assignments`}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-xl transition"
              >
                จัดการการบ้านทั้งหมด →
              </Link>
            </div>

            <div className="space-y-3">
              {classroom.assignments.length === 0 ? (
                <div className="p-10 text-center text-slate-400 text-xs rounded-2xl border border-dashed border-slate-200">
                  ยังไม่มีการบ้านในห้องนี้ กดจัดการการบ้านเพื่อเริ่มมอบหมาย
                </div>
              ) : (
                classroom.assignments.map((asg) => {
                  const subCount = asg.submissions.length;
                  const total = classroom.students.length;
                  const percent = total > 0 ? Math.round((subCount / total) * 100) : 0;

                  return (
                    <div
                      key={asg.id}
                      className="p-4 rounded-2xl border border-slate-100 bg-slate-50/70 hover:bg-slate-50 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-xs truncate">
                            {asg.title}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 shrink-0">
                            +{asg.expReward} EXP
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 line-clamp-1">
                          {asg.description || "ไม่มีรายละเอียด"}
                        </p>
                      </div>

                      <div className="flex items-center gap-4 shrink-0">
                        <div className="w-32 text-right">
                          <span className="text-xs font-bold text-slate-800">
                            {subCount}/{total} คน ({percent}%)
                          </span>
                          <div className="w-full bg-slate-200 h-1.5 rounded-full mt-1.5 overflow-hidden">
                            <div
                              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>

                        <Link
                          href={`/classrooms/${classroom.id}/assignments`}
                          className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition shadow-sm"
                        >
                          ตรวจงาน
                        </Link>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Student Roster Quick Peek */}
          <div className="modern-card bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-black text-slate-900 text-base tracking-tight">
                  รายชื่อนักเรียน & สถานะไข่
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  ระดับเลเวล, แต้มคะแนนสะสม และการผูกบัญชี LINE
                </p>
              </div>
              <Link
                href={`/classrooms/${classroom.id}/students`}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-xl transition"
              >
                ดูรายชื่อเต็ม ({classroom.students.length}) →
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-bold text-[10px] uppercase">
                    <th className="pb-3">เลขที่</th>
                    <th className="pb-3">ชื่อ-สกุล</th>
                    <th className="pb-3">LINE</th>
                    <th className="pb-3">Lv / EXP</th>
                    <th className="pb-3">สถานะไข่/มอนสเตอร์</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {classroom.students.slice(0, 6).map((std) => (
                    <tr key={std.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 font-black text-slate-900">
                        {std.seatNumber}
                      </td>
                      <td className="py-3 font-semibold text-slate-800">
                        {std.name}
                      </td>
                      <td className="py-3">
                        {std.lineUserId ? (
                          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                            🟢 ผูกแล้ว
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-medium bg-slate-100 px-2 py-0.5 rounded-full">
                            ⚪ ยังไม่ผูก
                          </span>
                        )}
                      </td>
                      <td className="py-3">
                        <span className="font-black text-indigo-600">
                          Lv.{std.level}
                        </span>{" "}
                        <span className="text-slate-400 text-[10px]">
                          ({std.exp} EXP)
                        </span>
                      </td>
                      <td className="py-3">
                        {std.egg?.isHatched ? (
                          <span className="text-[11px] font-bold text-purple-600 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-200">
                            👾 {std.egg.hatchedMonster?.name || "มอนสเตอร์"}
                          </span>
                        ) : (
                          <span className="text-[11px] text-amber-700 font-semibold bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                            🥚 {std.egg?.currentExp || 0}/100 EXP
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: LINE Integration Box & Quick Broadcast Tools */}
        <div className="space-y-6">
          {/* LINE Group Pairing Guide Box */}
          <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-7 shadow-xl border border-slate-800 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-emerald-400 text-sm flex items-center gap-2">
                <span>💬</span>
                <span>คู่มือการเชื่อมต่อ LINE Group</span>
              </h3>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-white/10 text-slate-300 border border-white/10">
                LINE API
              </span>
            </div>

            <div className="space-y-3.5 text-xs text-slate-300 leading-relaxed">
              <p>
                1. เชิญ UD-Class Bot เข้ากลุ่ม LINE ของห้องเรียนนี้
              </p>
              <p>
                2. ในกลุ่ม ให้พิมพ์ <span className="text-emerald-400 font-bold font-mono bg-white/10 px-1.5 py-0.5 rounded">#กลุ่ม</span> เพื่อตรวจสอบ Group ID
              </p>
              <p>
                3. Group ID ของห้องเรียนนี้ในระบบ:
              </p>

              <div className="p-3.5 bg-black/40 rounded-2xl border border-white/10 backdrop-blur">
                <div className="text-[10px] text-slate-400 mb-1 font-semibold">Group ID ปัจจุบัน:</div>
                <div className="font-mono text-emerald-400 text-xs break-all font-bold">
                  {classroom.lineGroupId || "ยังไม่ได้ผูก (พิมพ์ #กลุ่ม เพื่อดู ID)"}
                </div>
              </div>

              <div className="pt-2">
                <Link
                  href="/simulator"
                  className="w-full text-center py-2.5 rounded-2xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition block shadow-lg shadow-emerald-500/25 active:scale-95"
                >
                  🚀 ทดสอบคำสั่งผ่าน Bot Simulator
                </Link>
              </div>
            </div>
          </div>

          {/* Quick Broadcast Widget */}
          <div className="modern-card bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-sm space-y-4">
            <h3 className="font-black text-slate-900 text-sm flex items-center gap-2 tracking-tight">
              <span>📢</span>
              <span>คำสั่งด่วนสำหรับคุณครู</span>
            </h3>

            <div className="space-y-2.5 text-xs">
              <Link
                href={`/classrooms/${classroom.id}/attendance`}
                className="w-full p-3.5 rounded-2xl border border-slate-200/80 hover:border-emerald-500 hover:bg-emerald-50/40 transition flex items-center justify-between font-bold text-slate-800 group"
              >
                <span>📋 เช็คชื่อเข้าเรียนวันนี้ (+15 EXP)</span>
                <span className="text-emerald-600 group-hover:translate-x-1 transition">→</span>
              </Link>
              <Link
                href={`/classrooms/${classroom.id}/assignments`}
                className="w-full p-3.5 rounded-2xl border border-slate-200/80 hover:border-rose-500 hover:bg-rose-50/40 transition flex items-center justify-between font-bold text-slate-800 group"
              >
                <span>🔔 กดทวงงานคนค้างส่งเข้า LINE</span>
                <span className="text-rose-600 group-hover:translate-x-1 transition">→</span>
              </Link>
              <Link
                href={`/classrooms/${classroom.id}/monsters`}
                className="w-full p-3.5 rounded-2xl border border-slate-200/80 hover:border-amber-500 hover:bg-amber-50/40 transition flex items-center justify-between font-bold text-slate-800 group"
              >
                <span>✨ ส่องห้องฟักไข่ & สุ่มมอนสเตอร์</span>
                <span className="text-amber-600 group-hover:translate-x-1 transition">→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
