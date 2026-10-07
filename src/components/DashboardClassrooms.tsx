"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export interface ClassroomSummary {
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

interface DashboardClassroomsProps {
  initialClassrooms: ClassroomSummary[];
}

export default function DashboardClassrooms({
  initialClassrooms,
}: DashboardClassroomsProps) {
  const router = useRouter();
  const [classrooms, setClassrooms] = useState<ClassroomSummary[]>(initialClassrooms);
  const [deletingClassroom, setDeletingClassroom] = useState<ClassroomSummary | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteClassroom = async () => {
    if (!deletingClassroom) return;
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/classrooms/${deletingClassroom.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setClassrooms((prev) => prev.filter((c) => c.id !== deletingClassroom.id));
        setDeletingClassroom(null);
        router.refresh();
      } else {
        alert("ไม่สามารถลบห้องเรียนได้: " + (data.error || "Unknown error"));
      }
    } catch (err: any) {
      alert("เกิดข้อผิดพลาดในการลบ: " + err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  if (classrooms.length === 0) {
    return (
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
            <span>➕ ไปที่หน้าจัดการห้องเรียน</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
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
                    <span className="font-bold text-slate-800">
                      {cls._count.students} คน
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">การบ้าน</span>
                    <span className="font-bold text-slate-800">
                      {cls._count.assignments} ชิ้น
                    </span>
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
                  className="px-3 py-2 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition whitespace-nowrap"
                  title="เช็คชื่อทันที"
                >
                  📋 เช็คชื่อ
                </Link>
                <button
                  type="button"
                  onClick={() => setDeletingClassroom(cls)}
                  className="px-2.5 py-2 rounded-lg text-xs font-semibold bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition flex items-center gap-1"
                  title="ลบห้องเรียน"
                >
                  <span>🗑️</span>
                  <span>ลบ</span>
                </button>
              </div>
            </div>
          );
        })}
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
    </>
  );
}
