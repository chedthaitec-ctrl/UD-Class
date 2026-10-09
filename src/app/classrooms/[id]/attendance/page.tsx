"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import * as XLSX from "xlsx";
import {
  Calendar,
  BarChart3,
  Download,
  CheckCircle2,
  Clock,
  XCircle,
  HelpCircle,
  AlertTriangle,
  UserCheck
} from "lucide-react";

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
  const [activeTab, setActiveTab] = useState<"DAILY" | "CUMULATIVE">("DAILY");
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

        // Fetch all attendances for cumulative history (for Excel export & Overview bar)
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
          `บันทึกข้อมูลการเช็คชื่อสำเร็จเรียบร้อย! (มาเรียน ${data.stats.present} คน, มาสาย ${data.stats.late} คน, ขาด ${data.stats.absent} คน)${
            data.pushSuccess ? " และส่งใบสรุปเข้ากลุ่ม LINE แล้ว" : ""
          }`
        );
        // Refresh all attendances to keep cumulative stats fresh
        const allAttRes = await fetch(`/api/attendance?classroomId=${classroomId}`);
        const allAttData = await allAttRes.json();
        if (allAttData.success) {
          setAllAttendances(allAttData.attendances || []);
        }
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

        if (status === "PRESENT") {
          statusLabel = "มาเรียน";
        } else if (status === "LATE") {
          statusLabel = "มาสาย";
        } else if (status === "ABSENT") {
          statusLabel = "ขาด";
        } else if (status === "SICK_LEAVE") {
          statusLabel = "ลาป่วย";
        } else if (status === "PERSONAL_LEAVE") {
          statusLabel = "ลากิจ";
        }

        return {
          "ลำดับ": idx + 1,
          "เลขที่": std.seatNumber > 0 ? std.seatNumber : "-",
          "ชื่อ-นามสกุล": std.name,
          "สถานะ": statusLabel,
          "วันที่เช็คชื่อ": attendanceDate,
          "ห้องเรียน": classroom?.name || "",
        };
      });

      // แถวสรุปผลรวมท้ายตาราง Sheet 1
      dailyRows.push(
        { "ลำดับ": "" as any, "เลขที่": "" as any, "ชื่อ-นามสกุล": "" as any, "สถานะ": "" as any, "วันที่เช็คชื่อ": "" as any, "ห้องเรียน": "" as any },
        {
          "ลำดับ": "สรุปผลรวม" as any,
          "เลขที่": `มาเรียน: ${presentCount} คน` as any,
          "ชื่อ-นามสกุล": `มาสาย: ${lateCount} คน` as any,
          "สถานะ": `ขาด: ${absentCount} คน` as any,
          "วันที่เช็คชื่อ": `ลาป่วย: ${sickLeaveCount} / ลากิจ: ${personalLeaveCount} คน` as any,
          "ห้องเรียน": `รวมทั้งหมด: ${students.length} คน (เข้าเรียน ${rate}%)` as any,
        }
      );

      const wsDaily = XLSX.utils.json_to_sheet(dailyRows);
      XLSX.utils.book_append_sheet(wb, wsDaily, `เช็คชื่อ_${attendanceDate}`);

      // Sheet 2: สถิติสะสมภาพรวม (ตลอดทั้งเทอม)
      if (allAttendances.length > 0) {
        let totalAllPresent = 0;
        let totalAllLate = 0;
        let totalAllAbsent = 0;
        let totalAllSick = 0;
        let totalAllPersonal = 0;

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

          totalAllPresent += stdPresent;
          totalAllLate += stdLate;
          totalAllAbsent += stdAbsent;
          totalAllSick += stdSick;
          totalAllPersonal += stdPersonal;

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

        const totalExpected = students.length * allAttendances.length;
        const classCumulativeRate = totalExpected > 0
          ? Math.round(((totalAllPresent + totalAllLate) / totalExpected) * 100)
          : 0;

        // แถวสรุปผลรวมทั้งเทอมท้ายแผ่นงานที่ 2
        cumulativeRows.push(
          { "ลำดับ": "" as any, "เลขที่": "" as any, "ชื่อ-นามสกุล": "" as any, "มาเรียน (ครั้ง)": "" as any, "มาสาย (ครั้ง)": "" as any, "ขาด (ครั้ง)": "" as any, "ลาป่วย (ครั้ง)": "" as any, "ลากิจ (ครั้ง)": "" as any, "รวมวันเช็คชื่อทั้งหมด": "" as any, "อัตราเข้าเรียนสะสม (%)": "" as any },
          {
            "ลำดับ": "สรุปผลรวมทั้งเทอม" as any,
            "เลขที่": `นักเรียนทั้งหมด ${students.length} คน` as any,
            "ชื่อ-นามสกุล": `รวมวันเช็คชื่อ ${allAttendances.length} วัน` as any,
            "มาเรียน (ครั้ง)": totalAllPresent as any,
            "มาสาย (ครั้ง)": totalAllLate as any,
            "ขาด (ครั้ง)": totalAllAbsent as any,
            "ลาป่วย (ครั้ง)": totalAllSick as any,
            "ลากิจ (ครั้ง)": totalAllPersonal as any,
            "รวมวันเช็คชื่อทั้งหมด": totalExpected as any,
            "อัตราเข้าเรียนสะสม (%)": `เฉลี่ยทั้งห้อง ${classCumulativeRate}%` as any,
          }
        );

        const wsCumulative = XLSX.utils.json_to_sheet(cumulativeRows);
        XLSX.utils.book_append_sheet(wb, wsCumulative, "สถิติสะสมภาพรวม");
      }

      // ดาวน์โหลดไฟล์ Excel
      const fileName = `สรุปผลเช็คชื่อ_${classroom?.name || "ห้องเรียน"}_${attendanceDate}.xlsx`;
      XLSX.writeFile(wb, fileName);
    } catch (err: any) {
      alert("เกิดข้อผิดพลาดในการดาวน์โหลด Excel: " + err.message);
    } finally {
      setExporting(false);
    }
  };

  // Daily Stats calculation
  const presentCount = Object.values(records).filter((s) => s === "PRESENT").length;
  const lateCount = Object.values(records).filter((s) => s === "LATE").length;
  const absentCount = Object.values(records).filter((s) => s === "ABSENT").length;
  const sickLeaveCount = Object.values(records).filter((s) => s === "SICK_LEAVE").length;
  const personalLeaveCount = Object.values(records).filter((s) => s === "PERSONAL_LEAVE").length;
  const total = students.length;
  const rate = total > 0 ? Math.round(((presentCount + lateCount) / total) * 100) : 0;

  // Cumulative Totals Calculation across whole term
  let cumulativePresent = 0;
  let cumulativeLate = 0;
  let cumulativeAbsent = 0;
  let cumulativeSick = 0;
  let cumulativePersonal = 0;

  allAttendances.forEach((att) => {
    att.records?.forEach((rec: any) => {
      if (rec.status === "PRESENT") cumulativePresent++;
      else if (rec.status === "LATE") cumulativeLate++;
      else if (rec.status === "ABSENT") cumulativeAbsent++;
      else if (rec.status === "SICK_LEAVE") cumulativeSick++;
      else if (rec.status === "PERSONAL_LEAVE" || rec.status === "LEAVE") cumulativePersonal++;
    });
  });

  const totalClassDays = allAttendances.length;
  const totalPossibleChecks = total * totalClassDays;
  const cumulativeRate = totalPossibleChecks > 0
    ? Math.round(((cumulativePresent + cumulativeLate) / totalPossibleChecks) * 100)
    : 0;

  // Schedule Dates
  const formattedStartDate = classroom?.startDate
    ? new Intl.DateTimeFormat("th-TH", { dateStyle: "medium" }).format(new Date(classroom.startDate))
    : allAttendances.length > 0
    ? new Intl.DateTimeFormat("th-TH", { dateStyle: "medium" }).format(new Date(allAttendances[allAttendances.length - 1].date))
    : "16 พ.ค. 2569 (วันเปิดภาคเรียน)";

  const formattedCurrentDate = new Intl.DateTimeFormat("th-TH", { dateStyle: "medium" }).format(new Date());

  return (
    <div className="space-y-6 animate-fade-in font-prompt">
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
              <span className="text-emerald-400 font-bold">ระบบเช็คชื่อเข้าชั้นเรียน</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              ระบบเช็คชื่อเข้าชั้นเรียน & สถิติภาพรวม
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              เช็คชื่อรายวันและดูสถิติสะสมตลอดทั้งเทอม (มาเรียน, มาสาย, ขาด, ลาป่วย, ลากิจ) พร้อมระบบส่งใบสรุปเข้ากลุ่ม LINE และส่งออก Excel 2 แผ่นงาน
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
              title="ดาวน์โหลดสรุปผล (Sheet 1: ประจำวัน, Sheet 2: สถิติสะสมภาพรวมทั้งเทอม)"
            >
              <Download className="w-4 h-4" />
              <span>{exporting ? "กำลังส่งออก..." : "ดาวน์โหลด Excel"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* OVERVIEW CUMULATIVE STATUS BAR (แท็บแสดงสถานะภาพรวมสะสมตั้งแต่เริ่มเรียนจนถึงปัจจุบัน) */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                สถิติการเข้าเรียนสะสมภาพรวมทั้งเทอม (Cumulative Term Overview)
              </h3>
              <p className="text-[11px] text-slate-500">
                เริ่มนับตั้งแต่วันที่เริ่มเรียนตามตารางสอน (<strong>{formattedStartDate}</strong>) ถึงวันปัจจุบัน (<strong>{formattedCurrentDate}</strong>) รวม <strong>{totalClassDays}</strong> วัน
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800">
              อัตราการเข้าเรียนสะสม {cumulativeRate}%
            </span>
          </div>
        </div>

        {/* 6 Grid Cumulative Stat Blocks */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* มาเรียนสะสม */}
          <div className="bg-emerald-50/80 border border-emerald-200 p-3.5 rounded-2xl text-center">
            <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
              มาเรียนสะสม
            </span>
            <div className="text-2xl font-black text-emerald-900 mt-0.5">
              {cumulativePresent}
            </div>
            <span className="text-[10px] text-emerald-700 font-medium">ครั้ง</span>
          </div>

          {/* มาสายสะสม */}
          <div className="bg-amber-50/80 border border-amber-200 p-3.5 rounded-2xl text-center">
            <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">
              มาสายสะสม
            </span>
            <div className="text-2xl font-black text-amber-900 mt-0.5">
              {cumulativeLate}
            </div>
            <span className="text-[10px] text-amber-700 font-medium">ครั้ง</span>
          </div>

          {/* ขาดเรียนสะสม */}
          <div className="bg-rose-50/80 border border-rose-200 p-3.5 rounded-2xl text-center">
            <span className="text-[10px] font-bold text-rose-800 uppercase tracking-wider block">
              ขาดเรียนสะสม
            </span>
            <div className="text-2xl font-black text-rose-900 mt-0.5">
              {cumulativeAbsent}
            </div>
            <span className="text-[10px] text-rose-700 font-medium">ครั้ง</span>
          </div>

          {/* ลาป่วยสะสม */}
          <div className="bg-indigo-50/80 border border-indigo-200 p-3.5 rounded-2xl text-center">
            <span className="text-[10px] font-bold text-indigo-800 uppercase tracking-wider block">
              ลาป่วยสะสม
            </span>
            <div className="text-2xl font-black text-indigo-900 mt-0.5">
              {cumulativeSick}
            </div>
            <span className="text-[10px] text-indigo-700 font-medium">ครั้ง</span>
          </div>

          {/* ลากิจสะสม */}
          <div className="bg-purple-50/80 border border-purple-200 p-3.5 rounded-2xl text-center">
            <span className="text-[10px] font-bold text-purple-800 uppercase tracking-wider block">
              ลากิจสะสม
            </span>
            <div className="text-2xl font-black text-purple-900 mt-0.5">
              {cumulativePersonal}
            </div>
            <span className="text-[10px] text-purple-700 font-medium">ครั้ง</span>
          </div>

          {/* % เข้าเรียนสะสม */}
          <div className="bg-blue-50/80 border border-blue-200 p-3.5 rounded-2xl text-center col-span-2 sm:col-span-1">
            <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider block">
              เข้าเรียนสะสม
            </span>
            <div className="text-2xl font-black text-blue-900 mt-0.5">
              {cumulativeRate}%
            </div>
            <span className="text-[10px] text-blue-700 font-medium">
              {cumulativePresent + cumulativeLate} / {totalPossibleChecks} ครั้ง
            </span>
          </div>
        </div>
      </div>

      {/* TAB SELECTOR: เช็คชื่อประจำวัน VS สถิติสะสมรายคนทั้งเทอม */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-100 rounded-2xl max-w-md">
        <button
          onClick={() => setActiveTab("DAILY")}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
            activeTab === "DAILY"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-900"
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>เช็คชื่อประจำวัน ({attendanceDate})</span>
        </button>

        <button
          onClick={() => setActiveTab("CUMULATIVE")}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
            activeTab === "CUMULATIVE"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-900"
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>สถิติสะสมภาพรวมทั้งเทอม</span>
        </button>
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

      {/* VIEW 1: DAILY ROLL CALL */}
      {activeTab === "DAILY" ? (
        <div className="modern-card bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-7 space-y-5">
          {/* Daily Stats Counter Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pb-4 border-b border-slate-100">
            <div className="p-3 bg-emerald-50/60 rounded-xl text-center border border-emerald-100">
              <span className="text-[10px] font-bold text-emerald-700">มาเรียนวันนี้</span>
              <div className="text-xl font-black text-emerald-800 mt-0.5">{presentCount} คน</div>
            </div>
            <div className="p-3 bg-amber-50/60 rounded-xl text-center border border-amber-100">
              <span className="text-[10px] font-bold text-amber-700">มาสายวันนี้</span>
              <div className="text-xl font-black text-amber-800 mt-0.5">{lateCount} คน</div>
            </div>
            <div className="p-3 bg-rose-50/60 rounded-xl text-center border border-rose-100">
              <span className="text-[10px] font-bold text-rose-700">ขาดเรียนวันนี้</span>
              <div className="text-xl font-black text-rose-800 mt-0.5">{absentCount} คน</div>
            </div>
            <div className="p-3 bg-indigo-50/60 rounded-xl text-center border border-indigo-100">
              <span className="text-[10px] font-bold text-indigo-700">ลาป่วยวันนี้</span>
              <div className="text-xl font-black text-indigo-800 mt-0.5">{sickLeaveCount} คน</div>
            </div>
            <div className="p-3 bg-purple-50/60 rounded-xl text-center border border-purple-100">
              <span className="text-[10px] font-bold text-purple-700">ลากิจวันนี้</span>
              <div className="text-xl font-black text-purple-800 mt-0.5">{personalLeaveCount} คน</div>
            </div>
            <div className="p-3 bg-blue-50/60 rounded-xl text-center border border-blue-100 col-span-2 sm:col-span-1">
              <span className="text-[10px] font-bold text-blue-700">อัตราเข้าเรียนวันนี้</span>
              <div className="text-xl font-black text-blue-800 mt-0.5">{rate}%</div>
            </div>
          </div>

          {/* Bulk Quick Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
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
              <Download className="w-3.5 h-3.5" />
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
                        มาเรียน
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
                        มาสาย
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
                <Download className="w-4 h-4" />
                <span>ส่งออก Excel</span>
              </button>

              <button
                onClick={handleSaveAttendance}
                disabled={saving}
                className="px-6 py-3 rounded-2xl text-xs font-black bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-lg shadow-emerald-600/25 disabled:opacity-50 flex items-center justify-center gap-2 active:scale-95"
              >
                <span>💾</span>
                <span>
                  {saving ? "กำลังบันทึก..." : "บันทึกข้อมูลการเช็คชื่อ"}
                </span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* VIEW 2: CUMULATIVE TERM SUMMARY TABLE */
        <div className="modern-card bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-7 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                ตารางสถิติสะสมของนักเรียนรายบุคคล (แผ่นงานที่ 2)
              </h3>
              <p className="text-xs text-slate-500">
                สรุปจำนวนครั้งสะสมของนักเรียนแต่ละคนตลอดทั้งเทอม พร้อมคำนวณ % การเข้าเรียนสะสม
              </p>
            </div>

            <button
              onClick={handleExportExcel}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>ดาวน์โหลด Excel สถิติสะสม</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <th className="py-3 px-3 text-center">ลำดับ</th>
                  <th className="py-3 px-3 text-center">เลขที่</th>
                  <th className="py-3 px-4">ชื่อ-นามสกุล</th>
                  <th className="py-3 px-3 text-center text-emerald-700">มาเรียน</th>
                  <th className="py-3 px-3 text-center text-amber-700">มาสาย</th>
                  <th className="py-3 px-3 text-center text-rose-700">ขาด</th>
                  <th className="py-3 px-3 text-center text-indigo-700">ลาป่วย</th>
                  <th className="py-3 px-3 text-center text-purple-700">ลากิจ</th>
                  <th className="py-3 px-3 text-center font-bold">รวมวัน</th>
                  <th className="py-3 px-3 text-center">% เข้าเรียนสะสม</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((std, idx) => {
                  let stdPresent = 0;
                  let stdLate = 0;
                  let stdAbsent = 0;
                  let stdSick = 0;
                  let stdPersonal = 0;

                  allAttendances.forEach((att) => {
                    const rec = att.records?.find((r: any) => r.studentId === std.id);
                    if (rec) {
                      if (rec.status === "PRESENT") stdPresent++;
                      else if (rec.status === "LATE") stdLate++;
                      else if (rec.status === "ABSENT") stdAbsent++;
                      else if (rec.status === "SICK_LEAVE") stdSick++;
                      else if (rec.status === "PERSONAL_LEAVE" || rec.status === "LEAVE") stdPersonal++;
                    }
                  });

                  const totalDays = allAttendances.length;
                  const rate = totalDays > 0 ? Math.round(((stdPresent + stdLate) / totalDays) * 100) : 0;

                  return (
                    <tr key={std.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-3 text-center text-slate-400 font-medium">{idx + 1}</td>
                      <td className="py-3 px-3 text-center font-bold text-slate-700">{std.seatNumber > 0 ? std.seatNumber : "-"}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">{std.name}</td>
                      <td className="py-3 px-3 text-center font-bold text-emerald-600">{stdPresent}</td>
                      <td className="py-3 px-3 text-center font-bold text-amber-600">{stdLate}</td>
                      <td className="py-3 px-3 text-center font-bold text-rose-600">{stdAbsent}</td>
                      <td className="py-3 px-3 text-center font-bold text-indigo-600">{stdSick}</td>
                      <td className="py-3 px-3 text-center font-bold text-purple-600">{stdPersonal}</td>
                      <td className="py-3 px-3 text-center font-bold text-slate-700">{totalDays}</td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full font-black text-[11px] ${
                            rate >= 80
                              ? "bg-emerald-100 text-emerald-800"
                              : rate >= 60
                              ? "bg-amber-100 text-amber-800"
                              : "bg-rose-100 text-rose-800"
                          }`}
                        >
                          {rate}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-slate-100 font-bold text-slate-800 border-t-2 border-slate-300">
                  <td colSpan={3} className="py-3 px-4 text-center">
                    สรุปผลรวมทั้งห้อง ({students.length} คน)
                  </td>
                  <td className="py-3 px-3 text-center text-emerald-800 font-black">{cumulativePresent}</td>
                  <td className="py-3 px-3 text-center text-amber-800 font-black">{cumulativeLate}</td>
                  <td className="py-3 px-3 text-center text-rose-800 font-black">{cumulativeAbsent}</td>
                  <td className="py-3 px-3 text-center text-indigo-800 font-black">{cumulativeSick}</td>
                  <td className="py-3 px-3 text-center text-purple-800 font-black">{cumulativePersonal}</td>
                  <td className="py-3 px-3 text-center font-black">{totalPossibleChecks}</td>
                  <td className="py-3 px-3 text-center text-indigo-800 font-black">{cumulativeRate}%</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
