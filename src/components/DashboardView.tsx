"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface ClassroomItem {
  id: string;
  name: string;
  lineGroupId: string | null;
  academicYear: string;
  term: string;
  teacher: {
    name: string;
    email?: string;
  };
  _count: {
    students: number;
    assignments: number;
    attendances?: number;
  };
}

interface AssignmentItem {
  id: string;
  classroomId: string;
  title: string;
  description: string | null;
  dueDate: string;
  maxScore: number;
  expReward: number;
  classroom: {
    name: string;
  };
  submissions: any[];
}

interface StudentItem {
  id: string;
  seatNumber: number;
  name: string;
  level: number;
  exp: number;
  totalPoints: number;
  classroom: {
    name: string;
  };
  egg?: {
    isHatched: boolean;
    hatchedMonster?: {
      name: string;
    } | null;
  } | null;
}

interface DashboardViewProps {
  initialUser?: {
    id: string;
    name: string;
    email: string;
    role: "ADMIN" | "TEACHER";
    department?: string | null;
    phone?: string | null;
  } | null;
  initialStats: {
    classroomsCount: number;
    studentsCount: number;
    lineLinkedStudentsCount: number;
    assignmentsCount: number;
    hatchedEggsCount: number;
    presentCount: number;
    attendanceRate: number;
  };
  initialClassrooms: ClassroomItem[];
  initialRecentAssignments: AssignmentItem[];
  initialTopStudents: StudentItem[];
  initialDbError?: string | null;
}

