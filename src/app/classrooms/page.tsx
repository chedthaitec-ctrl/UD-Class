"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Classroom {
  id: string;
  name: string;
  lineGroupId: string | null;
  academicYear: string;
  term: string;
  teacher: {
    name: string;
  };
  _count: {
    students: number;
    assignments: number;
    attendances: number;
  };
}

export default function ClassroomsPage() {
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [teachersList, setTeachersList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    lineGroupId: "",
    academicYear: "2569",
    term: "1",
    teacherId: "",
  });
  const [creating, setCreating] = useState(false);
  const [broadcastStatus, setBroadcastStatus] = useState<string | null>(null);

  // State สำหรับการลบห้องเรียน
  const [deletingClassroom, setDeletingClassroom] = useState<Classroom | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchClassrooms();
  }, []);

  const fetchClassrooms = async () => {
    try {
      const res = await fetch("/api/classrooms");
      const data = await res.json();
      if (data.success) {
        setClassrooms(data.classrooms);
        if (data.currentUser) {
          setCurrentUser(data.currentUser);
          if (data.currentUser.role === "ADMIN") {
            // ดึงรายชื่อครูทั้งหมดเพื่อให้แอดมินเลือกกำหนดครูผู้สอนได้
            fetch("/api/admin/teachers")
              .then((r) => r.json())
              .then((tData) => {
                if (tData.success && tData.teachers) {
                  setTeachersList(tData.teachers);
                }
              })
              .catch(() => {});
          }
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;
    setCreating(true);

    try {
      const res = await fetch("/api/classrooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        setShowCreateModal(false);
        setFormData({ name: "", lineGroupId: "", academicYear: "2569", term: "1", teacherId: "" });
        fetchClassrooms();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
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
        setDeletingClassroom(null);
        fetchClassrooms();
      } else {
        alert("ไม่สามารถลบห้องเรียนได้: " + data.error);
      }
    } catch (err: any) {
      alert("เกิดข้อผิดพลาดในการลบ: " + err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleTestBroadcast = async (classroomId: string) => {
    setBroadcastStatus("กำลังส่งข้อความทดสอบเข้ากลุ่ม LINE...");
    try {
      const res = await fetch(`/api/classrooms/${classroomId}/broadcast`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "text",
          text: "🚀 ทดสอบการส่งข้อความจากระบบ UD-Class System ไปยังกลุ่ม LINE เรียบร้อยแล้ว!",
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert(data.note || "ส่งข้อความทดสอบเรียบร้อยแล้ว!");
      } else {
        alert("ข้อผิดพลาด: " + data.error);
      }
    } catch (err: any) {
      alert("เกิดข้อผิดพลาด: " + err.message);
    } finally {
      setBroadcastStatus(null);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Modern Header Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-slate-800">
        <div className="absolute -right-12 -bottom-12 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-0 right-1/4 w-40 h-40 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-white/10 text-white/90 border border-white/10 backdrop-blur-md">
                🏫 ห้องเรียนและรายวิชา
              </span>
              {currentUser?.role === "ADMIN" ? (
                <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  🛡️ ทุกห้องเรียน (Super Admin)
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  👨‍🏫 ห้องของคุณครู: {currentUser?.name || "ครูผู้สอน"}
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              จัดการห้องเรียน (Classrooms)
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              {currentUser?.role === "ADMIN"
                ? "ศูนย์ควบคุมห้องเรียนทั้งหมดของโรงเรียนอุดมดรุณี กำหนดคุณครูผู้สอน จัดการ LINE Group และติดตามการส่งงาน"
                : `บริหารจัดการห้องเรียนในความดูแลของคุณครู (${currentUser?.name || ""}) เชื่อมต่อกลุ่ม LINE และติดตามการเข้าเรียน`}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setFormData({
                  name: "",
                  lineGroupId: "",
                  academicYear: "2569",
                  term: "1",
                  teacherId: currentUser?.id || "",
                });
                setShowCreateModal(true);
              }}
              className="px-5 py-3 rounded-2xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition shadow-lg shadow-emerald-500/25 flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <span className="text-sm">➕</span>
              <span>สร้างห้องเรียนใหม่</span>
            </button>
            <button
              onClick={fetchClassrooms}
              disabled={loading}
              className="p-3 rounded-2xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white transition backdrop-blur border border-white/10 flex items-center justify-center disabled:opacity-50"
              title="รีเฟรชข้อมูล"
            >
              <span className={`text-sm ${loading ? "animate-spin" : ""}`}>🔄</span>
            </button>
          </div>
        </div>
      </div>

      {/* Classrooms Grid */}
      {loading ? (
        <div className="p-16 text-center text-slate-400 text-sm">
          <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          กำลังโหลดข้อมูลห้องเรียน...
        </div>
      ) : classrooms.length === 0 ? (
        <div className="bg-white rounded-3xl p-16 text-center border border-slate-200/80 shadow-sm max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-3xl bg-slate-100 flex items-center justify-center text-3xl mx-auto mb-4">
            🏫
          </div>
          <h3 className="font-bold text-slate-900 text-base mb-1">
            ยังไม่มีห้องเรียนในระบบ
          </h3>
          <p className="text-xs text-slate-500 mb-6 max-w-sm mx-auto">
            เริ่มต้นใช้งานโดยการสร้างห้องเรียนแรก กำหนดชื่อวิชา และเชื่อมต่อกลุ่ม LINE
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-5 py-2.5 rounded-2xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition shadow-md"
          >
            ➕ สร้างห้องเรียนใหม่ตอนนี้
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classrooms.map((cls) => {
            const hasLine = !!cls.lineGroupId;

            return (
              <div
                key={cls.id}
                className="modern-card bg-white rounded-3xl border border-slate-200/80 p-6 flex flex-col justify-between relative group"
              >
                <div>
                  {/* Top Status & Year Pill */}
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold ${
                        hasLine
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200/80"
                          : "bg-amber-50 text-amber-700 border border-amber-200/80"
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          hasLine ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
                        }`}
                      />
                      {hasLine ? "LINE เชื่อมต่อแล้ว" : "ยังไม่ได้ผูก LINE"}
                    </span>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-semibold text-slate-400 bg-slate-100 px-2.5 py-0.5 rounded-full">
                        ปี {cls.academicYear} / {cls.term}
                      </span>
                      {/* Quick Delete Button */}
                      <button
                        onClick={() => setDeletingClassroom(cls)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition"
                        title="ลบห้องเรียนนี้"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>

                  {/* Header Title with Icon */}
                  <div className="flex items-start gap-3.5 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white flex items-center justify-center text-xl font-bold shadow-md shadow-indigo-500/20 shrink-0">
                      📖
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-base font-black text-slate-900 tracking-tight truncate group-hover:text-indigo-600 transition">
                        {cls.name}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1 truncate">
                        <span>👨‍🏫</span>
                        <span>ผู้สอน: {cls.teacher.name}</span>
                      </p>
                    </div>
                  </div>

                  {/* LINE Group ID Box */}
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs mb-5">
                    <div className="text-[10px] text-slate-400 font-semibold mb-0.5 uppercase tracking-wider">
                      LINE Group ID
                    </div>
                    <div className="font-mono text-slate-700 text-[11px] truncate select-all">
                      {cls.lineGroupId || "(ยังไม่ได้กำหนด Group ID)"}
                    </div>
                  </div>

                  {/* Summary Counters */}
                  <div className="grid grid-cols-3 gap-2.5 text-center text-xs mb-6">
                    <div className="p-3 rounded-2xl bg-indigo-50/50 border border-indigo-100/60">
                      <span className="text-slate-400 block text-[10px] font-semibold">นักเรียน</span>
                      <span className="text-base font-black text-indigo-700">
                        {cls._count.students}
                      </span>
                    </div>
                    <div className="p-3 rounded-2xl bg-violet-50/50 border border-violet-100/60">
                      <span className="text-slate-400 block text-[10px] font-semibold">การบ้าน</span>
                      <span className="text-base font-black text-violet-700">
                        {cls._count.assignments}
                      </span>
                    </div>
                    <div className="p-3 rounded-2xl bg-emerald-50/50 border border-emerald-100/60">
                      <span className="text-slate-400 block text-[10px] font-semibold">เช็คชื่อ</span>
                      <span className="text-base font-black text-emerald-700">
                        {cls._count.attendances}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Action Buttons */}
                <div className="pt-4 border-t border-slate-100 flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/classrooms/${cls.id}`}
                      className="flex-1 text-center py-2.5 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition shadow-sm"
                    >
                      จัดการห้องเรียน
                    </Link>
                    <Link
                      href={`/classrooms/${cls.id}/attendance`}
                      className="px-3.5 py-2.5 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition"
                      title="เช็คชื่อเข้าเรียน"
                    >
                      📋 เช็คชื่อ
                    </Link>
                    <button
                      onClick={() => setDeletingClassroom(cls)}
                      className="px-3 py-2.5 rounded-xl text-xs font-bold bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition flex items-center gap-1"
                      title="ลบห้องเรียน"
                    >
                      <span>🗑️</span>
                      <span>ลบ</span>
                    </button>
                  </div>

                  {hasLine && (
                    <button
                      onClick={() => handleTestBroadcast(cls.id)}
                      className="w-full text-center py-2 rounded-xl text-[11px] font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition border border-dashed border-slate-200"
                    >
                      📢 ทดสอบส่งข้อความเข้ากลุ่ม LINE
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal ยืนยันการลบห้องเรียน */}
      {deletingClassroom && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl space-y-4 text-xs border border-slate-100">
            <div className="flex items-center gap-3 text-rose-600 pb-3 border-b border-slate-100">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 flex items-center justify-center text-xl shrink-0">
                ⚠️
              </div>
              <div>
                <h3 className="font-black text-slate-900 text-base">
                  ยืนยันการลบห้องเรียน
                </h3>
                <p className="text-[11px] text-slate-400">
                  โปรดตรวจสอบข้อมูลก่อนยืนยันการลบ
                </p>
              </div>
            </div>

            <p className="text-slate-600 leading-relaxed text-xs">
              คุณต้องการลบห้องเรียน <strong className="text-slate-900 font-bold">"{deletingClassroom.name}"</strong> ใช่หรือไม่?
            </p>

            <div className="p-4 bg-rose-50/80 rounded-2xl border border-rose-200/80 text-rose-900 space-y-2">
              <div className="font-bold flex items-center gap-1.5 text-xs text-rose-700">
                <span>⚠️</span>
                <span>ข้อมูลที่จะถูกลบออกถาวร:</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-[11px] text-rose-800">
                <li>รายชื่อนักเรียนทั้งหมด ({deletingClassroom._count.students} คน)</li>
                <li>ไข่มอนสเตอร์และประวัติการสะสม EXP ทั้งหมด</li>
                <li>การบ้านและประวัติการส่งงาน ({deletingClassroom._count.assignments} ชิ้น)</li>
                <li>ประวัติการเช็คชื่อเข้าเรียน ({deletingClassroom._count.attendances} ครั้ง)</li>
              </ul>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeletingClassroom(null)}
                className="px-4 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition disabled:opacity-50"
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

      {/* Modal สร้างห้องเรียนใหม่ */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl space-y-5 border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl shrink-0">
                  ➕
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base">
                    สร้างห้องเรียนใหม่
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    กำหนดชื่อรายวิชาและเชื่อมกลุ่ม LINE
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              {currentUser?.role === "ADMIN" && teachersList.length > 0 && (
                <div>
                  <label className="block text-slate-700 font-bold mb-1.5">
                    กำหนดคุณครูผู้สอน *
                  </label>
                  <select
                    value={formData.teacherId || currentUser?.id || ""}
                    onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl bg-white text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    {teachersList.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.department || t.role})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-slate-700 font-bold mb-1.5">
                  ชื่อห้องเรียน / วิชา *
                </label>
                <input
                  type="text"
                  required
                  placeholder="เช่น วิทยาศาสตร์ ม.3/1"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1.5">
                  LINE Group ID (ถ้ามี)
                </label>
                <input
                  type="text"
                  placeholder="เช่น Ca1234567890abcdef... หรือ C-sci301-group"
                  value={formData.lineGroupId}
                  onChange={(e) => setFormData({ ...formData, lineGroupId: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-xs"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  💡 ดึงบ็อตเข้ากลุ่ม LINE แล้วพิมพ์ <code className="bg-slate-100 px-1 py-0.5 rounded">#กลุ่ม</code> เพื่อดู Group ID
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1.5">
                    ปีการศึกษา
                  </label>
                  <input
                    type="text"
                    value={formData.academicYear}
                    onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1.5">
                    ภาคเรียน (เทอม)
                  </label>
                  <input
                    type="text"
                    value={formData.term}
                    onChange={(e) => setFormData({ ...formData, term: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2.5 rounded-xl font-bold bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50 transition shadow-md"
                >
                  {creating ? "กำลังสร้าง..." : "บันทึกห้องเรียน"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
