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
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    lineGroupId: "",
    academicYear: "2569",
    term: "1",
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
        setFormData({ name: "", lineGroupId: "", academicYear: "2569", term: "1" });
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            จัดการห้องเรียน (Classrooms)
          </h2>
          <p className="text-xs text-slate-500">
            สร้างห้องเรียน แก้ไข ผูก Group ID กับ LINE หรือลบห้องเรียนที่ไม่ใช้งาน
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition shadow-sm"
        >
          <span>➕</span>
          <span>สร้างห้องเรียนใหม่</span>
        </button>
      </div>

      {/* Classrooms Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 text-sm">
          กำลังโหลดข้อมูลห้องเรียน...
        </div>
      ) : classrooms.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
          <div className="text-4xl mb-3">🏫</div>
          <h3 className="font-bold text-slate-800 text-base mb-1">
            ยังไม่มีห้องเรียนในระบบ
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            เริ่มต้นด้วยการสร้างห้องเรียนแรกของคุณครู
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-500"
          >
            สร้างห้องเรียนใหม่
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classrooms.map((cls) => {
            const hasLine = !!cls.lineGroupId;

            return (
              <div
                key={cls.id}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition overflow-hidden flex flex-col justify-between relative group"
              >
                <div className="p-6">
                  {/* Status Bar & Delete Button */}
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        hasLine
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-amber-50 text-amber-700 border border-amber-200"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          hasLine ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
                        }`}
                      />
                      {hasLine ? "ผูก LINE Group แล้ว" : "ยังไม่ได้ผูก LINE"}
                    </span>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-medium text-slate-400">
                        ปี {cls.academicYear} / เทอม {cls.term}
                      </span>
                      {/* Quick Delete Icon */}
                      <button
                        onClick={() => setDeletingClassroom(cls)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                        title="ลบห้องเรียนนี้"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 mb-1">
                    {cls.name}
                  </h3>
                  <p className="text-xs text-slate-500 mb-4">
                    ผู้สอน: {cls.teacher.name}
                  </p>

                  {/* LINE Group ID Box */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs mb-4">
                    <div className="text-[10px] text-slate-400 font-semibold mb-0.5">
                      LINE Group ID:
                    </div>
                    <div className="font-mono text-slate-700 truncate select-all">
                      {cls.lineGroupId || "(ยังไม่ได้กำหนด ID)"}
                    </div>
                  </div>

                  {/* Summary Counters */}
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-2.5 rounded-xl bg-slate-50">
                      <span className="text-slate-400 block text-[10px]">นักเรียน</span>
                      <span className="text-sm font-black text-slate-800">
                        {cls._count.students} คน
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50">
                      <span className="text-slate-400 block text-[10px]">การบ้าน</span>
                      <span className="text-sm font-black text-slate-800">
                        {cls._count.assignments} งาน
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50">
                      <span className="text-slate-400 block text-[10px]">เช็คชื่อ</span>
                      <span className="text-sm font-black text-slate-800">
                        {cls._count.attendances} ครั้ง
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Action Buttons */}
                <div className="p-4 bg-slate-50/70 border-t border-slate-100 flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/classrooms/${cls.id}`}
                      className="flex-1 text-center py-2 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition"
                    >
                      จัดการห้องเรียน
                    </Link>
                    <Link
                      href={`/classrooms/${cls.id}/attendance`}
                      className="px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition"
                      title="เช็คชื่อ"
                    >
                      📋 เช็คชื่อ
                    </Link>
                    <button
                      onClick={() => setDeletingClassroom(cls)}
                      className="px-3 py-2 rounded-xl text-xs font-semibold bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition flex items-center gap-1"
                      title="ลบห้องเรียน"
                    >
                      <span>🗑️</span>
                      <span>ลบ</span>
                    </button>
                  </div>

                  {hasLine && (
                    <button
                      onClick={() => handleTestBroadcast(cls.id)}
                      className="w-full text-center py-1.5 rounded-lg text-[11px] font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
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
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center gap-3 text-rose-600 pb-2 border-b border-slate-100">
              <span className="text-2xl">⚠️</span>
              <h3 className="font-bold text-slate-900 text-base">
                ยืนยันการลบห้องเรียน
              </h3>
            </div>

            <p className="text-slate-600 leading-relaxed">
              คุณต้องการลบห้องเรียน <strong className="text-slate-900 text-sm">"{deletingClassroom.name}"</strong> ใช่หรือไม่?
            </p>

            <div className="p-3.5 bg-rose-50 rounded-2xl border border-rose-200 text-rose-800 space-y-1">
              <div className="font-bold">⚠️ ข้อมูลที่จะถูกลบออกถาวร:</div>
              <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                <li>รายชื่อนักเรียนทั้งหมด ({deletingClassroom._count.students} คน)</li>
                <li>ไข่มอนสเตอร์และประวัติการสะสม EXP ของนักเรียนในห้องนี้</li>
                <li>การบ้านและการส่งงานทั้งหมด ({deletingClassroom._count.assignments} ชิ้น)</li>
                <li>ประวัติการเช็คชื่อเข้าเรียน ({deletingClassroom._count.attendances} ครั้ง)</li>
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

      {/* Modal สร้างห้องเรียนใหม่ */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">
                สร้างห้องเรียนใหม่
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  ชื่อห้องเรียน / วิชา *
                </label>
                <input
                  type="text"
                  required
                  placeholder="เช่น วิทยาศาสตร์ ม.3/1"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  LINE Group ID (ถ้ามี)
                </label>
                <input
                  type="text"
                  placeholder="เช่น C-sci301-demo-group หรือ Ca1234..."
                  value={formData.lineGroupId}
                  onChange={(e) => setFormData({ ...formData, lineGroupId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-xs"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  💡 ดึงบ็อตเข้ากลุ่ม LINE แล้วพิมพ์ #กลุ่ม เพื่อดู Group ID
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    ปีการศึกษา
                  </label>
                  <input
                    type="text"
                    value={formData.academicYear}
                    onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    ภาคเรียน (เทอม)
                  </label>
                  <input
                    type="text"
                    value={formData.term}
                    onChange={(e) => setFormData({ ...formData, term: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50"
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