export default function DashboardView({
  initialUser,
  initialStats,
  initialClassrooms,
  initialRecentAssignments,
  initialTopStudents,
  initialDbError,
}: DashboardViewProps) {
  const [currentUser, setCurrentUser] = useState<any>(initialUser || null);
  const [stats, setStats] = useState(initialStats);
  const [classrooms, setClassrooms] = useState<ClassroomItem[]>(initialClassrooms);
  const [recentAssignments, setRecentAssignments] = useState<AssignmentItem[]>(initialRecentAssignments);
  const [topStudents, setTopStudents] = useState<StudentItem[]>(initialTopStudents);
  const [dbError, setDbError] = useState<string | null>(initialDbError || null);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // State สำหรับการลบห้องเรียน
  const [deletingClassroom, setDeletingClassroom] = useState<ClassroomItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // ดึงข้อมูลที่เป็นปัจจุบันทันทีเมื่อเปิดหน้าจอ
  useEffect(() => {
    setLastUpdated(new Date().toLocaleTimeString("th-TH"));
    fetchLatestData(false);
  }, []);

  const fetchLatestData = async (showToast = true) => {
    setIsRefreshing(true);
    try {
      const res = await fetch(`/api/dashboard?_t=${Date.now()}`, {
        cache: "no-store",
        headers: { Pragma: "no-cache" },
      });
      const data = await res.json();
      if (data.success) {
        if (data.currentUser) {
          setCurrentUser(data.currentUser);
        }
        setStats(data.stats);
        setClassrooms(data.classrooms);
        setRecentAssignments(data.recentAssignments);
        setTopStudents(data.topStudents);
        setDbError(null);
        const timeStr = new Date().toLocaleTimeString("th-TH");
        setLastUpdated(timeStr);
        if (showToast) {
          showNotification(`อัปเดตข้อมูลเป็นปัจจุบันแล้ว (${timeStr})`);
        }
      } else if (data.error) {
        console.warn("Dashboard sync notice:", data.error);
      }
    } catch (err: any) {
      console.error("Dashboard refresh error:", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const showNotification = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleDeleteClassroom = async () => {
    if (!deletingClassroom) return;
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/classrooms/${deletingClassroom.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        const deletedName = deletingClassroom.name;
        setDeletingClassroom(null);
        showNotification(`ลบห้องเรียน "${deletedName}" เรียบร้อยแล้ว`);
        // รีเฟรชข้อมูลสถิติและรายชื่อห้องเรียนใหม่ทันที
        await fetchLatestData(false);
      } else {
        alert("ไม่สามารถลบห้องเรียนได้: " + (data.error || "Unknown error"));
      }
    } catch (err: any) {
      alert("เกิดข้อผิดพลาดในการลบ: " + err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-8 relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-emerald-500/30 flex items-center gap-3 animate-bounce">
          <span className="text-emerald-400 text-base">✅</span>
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Database Warning Banner */}
      {dbError && (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl p-5 flex items-start gap-4 shadow-sm">
          <span className="text-2xl">⚠️</span>
          <div className="space-y-1">
            <h4 className="font-bold text-sm text-amber-900">
              สถานะการเชื่อมต่อฐานข้อมูล
            </h4>
            <p className="text-xs text-amber-800 leading-relaxed">
              ระบบกำลังเชื่อมโยงฐานข้อมูล หรือหากรันบน Vercel Production แนะนำเชื่อมต่อกับ Supabase / PostgreSQL โดยระบุตัวแปร <code className="bg-amber-100 font-mono px-1.5 py-0.5 rounded text-amber-950 font-bold">DATABASE_URL</code> ใน Vercel Environment Variables
            </p>
          </div>
        </div>
      )}

      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-emerald-500/10 to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <span>🌟 UD-Class Gamification & LINE Bot</span>
              </span>
              {currentUser?.role === "ADMIN" ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  <span>🛡️ สิทธิ์ผู้ดูแลระบบ (Super Admin)</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  <span>👨‍🏫 ครูผู้สอน: {currentUser?.department || "กลุ่มสาระฯ"}</span>
                </span>
              )}
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              ยินดีต้อนรับ, {currentUser?.name || "คุณครูผู้สอน"}
            </h2>
            <p className="text-sm text-slate-300 max-w-xl">
              {currentUser?.role === "ADMIN"
                ? "ศูนย์ควบคุมส่วนกลาง: ดูแลคุณครูทุกท่าน จัดการเพิ่ม/ลบสมาชิกครู และตรวจสอบห้องเรียนทั้งหมดในโรงเรียน"
                : "จัดการห้องเรียนของคุณครู เช็คชื่อ มอบหมายงาน และแจ้งเตือนอัตโนมัติเข้ากลุ่ม LINE (แสดงเฉพาะห้องเรียนที่คุณครูดูแล)"}
            </p>
            {lastUpdated && (
              <p className="text-[11px] text-emerald-400 font-medium flex items-center gap-1.5 pt-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>ข้อมูลล่าสุดเมื่อเวลา: {lastUpdated}</span>
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* ปุ่มรีเฟรชหน้าจอเป็นปัจจุบัน */}
            <button
              type="button"
              onClick={() => fetchLatestData(true)}
              disabled={isRefreshing}
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-white text-slate-900 hover:bg-slate-100 transition shadow-lg flex items-center gap-2 disabled:opacity-50"
              title="กดเพื่อดึงข้อมูลที่เป็นปัจจุบันที่สุดจากระบบ"
            >
              <span className={`text-base ${isRefreshing ? "animate-spin" : ""}`}>🔄</span>
              <span>{isRefreshing ? "กำลังรีเฟรช..." : "รีเฟรชข้อมูลล่าสุด"}</span>
            </button>

            {currentUser?.role === "ADMIN" && (
              <Link
                href="/admin/teachers"
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition shadow-lg shadow-indigo-500/25 flex items-center gap-2"
              >
                <span>👥</span>
                <span>จัดการคุณครู (แอดมิน)</span>
              </Link>
            )}

            <Link
              href="/simulator"
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition shadow-lg shadow-emerald-500/25 flex items-center gap-2"
            >
              <span>💬</span>
              <span>ทดสอบ LINE Bot</span>
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
          <div className="text-2xl font-black text-slate-900">{stats.classroomsCount}</div>
          <p className="text-[11px] text-emerald-600 font-medium mt-1">พร้อมเปิดการสอน</p>
        </div>

        {/* Students */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">นักเรียนทั้งหมด</span>
            <span className="text-lg">🎒</span>
          </div>
          <div className="text-2xl font-black text-slate-900">{stats.studentsCount}</div>
          <p className="text-[11px] text-slate-500 font-medium mt-1">
            ผูก LINE แล้ว {stats.lineLinkedStudentsCount} คน
          </p>
        </div>

        {/* Assignments */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">การบ้านที่มอบหมาย</span>
            <span className="text-lg">📝</span>
          </div>
          <div className="text-2xl font-black text-slate-900">{stats.assignmentsCount}</div>
          <p className="text-[11px] text-blue-600 font-medium mt-1">มีการบ้านที่ต้องส่ง</p>
        </div>

        {/* Attendance Rate */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">การเข้าเรียนวันนี้</span>
            <span className="text-lg">📋</span>
          </div>
          <div className="text-2xl font-black text-slate-900">{stats.attendanceRate}%</div>
          <p className="text-[11px] text-emerald-600 font-medium mt-1">
            มาเรียน {stats.presentCount} คน (+15 EXP)
          </p>
        </div>

        {/* Hatched Monsters */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm hover:shadow-md transition col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">มอนสเตอร์ที่ฟักแล้ว</span>
            <span className="text-lg">🐣</span>
          </div>
          <div className="text-2xl font-black text-emerald-600">{stats.hatchedEggsCount}</div>
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
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <span>ห้องเรียนของฉัน</span>
                  <span className="text-xs font-normal text-slate-400">({classrooms.length} ห้อง)</span>
                </h3>
                <p className="text-xs text-slate-500">ห้องเรียนที่ดูแลและการเชื่อมโยงกับ LINE Group</p>
              </div>

              <div className="flex items-center gap-3">
                {/* ปุ่มรีเฟรชเฉพาะส่วนห้องเรียน */}
                <button
                  type="button"
                  onClick={() => fetchLatestData(true)}
                  disabled={isRefreshing}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition flex items-center gap-1.5"
                  title="รีเฟรชข้อมูลห้องเรียนให้เป็นปัจจุบัน"
                >
                  <span className={isRefreshing ? "animate-spin" : ""}>🔄</span>
                  <span>รีเฟรช</span>
                </button>
                <Link
                  href="/classrooms"
                  className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                >
                  จัดการห้องเรียนทั้งหมด →
                </Link>
              </div>
            </div>

            {/* การ์ดห้องเรียนพร้อมปุ่ม ลบ */}
            {classrooms.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center space-y-3">
                <span className="text-4xl block">🏫</span>
                <h4 className="font-bold text-slate-800 text-sm">ยังไม่มีห้องเรียน</h4>
                <p className="text-xs text-slate-500">
                  คุณครูสามารถสร้างห้องเรียนใหม่ หรือผูกกลุ่ม LINE ได้ที่หน้าจัดการห้องเรียน
                </p>
                <div>
                  <Link
                    href="/classrooms"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition"
                  >
                    <span>➕ สร้างห้องเรียนใหม่</span>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {classrooms.map((cls) => {
                  const isLineConnected = !!cls.lineGroupId;
                  return (
                    <div
                      key={cls.id}
                      className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:border-slate-300 hover:shadow-md transition flex flex-col justify-between relative group"
                    >
                      <div>
                        {/* Top bar with Badge and Quick Delete Icon */}
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

                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-400 font-medium">
                              ปี {cls.academicYear} / เทอม {cls.term}
                            </span>
                            {/* ปุ่มไอคอนถังขยะด้านบน */}
                            <button
                              type="button"
                              onClick={() => setDeletingClassroom(cls)}
                              className="w-7 h-7 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition border border-transparent hover:border-rose-200"
                              title="ลบห้องเรียนนี้"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>

                        <h4 className="font-bold text-slate-900 text-base mb-1">
                          {cls.name}
                        </h4>
                        <p className="text-xs text-slate-500 mb-4 line-clamp-1">
                          ผู้สอน: {cls.teacher.name}
                        </p>

                        <div className="grid grid-cols-2 gap-2 p-2.5 bg-slate-50 rounded-xl text-xs mb-4 border border-slate-100">
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

                      {/* แถบปุ่มด้านล่าง พร้อมปุ่ม "ลบ" ชัดเจน */}
                      <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                        <Link
                          href={`/classrooms/${cls.id}`}
                          className="flex-1 text-center py-2 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition"
                        >
                          เข้าสู่ห้องเรียน
                        </Link>
                        <Link
                          href={`/classrooms/${cls.id}/attendance`}
                          className="px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition whitespace-nowrap"
                          title="เช็คชื่อทันที"
                        >
                          📋 เช็คชื่อ
                        </Link>
                        {/* ปุ่ม ลบ สีแดงชัดเจน */}
                        <button
                          type="button"
                          onClick={() => setDeletingClassroom(cls)}
                          className="px-3 py-2 rounded-xl text-xs font-bold bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition flex items-center gap-1 shadow-sm hover:shadow"
                          title="ลบห้องเรียนนี้ถาวร"
                        >
                          <span>🗑️</span>
                          <span>ลบ</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Assignments Monitor */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
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
              {recentAssignments.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">ยังไม่มีการบ้านที่มอบหมาย</div>
              ) : (
                recentAssignments.map((asg) => {
                  const totalSubs = asg.submissions?.length || 0;
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
                          ห้อง: {asg.classroom?.name} • กำหนดส่ง:{" "}
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
                          ตรวจงาน
                        </Link>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Leaderboard & Quick Tools (1 Col) */}
        <div className="space-y-8">
          {/* Top Trainers Leaderboard */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">อันดับเทรนเนอร์ยอดเยี่ยม</h3>
                <p className="text-xs text-slate-500">นักเรียนที่มีคะแนน & EXP สูงสุด</p>
              </div>
              <span className="text-xl">🏆</span>
            </div>

            <div className="space-y-3">
              {topStudents.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">ยังไม่มีข้อมูลคะแนนนักเรียน</div>
              ) : (
                topStudents.map((std, idx) => {
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
                })
              )}
            </div>
          </div>

          {/* Quick LINE Bot Commands Cheat Sheet */}
          <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-sm space-y-4">
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

      {/* Modal ยืนยันการลบห้องเรียน (เชื่อมต่อกับ backend เดียวกันกับหน้าจัดการห้องเรียน) */}
      {deletingClassroom && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center gap-3 text-rose-600 pb-2 border-b border-slate-100">
              <span className="text-2xl">⚠️</span>
              <h3 className="font-bold text-slate-900 text-base">
                ยืนยันการลบห้องเรียน
              </h3>
            </div>

            <p className="text-slate-600 leading-relaxed">
              คุณต้องการลบห้องเรียน{" "}
              <strong className="text-slate-900 text-sm">
                "{deletingClassroom.name}"
              </strong>{" "}
              ใช่หรือไม่?
            </p>

            <div className="p-3.5 bg-rose-50 rounded-2xl border border-rose-200 text-rose-800 space-y-1">
              <div className="font-bold">⚠️ ข้อมูลที่จะถูกลบออกถาวร:</div>
              <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                <li>
                  รายชื่อนักเรียนทั้งหมด ({deletingClassroom._count.students} คน)
                </li>
                <li>ไข่มอนสเตอร์และประวัติการสะสม EXP ของนักเรียนในห้องนี้</li>
                <li>
                  การบ้านและการส่งงานทั้งหมด ({deletingClassroom._count.assignments} ชิ้น)
                </li>
                {deletingClassroom._count.attendances !== undefined && (
                  <li>
                    ประวัติการเช็คชื่อเข้าเรียน ({deletingClassroom._count.attendances} ครั้ง)
                  </li>
                )}
              </ul>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeletingClassroom(null)}
                className="px-4 py-2.5 rounded-xl font-semibold text-slate-600 hover:bg-slate-100 transition disabled:opacity-50"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteClassroom}
                className="px-5 py-2.5 rounded-xl font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-600/25 transition disabled:opacity-50 flex items-center gap-1.5"
              >
                <span>🗑️</span>
                <span>{isDeleting ? "กำลังลบ..." : "ยืนยันลบห้องเรียน"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
