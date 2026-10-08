"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Teacher {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "TEACHER";
  department: string | null;
  phone: string | null;
  createdAt: string;
  classrooms: {
    id: string;
    name: string;
    academicYear: string;
    term: string;
    _count: {
      students: number;
      assignments: number;
      attendances: number;
    };
  }[];
  stats?: {
    classroomsCount: number;
    studentsCount: number;
    assignmentsCount: number;
  };
}

export default function AdminTeachersPage() {
  const router = useRouter();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [deletingTeacher, setDeletingTeacher] = useState<Teacher | null>(null);

  // Form States
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "admin", // default
    role: "TEACHER",
    department: "กลุ่มสาระฯ วิทยาศาสตร์และเทคโนโลยี",
    phone: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const departmentsList = [
    "กลุ่มสาระฯ วิทยาศาสตร์และเทคโนโลยี",
    "กลุ่มสาระฯ คณิตศาสตร์",
    "กลุ่มสาระฯ ภาษาไทย",
    "กลุ่มสาระฯ ภาษาต่างประเทศ",
    "กลุ่มสาระฯ สังคมศึกษา ศาสนา และวัฒนธรรม",
    "กลุ่มสาระฯ สุขศึกษาและพลศึกษา",
    "กลุ่มสาระฯ ศิลปะ",
    "กลุ่มสาระฯ การงานอาชีพ",
    "ศูนย์เทคโนโลยีสารสนเทศ (IT Center)",
    "ฝ่ายบริหารวิชาการ",
  ];

  useEffect(() => {
    fetchTeachers();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchTeachers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/teachers");
      const data = await res.json();
      if (data.success) {
        setTeachers(data.teachers);
        if (data.currentUser) {
          setCurrentUser(data.currentUser);
        }
      } else {
        setErrorMsg(data.error || "ไม่สามารถโหลดข้อมูลครูได้");
      }
    } catch (err: any) {
      setErrorMsg("ข้อผิดพลาดในการเชื่อมต่อ: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/admin/teachers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        setShowAddModal(false);
        setFormData({
          name: "",
          email: "",
          password: "admin",
          role: "TEACHER",
          department: "กลุ่มสาระฯ วิทยาศาสตร์และเทคโนโลยี",
          phone: "",
        });
        showToast(data.message || "เพิ่มคุณครูใหม่เรียบร้อยแล้ว");
        fetchTeachers();
      } else {
        setErrorMsg(data.error || "เกิดข้อผิดพลาดในการเพิ่มครู");
      }
    } catch (err: any) {
      setErrorMsg("ข้อผิดพลาด: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeacher) return;
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/admin/teachers/${editingTeacher.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editingTeacher.name,
          email: editingTeacher.email,
          role: editingTeacher.role,
          department: editingTeacher.department,
          phone: editingTeacher.phone,
          ...(formData.password ? { password: formData.password } : {}),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setEditingTeacher(null);
        showToast("บันทึกการแก้ไขข้อมูลครูเรียบร้อยแล้ว");
        fetchTeachers();
      } else {
        setErrorMsg(data.error || "เกิดข้อผิดพลาดในการแก้ไข");
      }
    } catch (err: any) {
      setErrorMsg("ข้อผิดพลาด: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTeacher = async () => {
    if (!deletingTeacher) return;
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/admin/teachers/${deletingTeacher.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        const deletedName = deletingTeacher.name;
        setDeletingTeacher(null);
        showToast(`ลบคุณครู "${deletedName}" เรียบร้อยแล้ว`);
        fetchTeachers();
      } else {
        alert("ไม่สามารถลบได้: " + data.error);
      }
    } catch (err: any) {
      alert("เกิดข้อผิดพลาด: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSwitchTeacher = async (teacher: Teacher) => {
    try {
      const res = await fetch("/api/auth/switch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teacherId: teacher.id }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`สลับการทำงานเป็น "${teacher.name}" เรียบร้อยแล้ว`);
        setTimeout(() => {
          router.push("/");
          router.refresh();
        }, 600);
      } else {
        alert("ไม่สามารถสลับบัญชีได้: " + data.error);
      }
    } catch (err: any) {
      alert("ข้อผิดพลาด: " + err.message);
    }
  };

  // Filtered teachers list
  const filteredTeachers = teachers.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.department && t.department.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesRole =
      roleFilter === "ALL" || t.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  const totalClassrooms = teachers.reduce(
    (sum, t) => sum + (t.classrooms?.length || 0),
    0
  );
  const totalStudents = teachers.reduce(
    (sum, t) => sum + (t.stats?.studentsCount || 0),
    0
  );

  return (
    <div className="space-y-8">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-emerald-500/30 flex items-center gap-3 animate-bounce">
          <span className="text-emerald-400 text-base">✅</span>
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-slate-800">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              <span>🛡️ ศูนย์ควบคุมผู้ดูแลระบบ (Admin Panel)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              จัดการสมาชิกคุณครู & ระบบห้องเรียน
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              ควบคุมรายชื่อคุณครูผู้สอนในโรงเรียน เพิ่ม/ลบคุณครู กำหนดสิทธิ์ และดูแลความปลอดภัย โดยห้องเรียนจะถูกแยกเฉพาะของคุณครูแต่ละท่าน ไม่ปะปนกัน
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => {
                setErrorMsg(null);
                setFormData({
                  name: "",
                  email: "",
                  password: "admin",
                  role: "TEACHER",
                  department: "กลุ่มสาระฯ วิทยาศาสตร์และเทคโนโลยี",
                  phone: "",
                });
                setShowAddModal(true);
              }}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition shadow-lg shadow-emerald-500/25 flex items-center gap-2"
            >
              <span className="text-sm">➕</span>
              <span>เพิ่มคุณครูใหม่</span>
            </button>
            <button
              onClick={fetchTeachers}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white transition backdrop-blur border border-white/10 flex items-center gap-2 disabled:opacity-50"
            >
              <span className={`text-sm ${loading ? "animate-spin" : ""}`}>🔄</span>
              <span>รีเฟรช</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-2xl font-bold">
            👥
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              ครูในระบบทั้งหมด
            </p>
            <h3 className="text-2xl font-black text-slate-900">
              {teachers.length} <span className="text-xs font-normal text-slate-500">ท่าน</span>
            </h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-2xl font-bold">
            🏫
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              ห้องเรียนทั้งโรงเรียน
            </p>
            <h3 className="text-2xl font-black text-slate-900">
              {totalClassrooms} <span className="text-xs font-normal text-slate-500">ห้อง</span>
            </h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-2xl font-bold">
            🎒
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              นักเรียนในความดูแลรวม
            </p>
            <h3 className="text-2xl font-black text-slate-900">
              {totalStudents} <span className="text-xs font-normal text-slate-500">คน</span>
            </h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-2xl font-bold">
            🛡️
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              ผู้ดูแลระบบใหญ่ (Admin)
            </p>
            <h3 className="text-2xl font-black text-slate-900">
              {teachers.filter((t) => t.role === "ADMIN").length}{" "}
              <span className="text-xs font-normal text-slate-500">ท่าน</span>
            </h3>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="w-full sm:w-80 relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
            🔍
          </span>
          <input
            type="text"
            placeholder="ค้นหาชื่อครู, อีเมล หรือกลุ่มสาระฯ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-slate-500 font-semibold whitespace-nowrap">
            สิทธิ์:
          </span>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="ALL">ทั้งหมด ({teachers.length})</option>
            <option value="TEACHER">
              คุณครูผู้สอน ({teachers.filter((t) => t.role === "TEACHER").length})
            </option>
            <option value="ADMIN">
              ผู้ดูแลระบบ ({teachers.filter((t) => t.role === "ADMIN").length})
            </option>
          </select>
        </div>
      </div>

      {/* Teachers List Table / Cards */}
      {loading ? (
        <div className="p-16 text-center text-slate-400 text-sm">
          กำลังโหลดรายชื่อคุณครู...
        </div>
      ) : filteredTeachers.length === 0 ? (
        <div className="bg-white rounded-3xl p-16 text-center border border-slate-200 shadow-sm">
          <div className="text-5xl mb-3">👨‍🏫</div>
          <h3 className="font-bold text-slate-800 text-base mb-1">
            ไม่พบรายชื่อคุณครูที่ค้นหา
          </h3>
          <p className="text-xs text-slate-500 mb-5">
            สามารถเพิ่มคุณครูใหม่ได้โดยกดปุ่ม "เพิ่มคุณครูใหม่" ด้านบน
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTeachers.map((teacher) => {
            const isAdmin = teacher.role === "ADMIN";
            const isSelf = currentUser?.id === teacher.id;

            return (
              <div
                key={teacher.id}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition flex flex-col justify-between overflow-hidden relative group"
              >
                {/* Card Top */}
                <div className="p-6 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-black shadow-inner ${
                          isAdmin
                            ? "bg-amber-100 text-amber-800 border border-amber-200"
                            : "bg-indigo-100 text-indigo-700 border border-indigo-200"
                        }`}
                      >
                        {teacher.name.charAt(0) || "ค"}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-slate-900 text-sm">
                            {teacher.name}
                          </h3>
                          {isSelf && (
                            <span className="px-1.5 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-700 rounded-md">
                              คุณ
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 truncate">
                          {teacher.email}
                        </p>
                      </div>
                    </div>

                    {/* Role Badge */}
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                        isAdmin
                          ? "bg-amber-50 text-amber-800 border border-amber-200"
                          : "bg-blue-50 text-blue-700 border border-blue-200"
                      }`}
                    >
                      <span>{isAdmin ? "🛡️" : "👨‍🏫"}</span>
                      <span>{isAdmin ? "แอดมินใหญ่" : "ครูผู้สอน"}</span>
                    </span>
                  </div>

                  {/* Department & Contact */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 text-[11px]">กลุ่มสาระฯ:</span>
                      <span className="font-semibold text-slate-700 truncate max-w-[170px]">
                        {teacher.department || "-"}
                      </span>
                    </div>
                    {teacher.phone && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 text-[11px]">เบอร์โทร:</span>
                        <span className="font-mono text-slate-700">
                          {teacher.phone}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Classrooms managed by this teacher */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700">
                        ห้องเรียนที่ดูแล ({teacher.classrooms.length} ห้อง):
                      </span>
                      <span className="text-[11px] text-slate-400">
                        นักเรียนรวม {teacher.stats?.studentsCount || 0} คน
                      </span>
                    </div>

                    {teacher.classrooms.length === 0 ? (
                      <div className="p-3 rounded-xl border border-dashed border-slate-200 text-center text-[11px] text-slate-400">
                        ยังไม่มีห้องเรียนในความดูแล
                      </div>
                    ) : (
                      <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                        {teacher.classrooms.map((cls) => (
                          <div
                            key={cls.id}
                            className="p-2 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between text-[11px]"
                          >
                            <span className="font-medium text-slate-800 truncate">
                              🏫 {cls.name}
                            </span>
                            <span className="text-slate-400 text-[10px] whitespace-nowrap ml-2">
                              {cls._count.students} นักเรียน
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between gap-2">
                  {/* Switch to this teacher button */}
                  <button
                    onClick={() => handleSwitchTeacher(teacher)}
                    className="flex-1 py-2 px-3 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition flex items-center justify-center gap-1.5 shadow-sm"
                    title="สลับบัญชีเพื่อดูหน้าจอและห้องเรียนของครูท่านนี้"
                  >
                    <span>👁️</span>
                    <span>สลับดูห้องเรียน</span>
                  </button>

                  {/* Edit button */}
                  <button
                    onClick={() => {
                      setErrorMsg(null);
                      setEditingTeacher({ ...teacher });
                      setFormData((prev) => ({ ...prev, password: "" }));
                    }}
                    className="p-2 rounded-xl text-xs font-semibold bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 transition"
                    title="แก้ไขข้อมูลครู"
                  >
                    ✏️
                  </button>

                  {/* Delete button (cannot delete self) */}
                  <button
                    onClick={() => setDeletingTeacher(teacher)}
                    disabled={isSelf}
                    className="p-2 rounded-xl text-xs font-semibold bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition disabled:opacity-30 disabled:cursor-not-allowed"
                    title={isSelf ? "ไม่สามารถลบบัญชีตัวเองได้" : "ลบคุณครูท่านนี้"}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal เพิ่มคุณครูใหม่ */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-5 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl">
                  ➕
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base">
                    เพิ่มคุณครูผู้สอนใหม่
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    สร้างบัญชีคุณครูเพื่อนำไปจัดการห้องเรียนของตนเอง
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-medium">
                ⚠️ {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreateTeacher} className="space-y-4">
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  ชื่อ-นามสกุล *
                </label>
                <input
                  type="text"
                  required
                  placeholder="เช่น ครูสุภาพร สุขสมบูรณ์"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    อีเมล (ใช้เข้าสู่ระบบ) *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="teacher@school.ac.th"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    รหัสผ่านเริ่มต้น *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น 123456"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    กลุ่มสาระการเรียนรู้
                  </label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl bg-white text-slate-700"
                  >
                    {departmentsList.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    สิทธิ์การใช้งาน
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl bg-white text-slate-700"
                  >
                    <option value="TEACHER">👨‍🏫 คุณครูผู้สอน (จัดการเฉพาะห้องตนเอง)</option>
                    <option value="ADMIN">🛡️ ผู้ดูแลระบบใหญ่ (Super Admin)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  เบอร์โทรศัพท์ (ถ้ามี)
                </label>
                <input
                  type="text"
                  placeholder="081-xxx-xxxx"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-xl font-semibold text-slate-600 hover:bg-slate-100"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/25 disabled:opacity-50 flex items-center gap-1.5"
                >
                  <span>{isSubmitting ? "กำลังบันทึก..." : "บันทึกข้อมูลครู"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal แก้ไขข้อมูลครู */}
      {editingTeacher && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-5 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-xl">
                  ✏️
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base">
                    แก้ไขข้อมูลคุณครู
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    แก้ไขข้อมูล รหัสผ่าน หรือสิทธิ์ของ {editingTeacher.name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingTeacher(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-medium">
                ⚠️ {errorMsg}
              </div>
            )}

            <form onSubmit={handleUpdateTeacher} className="space-y-4">
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  ชื่อ-นามสกุล *
                </label>
                <input
                  type="text"
                  required
                  value={editingTeacher.name}
                  onChange={(e) =>
                    setEditingTeacher({ ...editingTeacher, name: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    อีเมล *
                  </label>
                  <input
                    type="email"
                    required
                    value={editingTeacher.email}
                    onChange={(e) =>
                      setEditingTeacher({ ...editingTeacher, email: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    เปลี่ยนรหัสผ่านใหม่ (เว้นว่างหากไม่เปลี่ยน)
                  </label>
                  <input
                    type="text"
                    placeholder="กรอกรหัสใหม่..."
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    กลุ่มสาระการเรียนรู้
                  </label>
                  <select
                    value={editingTeacher.department || ""}
                    onChange={(e) =>
                      setEditingTeacher({ ...editingTeacher, department: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl bg-white"
                  >
                    {departmentsList.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    สิทธิ์การใช้งาน
                  </label>
                  <select
                    value={editingTeacher.role}
                    onChange={(e) =>
                      setEditingTeacher({
                        ...editingTeacher,
                        role: e.target.value as "ADMIN" | "TEACHER",
                      })
                    }
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl bg-white"
                  >
                    <option value="TEACHER">👨‍🏫 คุณครูผู้สอน</option>
                    <option value="ADMIN">🛡️ ผู้ดูแลระบบใหญ่ (Super Admin)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  เบอร์โทรศัพท์
                </label>
                <input
                  type="text"
                  value={editingTeacher.phone || ""}
                  onChange={(e) =>
                    setEditingTeacher({ ...editingTeacher, phone: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingTeacher(null)}
                  className="px-4 py-2.5 rounded-xl font-semibold text-slate-600 hover:bg-slate-100"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/25 disabled:opacity-50"
                >
                  {isSubmitting ? "กำลังบันทึก..." : "บันทึกการแก้ไข"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal ยืนยันการลบครูผู้สอน */}
      {deletingTeacher && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center gap-3 text-rose-600 pb-2 border-b border-slate-100">
              <span className="text-3xl">⚠️</span>
              <div>
                <h3 className="font-black text-slate-900 text-base">
                  ยืนยันการลบคุณครู
                </h3>
                <p className="text-[11px] text-slate-400">
                  การกระทำนี้ไม่สามารถย้อนกลับได้
                </p>
              </div>
            </div>

            <p className="text-slate-600 leading-relaxed">
              คุณแน่ใจหรือไม่ว่าต้องการลบคุณครู{" "}
              <strong className="text-slate-900 text-sm">
                "{deletingTeacher.name}"
              </strong>{" "}
              ออกจากระบบ?
            </p>

            <div className="p-3.5 bg-rose-50 rounded-2xl border border-rose-200 text-rose-800 space-y-1.5">
              <div className="font-bold">⚠️ ข้อมูลที่จะถูกลบออกถาวร:</div>
              <ul className="list-disc list-inside space-y-1 text-[11px]">
                <li>บัญชีและข้อมูลของคุณครู {deletingTeacher.name}</li>
                <li>
                  ห้องเรียนทั้งหมดที่ครูท่านนี้ดูแล ({deletingTeacher.classrooms.length} ห้อง)
                </li>
                <li>นักเรียน การบ้าน และผลการส่งงานทั้งหมดในห้องเรียนของครูท่านนี้</li>
              </ul>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setDeletingTeacher(null)}
                className="px-4 py-2.5 rounded-xl font-semibold text-slate-600 hover:bg-slate-100 transition disabled:opacity-50"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleDeleteTeacher}
                className="px-5 py-2.5 rounded-xl font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-600/25 transition disabled:opacity-50 flex items-center gap-1.5"
              >
                <span>🗑️</span>
                <span>{isSubmitting ? "กำลังลบ..." : "ยืนยันลบคุณครู"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
