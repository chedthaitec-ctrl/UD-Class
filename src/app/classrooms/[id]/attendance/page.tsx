"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

interface Student {
  id: string;
  seatNumber: number;
  name: string;
  avatarUrl: string | null;
}

type AttendanceStatus = "PRESENT" | "LATE" | "ABSENT" | "LEAVE";

export default function AttendancePage() {
  const params = useParams();
  const classroomId = params.id as string;

  const [classroom, setClassroom] = useState<any>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [attendanceDate, setAttendanceDate] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });
  const [records, setRecords] = useState<Record<string, AttendanceStatus>>({});
  const [broadcastToLine, setBroadcastToLine] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchClassroomAndAttendance();
  }, [classroomId, attendanceDate]);

  const fetchClassroomAndAttendance = async () => {
    try {
      const res = await fetch(`/api/classrooms/${classroomId}`);
      const data = await res.json();
      if (data.success) {
        setClassroom(data.classroom);
        setStudents(data.classroom.students);

        // Fetch existing attendance for this date
        const attRes = await fetch(
          `/api/attendance?classroomId=${classroomId}&date=${attendanceDate}`
        );
        const attData = await attRes.json();

        const initialMap: Record<string, AttendanceStatus> = {};
        if (attData.success && attData.attendances.length > 0) {
          const todayAtt = attData.attendances[0];
          todayAtt.records.forEach((rec: any) => {
            initialMap[rec.studentId] = rec.status as AttendanceStatus;
          });
        } else {
          // Default: all PRESENT
          data.classroom.students.forEach((s: Student) => {
            initialMap[s.id] = "PRESENT";
          });
        }
        setRecords(initialMap);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setRecords((prev) => ({ ...prev, [studentId]: status }));
  };

  const handleMarkAll = (status: AttendanceStatus) => {
    const nextMap: Record<string, AttendanceStatus> = {};
    students.forEach((s) => {
      nextMap[s.id] = status;
    });
    setRecords(nextMap);
  };

  const handleSaveAttendance = async () => {
    setSaving(true);
    setSaveSuccessMessage(null);

    const formattedRecords = Object.entries(records).map(([studentId, status]) => ({
      studentId,
      status,
    }));

    try {
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classroomId,
          date: attendanceDate,
          records: formattedRecords,
          broadcastToLine,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSaveSuccessMessage(
          `บันทึกสำเร็จ! แจก +15 EXP ให้กับนักเรียนที่มาเรียน (${data.stats.present} คน) เรียบร้อย${
            data.pushSuccess ? " และส่งเข้ากลุ่ม LINE แล้ว" : ""
          }`
        );
      } else {
        alert("ข้อผิดพลาด: " + data.error);
      }
    } catch (err: any) {
      alert("เกิดข้อผิดพลาด: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Stats
  const presentCount = Object.values(records).filter((s) => s === "PRESENT").length;
  const lateCount = Object.values(records).filter((s) => s === "LATE").length;
  const absentCount = Object.values(records).filter((s) => s === "ABSENT").length;
  const leaveCount = Object.values(records).filter((s) => s === "LEAVE").length;
  const total = students.length;
  const rate = total > 0 ? Math.round(((presentCount + lateCount) / total) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <Link href={`/classrooms/${classroomId}`} className="hover:text-slate-700">
              {classroom?.name || "ห้องเรียน"}
            </Link>
            <span>/</span>
            <span className="text-slate-600 font-semibold">เช็คชื่อประจำวัน</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            ระบบเช็คชื่อเข้าชั้นเรียน & แจก EXP
          </h2>
          <p className="text-xs text-slate-500">
            เช็คชื่อรายวัน รับทันที +15 EXP ต่อนักเรียนที่มาเรียน พร้อมส่งสรุปเข้า LINE Group
          </p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="date"
            value={attendanceDate}
            onChange={(e) => setAttendanceDate(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Stats Counter Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl text-center">
          <span className="text-[10px] font-bold text-emerald-700 uppercase block">
            มาเรียน (+15 EXP)
          </span>
          <span className="text-2xl font-black text-emerald-800">{presentCount}</span>
        </div>
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-center">
          <span className="text-[10px] font-bold text-amber-700 uppercase block">
            มาสาย (+5 EXP)
          </span>
          <span className="text-2xl font-black text-amber-800">{lateCount}</span>
        </div>
        <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl text-center">
          <span className="text-[10px] font-bold text-rose-700 uppercase block">
            ขาดเรียน
          </span>
          <span className="text-2xl font-black text-rose-800">{absentCount}</span>
        </div>
        <div className="bg-slate-100 border border-slate-200 p-4 rounded-xl text-center">
          <span className="text-[10px] font-bold text-slate-600 uppercase block">
            ลา
          </span>
          <span className="text-2xl font-black text-slate-800">{leaveCount}</span>
        </div>
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl text-center col-span-2 sm:col-span-1">
          <span className="text-[10px] font-bold text-blue-700 uppercase block">
            อัตราการมาเรียน
          </span>
          <span className="text-2xl font-black text-blue-800">{rate}%</span>
        </div>
      </div>

      {saveSuccessMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-800 font-bold flex items-center justify-between animate-fade-in">
          <span>🎉 {saveSuccessMessage}</span>
          <button
            onClick={() => setSaveSuccessMessage(null)}
            className="text-emerald-600 hover:text-emerald-900"
          >
            ✕
          </button>
        </div>
      )}

      {/* Roll Call Sheet */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        {/* Bulk Quick Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <span className="text-xs font-bold text-slate-700">
            ปรับสถานะทั้งห้องแบบเร็ว:
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleMarkAll("PRESENT")}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-800 hover:bg-emerald-200 transition"
            >
              ✅ มาครบทุกคน
            </button>
            <button
              onClick={() => handleMarkAll("LATE")}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-100 text-amber-800 hover:bg-amber-200 transition"
            >
              ⚠️ มาสายทั้งหมด
            </button>
            <button
              onClick={() => handleMarkAll("ABSENT")}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-100 text-rose-800 hover:bg-rose-200 transition"
            >
              ❌ ขาดทั้งหมด
            </button>
          </div>
        </div>

        {/* Student List */}
        {loading ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            กำลังโหลดข้อมูล...
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {students.map((std) => {
              const currentStatus = records[std.id] || "PRESENT";

              return (
                <div
                  key={std.id}
                  className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 px-2 rounded-xl transition"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-black text-xs flex items-center justify-center">
                      {std.seatNumber}
                    </span>
                    <span className="font-bold text-slate-900 text-xs">
                      {std.name}
                    </span>
                  </div>

                  {/* Status Toggle Buttons */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleStatusChange(std.id, "PRESENT")}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                        currentStatus === "PRESENT"
                          ? "bg-emerald-600 text-white shadow-sm"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      มาเรียน (+15)
                    </button>
                    <button
                      onClick={() => handleStatusChange(std.id, "LATE")}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                        currentStatus === "LATE"
                          ? "bg-amber-500 text-white shadow-sm"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      มาสาย (+5)
                    </button>
                    <button
                      onClick={() => handleStatusChange(std.id, "ABSENT")}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                        currentStatus === "ABSENT"
                          ? "bg-rose-600 text-white shadow-sm"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      ขาด
                    </button>
                    <button
                      onClick={() => handleStatusChange(std.id, "LEAVE")}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                        currentStatus === "LEAVE"
                          ? "bg-slate-700 text-white shadow-sm"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      ลา
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer Submit Button */}
        <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="broadcastLineAtt"
              checked={broadcastToLine}
              onChange={(e) => setBroadcastToLine(e.target.checked)}
              className="rounded text-emerald-600 focus:ring-emerald-500"
            />
            <label
              htmlFor="broadcastLineAtt"
              className="text-xs text-slate-700 font-semibold cursor-pointer"
            >
              📲 ส่งใบสรุปการเช็คชื่อเข้ากลุ่ม LINE Group อัตโนมัติ
            </label>
          </div>

          <button
            onClick={handleSaveAttendance}
            disabled={saving}
            className="px-6 py-3 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-lg shadow-emerald-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <span>💾</span>
            <span>
              {saving ? "กำลังบันทึกและแจก EXP..." : "บันทึกและแจก +15 EXP ให้ทุกคน"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
