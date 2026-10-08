"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import * as XLSX from "xlsx";

interface Student {
  id: string;
  seatNumber: number;
  name: string;
  avatarUrl: string | null;
}

type AttendanceStatus = "PRESENT" | "LATE" | "ABSENT" | "SICK_LEAVE" | "PERSONAL_LEAVE";

export default function AttendancePage() {
  const params = useParams();
  const classroomId = params.id as string;

  const [classroom, setClassroom] = useState<any>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [attendanceDate, setAttendanceDate] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });
  const [records, setRecords] = useState<Record<string, AttendanceStatus>>({});
  const [allAttendances, setAllAttendances] = useState<any[]>([]);
  const [broadcastToLine, setBroadcastToLine] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
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
            let st = rec.status;
            if (st === "LEAVE") st = "PERSONAL_LEAVE";
            initialMap[rec.studentId] = st as AttendanceStatus;
          });
        } else {
          // Default: all PRESENT
          data.classroom.students.forEach((s: Student) => {
            initialMap[s.id] = "PRESENT";
          });
        }
        setRecords(initialMap);

        // Fetch all attendances for cumulative history (for Excel export)
        const allAttRes = await fetch(`/api/attendance?classroomId=${classroomId}`);
        const allAttData = await allAttRes.json();
        if (allAttData.success) {
          setAllAttendances(allAttData.attendances || []);
        }
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

  // Export to Excel (.xlsx) function
  const handleExportExcel = () => {
    setExporting(true);
    try {
      const wb = XLSX.utils.book_new();

      // Sheet 1: สรุปผลเช็คชื่อประจำวัน (วันที่เลือก)
      const dailyRows = students.map((std, idx) => {
        const status = records[std.id] || "PRESENT";
        let statusLabel = "มาเรียน";
        let expEarned = 0;

        if (status === "PRESENT") {
          statusLabel = "มาเรียน";
          expEarned = 15;
        } else if (status === "LATE") {
          statusLabel = "มาสาย";
          expEarned = 5;
        } else if (status === "ABSENT") {
          statusLabel = "ขาด";
          expEarned = 0;
        } else if (status === "SICK_LEAVE") {
          statusLabel = "ลาป่วย";
          expEarned = 0;
        } else if (status === "PERSONAL_LEAVE") {
          statusLabel = "ลากิจ";
          expEarned = 0;
        }

        return {
          "ลำดับ": idx + 1,
          "เลขที่": std.seatNumber > 0 ? std.seatNumber : "-",
          "ชื่อ-นามสกุล": std.name,
          "สถานะ": statusLabel,
          "EXP ที่ได้รับ": expEarned,
          "วันที่เช็คชื่อ": attendanceDate,
          "ห้องเรียน": classroom?.name || "",
        };
      });

      // แถวสรุปผลรวมท้ายตาราง
      dailyRows.push(
        { "ลำดับ": "" as any, "เลขที่": "" as any, "ชื่อ-นามสกุล": "" as any, "สถานะ": "" as any, "EXP ที่ได้รับ": "" as any, "วันที่เช็คชื่อ": "" as any, "ห้องเรียน": "" as any },
        {
          "ลำดับ": "สรุปผลรวม" as any,
          "เลขที่": `มาเรียน: ${presentCount} คน` as any,
          "ชื่อ-นามสกุล": `มาสาย: ${lateCount} คน` as any,
          "สถานะ": `ขาด: ${absentCount} คน` as any,
          "EXP ที่ได้รับ": `ลาป่วย: ${sickLeaveCount} คน` as any,
          "วันที่เช็คชื่อ": `ลากิจ: ${personalLeaveCount} คน` as any,
          "ห้องเรียน": `รวมทั้งหมด: ${students.length} คน (เข้าเรียน ${rate}%)` as any,
        }
      );

      const wsDaily = XLSX.utils.json_to_sheet(dailyRows);
      XLSX.utils.book_append_sheet(wb, wsDaily, `เช็คชื่อ_${attendanceDate}`);

      // Sheet 2: สรุปสถิติสะสมของนักเรียนในห้องทั้งหมด
      if (allAttendances.length > 0) {
        const cumulativeRows = students.map((std, idx) => {
          let stdPresent = 0;
          let stdLate = 0;
          let stdAbsent = 0;
          let stdSick = 0;
          let stdPersonal = 0;

          allAttendances.forEach((att) => {
            const rec = att.records.find((r: any) => r.studentId === std.id);
            if (rec) {
              if (rec.status === "PRESENT") stdPresent++;
              else if (rec.status === "LATE") stdLate++;
              else if (rec.status === "ABSENT") stdAbsent++;
              else if (rec.status === "SICK_LEAVE") stdSick++;
              else if (rec.status === "PERSONAL_LEAVE" || rec.status === "LEAVE") stdPersonal++;
            }
          });

          const totalDays = allAttendances.length;
          const attendedRate = totalDays > 0 ? Math.round(((stdPresent + stdLate) / totalDays) * 100) : 0;

          return {
            "ลำดับ": idx + 1,
            "เลขที่": std.seatNumber > 0 ? std.seatNumber : "-",
            "ชื่อ-นามสกุล": std.name,
            "มาเรียน (ครั้ง)": stdPresent,
            "มาสาย (ครั้ง)": stdLate,
            "ขาด (ครั้ง)": stdAbsent,
            "ลาป่วย (ครั้ง)": stdSick,
            "ลากิจ (ครั้ง)": stdPersonal,
            "รวมวันเช็คชื่อทั้งหมด": totalDays,
            "อัตราเข้าเรียนสะสม (%)": `${attendedRate}%`,
          };
        });

        const wsCumulative = XLSX.utils.json_to_sheet(cumulativeRows);
        XLSX.utils.book_append_sheet(wb, wsCumulative, "สถิติสะสมภาพรวม");
      }

      // ดาวน์โหลดไฟล์ Excel ทันที
      const fileName = `สรุปผลเช็คชื่อ_${classroom?.name || "ห้องเรียน"}_${attendanceDate}.xlsx`;
      XLSX.writeFile(wb, fileName);
    } catch (err: any) {
      alert("เกิดข้อผิดพลาดในการดาวน์โหลด Excel: " + err.message);
    } finally {
      setExporting(false);
    }
  };

  // Stats calculation
  const presentCount = Object.values(records).filter((s) => s === "PRESENT").length;
  const lateCount = Object.values(records).filter((s) => s === "LATE").length;
  const absentCount = Object.values(records).filter((s) => s === "ABSENT").length;
  const sickLeaveCount = Object.values(records).filter((s) => s === "SICK_LEAVE").length;
  const personalLeaveCount = Object.values(records).filter((s) => s === "PERSONAL_LEAVE").length;
  const total = students.length;
  const rate = total > 0 ? Math.round(((presentCount + lateCount) / total) * 100) : 0;

  return (
    <div className="space-y-8 animate-fade-in font-prompt">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-slate-800">
        <div className="absolute -right-12 -bottom-12 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-0 right-1/4 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Link href={`/classrooms/${classroomId}`} className="hover:text-white transition flex items-center gap-1 font-semibold">
                <span>←</span>
                <span>{classroom?.name || "ห้องเรียน"}</span>
              </Link>
              <span>/</span>
              <span className="text-emerald-400 font-bold">เช็คชื่อประจำวัน</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              ระบบเช็คชื่อเข้าชั้นเรียน & แจก EXP
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              เช็คชื่อรายวัน มาเรียน (+15 EXP), มาสาย (+5 EXP), ขาด / ลาป่วย / ลากิจ (0 EXP ไม่แจก EXP) พร้อมระบบส่งใบสรุปเข้ากลุ่ม LINE
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Date picker */}
            <div className="flex items-center gap-2 bg-white/10 px-3.5 py-2 rounded-2xl border border-white/10 backdrop-blur">
              <span className="text-xs text-slate-300">📅 วันที่:</span>
              <input
                type="date"
                value={attendanceDate}
                onChange={(e) => setAttendanceDate(e.target.value)}
                className="bg-transparent text-white text-xs font-bold outline-none cursor-pointer"
              />
            </div>

            {/* Excel Download Button */}
            <button
              onClick={handleExportExcel}
              disabled={exporting || loading}
              className="px-4 py-2.5 rounded-2xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition shadow-lg shadow-emerald-500/25 flex items-center gap-2 active:scale-95 disabled:opacity-50 cursor-pointer"
              title="ดาวน์โหลดสรุปผล มาเรียน มาสาย ขาด ลาป่วย ลากิจ ออกมาเป็นไฟล์ Excel"
            >
              <span>📊</span>
              <span>{exporting ? "กำลังส่งออก..." : "ดาวน์โหลด Excel"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Counter Bar (5 สถานะ: มาเรียน, มาสาย, ขาด, ลาป่วย, ลากิจ) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* มาเรียน */}
        <div className="modern-card bg-white border border-emerald-200/80 p-4 rounded-3xl shadow-sm text-center">
          <div className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block">
            มาเรียน (+15)
          </div>
          <div className="text-2xl font-black text-emerald-800 tracking-tight mt-1">
            {presentCount}
          </div>
          <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">+15 EXP</div>
        </div>

        {/* มาสาย */}
        <div className="modern-card bg-white border border-amber-200/80 p-4 rounded-3xl shadow-sm text-center">
          <div className="text-[11px] font-bold text-amber-700 uppercase tracking-wider block">
            มาสาย (+5)
          </div>
          <div className="text-2xl font-black text-amber-800 tracking-tight mt-1">
            {lateCount}
          </div>
          <div className="text-[10px] text-amber-600 font-semibold mt-0.5">+5 EXP</div>
        </div>

        {/* ขาดเรียน */}
        <div className="modern-card bg-white border border-rose-200/80 p-4 rounded-3xl shadow-sm text-center">
          <div className="text-[11px] font-bold text-rose-700 uppercase tracking-wider block">
            ขาดเรียน
          </div>
          <div className="text-2xl font-black text-rose-800 tracking-tight mt-1">
            {absentCount}
          </div>
          <div className="text-[10px] text-rose-600 font-semibold mt-0.5">0 EXP</div>
        </div>

        {/* ลาป่วย */}
        <div className="modern-card bg-white border border-indigo-200/80 p-4 rounded-3xl shadow-sm text-center">
          <div className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider block">
            ลาป่วย
          </div>
          <div className="text-2xl font-black text-indigo-800 tracking-tight mt-1">
            {sickLeaveCount}
          </div>
          <div className="text-[10px] text-indigo-600 font-semibold mt-0.5">0 EXP</div>
        </div>

        {/* ลากิจ */}
        <div className="modern-card bg-white border border-purple-200/80 p-4 rounded-3xl shadow-sm text-center">
          <div className="text-[11px] font-bold text-purple-700 uppercase tracking-wider block">
            ลากิจ
          </div>
          <div className="text-2xl font-black text-purple-800 tracking-tight mt-1">
            {personalLeaveCount}
          </div>
          <div className="text-[10px] text-purple-600 font-semibold mt-0.5">0 EXP (ไม่แจก)</div>
        </div>

        {/* อัตราการเข้าเรียน */}
        <div className="modern-card bg-white border border-blue-200/80 p-4 rounded-3xl shadow-sm text-center col-span-2 sm:col-span-1">
          <div className="text-[11px] font-bold text-blue-700 uppercase tracking-wider block">
            เข้าเรียน
          </div>
          <div className="text-2xl font-black text-blue-800 tracking-tight mt-1">
            {rate}%
          </div>
          <div className="text-[10px] text-blue-600 font-semibold mt-0.5">
            {presentCount + lateCount}/{total} คน
          </div>
        </div>
      </div>

      {saveSuccessMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl text-xs text-emerald-800 font-bold flex items-center justify-between animate-fade-in shadow-sm">
          <span>🎉 {saveSuccessMessage}</span>
          <button
            onClick={() => setSaveSuccessMessage(null)}
            className="text-emerald-600 hover:text-emerald-900 font-bold px-2 py-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Roll Call Sheet Card */}
      <div className="modern-card bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-7 space-y-5">
        {/* Bulk Quick Action Bar & Excel Download Shortcut */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700">
              ปรับสถานะทั้งห้องแบบเร็ว:
            </span>
            <button
              onClick={() => handleMarkAll("PRESENT")}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-100 text-emerald-800 hover:bg-emerald-200 transition"
            >
              ✅ มาครบทุกคน
            </button>
            <button
              onClick={() => handleMarkAll("LATE")}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-100 text-amber-800 hover:bg-amber-200 transition"
            >
              ⚠️ มาสายทั้งหมด
            </button>
            <button
              onClick={() => handleMarkAll("ABSENT")}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-100 text-rose-800 hover:bg-rose-200 transition"
            >
              ❌ ขาดทั้งหมด
            </button>
          </div>

          <button
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition shadow-sm"
          >
            <span>📥</span>
            <span>ส่งออก Excel</span>
          </button>
        </div>

        {/* Student List */}
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            กำลังโหลดข้อมูลนักเรียน...
          </div>
        ) : students.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            ยังไม่มีนักเรียนในห้องเรียนนี้
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {students.map((std) => {
              const currentStatus = records[std.id] || "PRESENT";

              return (
                <div
                  key={std.id}
                  className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 px-3 rounded-2xl transition"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 font-black text-xs flex items-center justify-center shrink-0">
                      {std.seatNumber > 0 ? std.seatNumber : "-"}
                    </span>
                    <div className="min-w-0">
                      <div className="font-bold text-slate-900 text-xs truncate">
                        {std.name}
                      </div>
                      {std.seatNumber > 0 ? (
                        <span className="text-[10px] text-slate-400">เลขที่ {std.seatNumber}</span>
                      ) : (
                        <span className="text-[10px] text-amber-600 font-semibold">(ยังไม่ระบุเลขที่)</span>
                      )}
                    </div>
                  </div>

                  {/* 5 Status Toggle Buttons */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    {/* มาเรียน */}
                    <button
                      onClick={() => handleStatusChange(std.id, "PRESENT")}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                        currentStatus === "PRESENT"
                          ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/25"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      มาเรียน (+15)
                    </button>

                    {/* มาสาย */}
                    <button
                      onClick={() => handleStatusChange(std.id, "LATE")}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                        currentStatus === "LATE"
                          ? "bg-amber-500 text-white shadow-md shadow-amber-500/25"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      มาสาย (+5)
                    </button>

                    {/* ขาด */}
                    <button
                      onClick={() => handleStatusChange(std.id, "ABSENT")}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                        currentStatus === "ABSENT"
                          ? "bg-rose-600 text-white shadow-md shadow-rose-600/25"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      ขาด
                    </button>

                    {/* ลาป่วย */}
                    <button
                      onClick={() => handleStatusChange(std.id, "SICK_LEAVE")}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                        currentStatus === "SICK_LEAVE"
                          ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/25"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      ลาป่วย
                    </button>

                    {/* ลากิจ */}
                    <button
                      onClick={() => handleStatusChange(std.id, "PERSONAL_LEAVE")}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                        currentStatus === "PERSONAL_LEAVE"
                          ? "bg-purple-600 text-white shadow-md shadow-purple-600/25"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                      title="ลากิจ (0 EXP ไม่แจกแต้ม)"
                    >
                      ลากิจ
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
              className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
            />
            <label
              htmlFor="broadcastLineAtt"
              className="text-xs text-slate-700 font-bold cursor-pointer"
            >
              📲 ส่งใบสรุปการเช็คชื่อเข้ากลุ่ม LINE Group อัตโนมัติ
            </label>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleExportExcel}
              className="px-4 py-3 rounded-2xl text-xs font-bold bg-slate-100 text-slate-800 hover:bg-slate-200 transition flex items-center gap-1.5"
            >
              <span>📊</span>
              <span>ส่งออก Excel</span>
            </button>

            <button
              onClick={handleSaveAttendance}
              disabled={saving}
              className="px-6 py-3 rounded-2xl text-xs font-black bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-lg shadow-emerald-600/25 disabled:opacity-50 flex items-center justify-center gap-2 active:scale-95"
            >
              <span>💾</span>
              <span>
                {saving ? "กำลังบันทึกและแจก EXP..." : "บันทึกและแจก +15 EXP ให้ทุกคน"}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
