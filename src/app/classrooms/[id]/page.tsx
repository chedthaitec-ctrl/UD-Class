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
    <div className="space-y-6">
      {/* Classroom Banner */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                isLineConnected
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-amber-50 text-amber-700 border border-amber-200"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isLineConnected ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
                }`}
              />
              {isLineConnected
                ? `LINE เชื่อมต่อ (${classroom.lineGroupId})`
                : "ยังไม่ได้ผูก LINE Group"}
            </span>
            <span className="text-xs font-semibold text-slate-400">
              ปีการศึกษา {classroom.academicYear} / เทอม {classroom.term}
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {classroom.name}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            ครูประจำวิชา: {classroom.teacher.name} ({classroom.teacher.email})
          </p>
        </div>

        {/* Quick Tabs Links */}
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/classrooms/${classroom.id}/attendance`}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-500 transition shadow-sm flex items-center gap-1.5"
          >
            <span>📋</span>
            <span>เช็คชื่อวันนี้</span>
          </Link>
          <Link
            href={`/classrooms/${classroom.id}/assignments`}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition shadow-sm flex items-center gap-1.5"
          >
            <span>📝</span>
            <span>การบ้าน ({classroom.assignments.length})</span>
          </Link>
          <Link
            href={`/classrooms/${classroom.id}/monsters`}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-500 text-slate-950 hover:bg-amber-400 transition shadow-sm flex items-center gap-1.5"
          >
            <span>🐣</span>
            <span>ไข่มอนสเตอร์</span>
          </Link>
          <Link
            href={`/classrooms/${classroom.id}/students`}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
          >
            <span>🎒</span>
            <span>รายชื่อนักเรียน ({classroom.students.length})</span>
          </Link>
        </div>
      </div>

      {/* Classroom Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              นักเรียนในห้อง
            </span>
            <span>🎒</span>
          </div>
          <div className="text-2xl font-black text-slate-900">
            {classroom.students.length} คน
          </div>
          <p className="text-[10px] text-emerald-600 font-medium mt-1">
            ผูก LINE แล้ว {classroom.students.filter((s) => s.lineUserId).length} คน
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              การบ้านทั้งหมด
            </span>
            <span>📝</span>
          </div>
          <div className="text-2xl font-black text-slate-900">
            {classroom.assignments.length} งาน
          </div>
          <p className="text-[10px] text-blue-600 font-medium mt-1">
            พร้อมระบบทวงงานอัตโนมัติ
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              ฟักมอนสเตอร์แล้ว
            </span>
            <span>🐣</span>
          </div>
          <div className="text-2xl font-black text-amber-600">
            {hatchedStudentsCount} / {classroom.students.length} คน
          </div>
          <p className="text-[10px] text-slate-500 font-medium mt-1">
            สะสม EXP ครบ 100
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              ประวัติการเช็คชื่อ
            </span>
            <span>📋</span>
          </div>
          <div className="text-2xl font-black text-slate-900">
            {classroom.attendances.length} ครั้ง
          </div>
          <p className="text-[10px] text-emerald-600 font-medium mt-1">
            แจก +15 EXP ทุกครั้ง
          </p>
        </div>
      </div>

      {/* Classroom Content Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Recent Assignments and Roster Preview */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Assignments */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  รายการการบ้านห้องนี้
                </h3>
                <p className="text-xs text-slate-500">
                  ติดตามการส่งงานและการแจก EXP
                </p>
              </div>
              <Link
                href={`/classrooms/${classroom.id}/assignments`}
                className="text-xs font-bold text-emerald-600 hover:text-emerald-700"
              >
                จัดการการบ้านทั้งหมด →
              </Link>
            </div>

            <div className="space-y-3">
              {classroom.assignments.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  ยังไม่มีการบ้านในห้องนี้ กดเพิ่มการบ้านเพื่อเริ่มมอบหมาย
                </div>
              ) : (
                classroom.assignments.map((asg) => {
                  const subCount = asg.submissions.length;
                  const total = classroom.students.length;
                  const percent = total > 0 ? Math.round((subCount / total) * 100) : 0;

                  return (
                    <div
                      key={asg.id}
                      className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-xs">
                            {asg.title}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                            +{asg.expReward} EXP
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 line-clamp-1">
                          {asg.description || "ไม่มีรายละเอียด"}
                        </p>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="w-28 text-right">
                          <span className="text-xs font-bold text-slate-800">
                            {subCount}/{total} คน ({percent}%)
                          </span>
                          <div className="w-full bg-slate-200 h-1.5 rounded-full mt-1 overflow-hidden">
                            <div
                              className="bg-emerald-500 h-full rounded-full"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>

                        <Link
                          href={`/classrooms/${classroom.id}/assignments`}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition"
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
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  รายชื่อนักเรียน & สถานะไข่
                </h3>
                <p className="text-xs text-slate-500">
                  ระดับเลเวล, แต้มคะแนนสะสม และการผูกบัญชี LINE
                </p>
              </div>
              <Link
                href={`/classrooms/${classroom.id}/students`}
                className="text-xs font-bold text-emerald-600 hover:text-emerald-700"
              >
                ดูรายชื่อเต็ม ({classroom.students.length}) →
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-semibold text-[10px] uppercase">
                    <th className="pb-2">เลขที่</th>
                    <th className="pb-2">ชื่อ-สกุล</th>
                    <th className="pb-2">LINE</th>
                    <th className="pb-2">Lv / EXP</th>
                    <th className="pb-2">สถานะไข่/มอนสเตอร์</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {classroom.students.slice(0, 6).map((std) => (
                    <tr key={std.id} className="hover:bg-slate-50">
                      <td className="py-2.5 font-bold text-slate-900">
                        {std.seatNumber}
                      </td>
                      <td className="py-2.5 font-medium text-slate-800">
                        {std.name}
                      </td>
                      <td className="py-2.5">
                        {std.lineUserId ? (
                          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            🟢 ผูกแล้ว
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-medium">
                            ⚪ ยังไม่ผูก
                          </span>
                        )}
                      </td>
                      <td className="py-2.5">
                        <span className="font-bold text-indigo-600">
                          Lv.{std.level}
                        </span>{" "}
                        <span className="text-slate-400 text-[10px]">
                          ({std.exp} EXP)
                        </span>
                      </td>
                      <td className="py-2.5">
                        {std.egg?.isHatched ? (
                          <span className="text-[11px] font-bold text-purple-600">
                            👾 {std.egg.hatchedMonster?.name || "มอนสเตอร์"}
                          </span>
                        ) : (
                          <span className="text-[11px] text-amber-600 font-semibold">
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
          <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-emerald-400 text-sm flex items-center gap-2">
                <span>💬</span>
                <span>คู่มือการเชื่อมต่อ LINE Group</span>
              </h3>
              <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                LINE API
              </span>
            </div>

            <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
              <p>
                1. เพิ่ม UD-Class Bot เป็นเพื่อน และเชิญบ็อตเข้ากลุ่ม LINE ของห้องเรียน
              </p>
              <p>
                2. ในกลุ่ม ให้พิมพ์ <span className="text-emerald-400 font-bold font-mono">#กลุ่ม</span> เพื่อตรวจสอบว่าบ็อตตรวจจับ Group ID ได้
              </p>
              <p>
                3. นำ Group ID มากรอกในช่องด้านล่างเพื่อผูกห้องเรียนโดยอัตโนมัติ:
              </p>

              <div className="p-3 bg-slate-800 rounded-xl border border-slate-700">
                <div className="text-[10px] text-slate-400 mb-1">Group ID ปัจจุบัน:</div>
                <div className="font-mono text-emerald-400 text-xs break-all font-bold">
                  {classroom.lineGroupId || "ยังไม่มี (กรุณาพิมพ์ #กลุ่ม เพื่อดู ID)"}
                </div>
              </div>

              <div className="pt-2">
                <Link
                  href="/simulator"
                  className="w-full text-center py-2.5 rounded-xl text-xs font-bold bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition block"
                >
                  🚀 ทดสอบคำสั่งผ่าน Bot Simulator
                </Link>
              </div>
            </div>
          </div>

          {/* Quick Broadcast Widget */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <span>📢</span>
              <span>คำสั่งด่วนสำหรับคุณครู</span>
            </h3>

            <div className="space-y-2 text-xs">
              <Link
                href={`/classrooms/${classroom.id}/attendance`}
                className="w-full p-3 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/30 transition flex items-center justify-between font-semibold text-slate-800"
              >
                <span>📋 เช็คชื่อเข้าเรียนวันนี้ (+15 EXP)</span>
                <span className="text-emerald-600">→</span>
              </Link>
              <Link
                href={`/classrooms/${classroom.id}/assignments`}
                className="w-full p-3 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/30 transition flex items-center justify-between font-semibold text-slate-800"
              >
                <span>🔔 กดทวงงานคนค้างส่งเข้ากลุ่ม LINE</span>
                <span className="text-rose-600">→</span>
              </Link>
              <Link
                href={`/classrooms/${classroom.id}/monsters`}
                className="w-full p-3 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/30 transition flex items-center justify-between font-semibold text-slate-800"
              >
                <span>✨ ส่องห้องฟักไข่ & สุ่มมอนสเตอร์</span>
                <span className="text-amber-600">→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
