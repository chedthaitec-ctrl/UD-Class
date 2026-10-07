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
  lineUserId: string | null;
  totalPoints: number;
  exp: number;
  level: number;
  egg: {
    id: string;
    eggName: string;
    eggType: string;
    eggColor: string;
    currentExp: number;
    targetExp: number;
    isHatched: boolean;
    hatchedMonster: {
      id: string;
      name: string;
      species: string;
      rarity: string;
      imageUrl: string;
    } | null;
  } | null;
}

interface ParsedStudent {
  seatNumber: number;
  name: string;
  lineUserId?: string;
}

export default function StudentsRosterPage() {
  const params = useParams();
  const classroomId = params.id as string;

  const [students, setStudents] = useState<Student[]>([]);
  const [classroomName, setClassroomName] = useState("");
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Modal เพิ่มรายบุคคล
  const [showAddModal, setShowAddModal] = useState(false);
  const [addFormData, setAddFormData] = useState({
    seatNumber: "",
    name: "",
    lineUserId: "",
    eggType: "NORMAL",
  });
  const [actionLoading, setActionLoading] = useState(false);

  // Modal นำเข้า Excel
  const [showImportModal, setShowImportModal] = useState(false);
  const [previewStudents, setPreviewStudents] = useState<ParsedStudent[]>([]);
  const [importMode, setImportMode] = useState<"append" | "replace">("append");
  const [importEggType, setImportEggType] = useState<"NORMAL" | "RARE" | "LEGENDARY">("NORMAL");
  const [importing, setImporting] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  useEffect(() => {
    fetchClassroomAndStudents();
  }, [classroomId]);

  const fetchClassroomAndStudents = async () => {
    try {
      const res = await fetch(`/api/classrooms/${classroomId}`);
      const data = await res.json();
      if (data.success) {
        setClassroomName(data.classroom.name);
        setStudents(data.classroom.students);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addFormData.seatNumber || !addFormData.name) return;

    setActionLoading(true);
    try {
      const res = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classroomId,
          ...addFormData,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowAddModal(false);
        setAddFormData({ seatNumber: "", name: "", lineUserId: "", eggType: "NORMAL" });
        fetchClassroomAndStudents();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  // จัดการการอัปโหลดไฟล์ Excel
  const handleExcelFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setImportError(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];

        // แปลงแผ่นงานเป็น Array ของ Array
        const rawData: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });

        if (rawData.length === 0) {
          setImportError("ไฟล์ Excel ว่างเปล่า");
          return;
        }

        // หา Index คอลัมน์ที่เกี่ยวข้อง
        let seatCol = 0;
        let nameCol = 1;
        let lineCol = -1;
        let startRow = 0;

        const headerRow = rawData[0];
        if (Array.isArray(headerRow)) {
          let foundHeader = false;
          headerRow.forEach((colVal: any, idx: number) => {
            const str = String(colVal || "").toLowerCase().trim();
            if (str.includes("เลขที่") || str.includes("seat") || str.includes("no") || str === "id") {
              seatCol = idx;
              foundHeader = true;
            } else if (str.includes("ชื่อ") || str.includes("name") || str.includes("สกุล")) {
              nameCol = idx;
              foundHeader = true;
            } else if (str.includes("line") || str.includes("ไลน์") || str.includes("uid")) {
              lineCol = idx;
            }
          });

          if (foundHeader) {
            startRow = 1;
          }
        }

        const parsed: ParsedStudent[] = [];
        for (let i = startRow; i < rawData.length; i++) {
          const row = rawData[i];
          if (!row || row.length === 0) continue;

          const seatRaw = row[seatCol];
          const nameRaw = row[nameCol];
          const lineRaw = lineCol !== -1 ? row[lineCol] : undefined;

          const seatNumber = parseInt(String(seatRaw || "").trim(), 10);
          const name = String(nameRaw || "").trim();

          // ข้ามแถวที่ไม่มีข้อมูลเลขที่หรือชื่อ
          if (isNaN(seatNumber) || !name) continue;

          parsed.push({
            seatNumber,
            name,
            lineUserId: lineRaw ? String(lineRaw).trim() : undefined,
          });
        }

        // เรียงลำดับตามเลขที่
        parsed.sort((a, b) => a.seatNumber - b.seatNumber);

        if (parsed.length === 0) {
          setImportError("ไม่พบข้อมูลนักเรียนที่ถูกต้อง กรุณาตรวจสอบรูปแบบไฟล์ (ต้องมีคอลัมน์เลขที่ และ ชื่อ-นามสกุล)");
        } else {
          setPreviewStudents(parsed);
        }
      } catch (err: any) {
        setImportError("เกิดข้อผิดพลาดในการอ่านไฟล์: " + err.message);
      }
    };
    reader.readAsBinaryString(file);
  };

  // ดาวน์โหลดเทมเพลต Excel ตัวอย่าง
  const handleDownloadTemplate = () => {
    const templateData = [
      { "เลขที่": 1, "ชื่อ-นามสกุล": "ด.ช. กิตติศักดิ์ เจริญพร", "LINE ID (ถ้ามี)": "" },
      { "เลขที่": 2, "ชื่อ-นามสกุล": "ด.ช. ชัยวัฒน์ มั่นคง", "LINE ID (ถ้ามี)": "" },
      { "เลขที่": 3, "ชื่อ-นามสกุล": "ด.ญ. ณัฐณิชา ศรีสุข", "LINE ID (ถ้ามี)": "" },
      { "เลขที่": 4, "ชื่อ-นามสกุล": "ด.ญ. ปรียาภรณ์ แสนดี", "LINE ID (ถ้ามี)": "" },
      { "เลขที่": 5, "ชื่อ-นามสกุล": "ด.ช. ภัทรพล สุวรรณโชติ", "LINE ID (ถ้ามี)": "" },
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    // กำหนดความกว้างคอลัมน์
    ws["!cols"] = [{ wch: 10 }, { wch: 30 }, { wch: 20 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "รายชื่อนักเรียน");
    XLSX.writeFile(wb, "แบบฟอร์มนำเข้ารายชื่อนักเรียน_UDClass.xlsx");
  };

  // ยืนยันการนำเข้าข้อมูล
  const handleConfirmImport = async () => {
    if (previewStudents.length === 0) return;

    setImporting(true);
    try {
      const res = await fetch("/api/students/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classroomId,
          mode: importMode,
          defaultEggType: importEggType,
          students: previewStudents,
        }),
      });

      const data = await res.json();
      if (data.success) {
        alert(data.message || `นำเข้าข้อมูลนักเรียนสำเร็จ ${data.importedCount} คน!`);
        setShowImportModal(false);
        setPreviewStudents([]);
        setFileName(null);
        fetchClassroomAndStudents();
      } else {
        alert("ไม่สามารถนำเข้าข้อมูลได้: " + data.error);
      }
    } catch (err: any) {
      alert("เกิดข้อผิดพลาด: " + err.message);
    } finally {
      setImporting(false);
    }
  };

  const handleGiveExp = async (studentId: string, amount: number) => {
    try {
      const res = await fetch("/api/gamification/add-exp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          amount,
          points: Math.floor(amount / 2),
        }),
      });
      const data = await res.json();
      if (data.success) {
        fetchClassroomAndStudents();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleHatchEgg = async (studentId: string) => {
    try {
      const res = await fetch("/api/gamification/hatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId }),
      });
      const data = await res.json();
      if (data.success && data.hatched) {
        alert(`🎉 ยินดีด้วย! ฟักได้มอนสเตอร์ "${data.monster.name}" ระดับ ${data.monster.rarity}!`);
        fetchClassroomAndStudents();
      } else {
        alert("ไข่ยังสะสม EXP ไม่ครบ 100 หรือเกิดข้อผิดพลาด");
      }
    } catch (err: any) {
      alert("ข้อผิดพลาด: " + err.message);
    }
  };

  const filteredStudents = students.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.seatNumber.toString().includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <Link href={`/classrooms/${classroomId}`} className="hover:text-slate-700">
              {classroomName || "ห้องเรียน"}
            </Link>
            <span>/</span>
            <span className="text-slate-600 font-semibold">รายชื่อนักเรียน</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            รายชื่อนักเรียน & ไข่มอนสเตอร์
          </h2>
          <p className="text-xs text-slate-500">
            จัดการข้อมูลนักเรียน คะแนน EXP และการเจริญเติบโตของไข่
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* ปุ่มนำเข้า Excel */}
          <button
            onClick={() => {
              setPreviewStudents([]);
              setFileName(null);
              setImportError(null);
              setShowImportModal(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-sm"
          >
            <span>📥</span>
            <span>นำเข้าไฟล์ Excel</span>
          </button>

          {/* ปุ่มเพิ่มรายบุคคล */}
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition shadow-sm"
          >
            <span>➕</span>
            <span>เพิ่มนักเรียนเดี่ยว</span>
          </button>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="w-full sm:w-72">
          <input
            type="text"
            placeholder="🔍 ค้นหาชื่อ หรือ เลขที่..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
          />
        </div>

        <div className="flex items-center gap-4 text-xs text-slate-500">
          <span>
            นักเรียนทั้งหมด: <strong className="text-slate-900">{students.length}</strong> คน
          </span>
          <span>•</span>
          <span>
            ผูก LINE แล้ว:{" "}
            <strong className="text-emerald-600">
              {students.filter((s) => s.lineUserId).length}
            </strong>{" "}
            คน
          </span>
        </div>
      </div>

      {/* Students Table */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 text-xs">กำลังโหลดรายชื่อนักเรียน...</div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">เลขที่</th>
                  <th className="py-3 px-4">รูป & ชื่อนักเรียน</th>
                  <th className="py-3 px-4">สถานะ LINE</th>
                  <th className="py-3 px-4">เลเวล & แต้ม</th>
                  <th className="py-3 px-4">ความคืบหน้าไข่ (EXP)</th>
                  <th className="py-3 px-4 text-center">มอนสเตอร์</th>
                  <th className="py-3 px-4 text-right">ให้ EXP / ฟักไข่</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map((std) => {
                  const egg = std.egg;
                  const currentExp = egg?.currentExp || 0;
                  const targetExp = egg?.targetExp || 100;
                  const percent = Math.min(100, Math.round((currentExp / targetExp) * 100));
                  const isReadyToHatch = currentExp >= targetExp && !egg?.isHatched;

                  return (
                    <tr key={std.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4 font-black text-slate-900 text-sm">
                        {std.seatNumber}
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={std.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${std.name}`}
                            alt={std.name}
                            className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200"
                          />
                          <div>
                            <span className="font-bold text-slate-900 block">
                              {std.name}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {std.lineUserId ? `UID: ${std.lineUserId.slice(0, 10)}...` : "ยังไม่ผูก LINE"}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        {std.lineUserId ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            ผูกแล้ว
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                            รอลงทะเบียน
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <div>
                          <span className="font-extrabold text-indigo-600 block">
                            Lv.{std.level}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {std.totalPoints} แต้ม • {std.exp} EXP
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-4 w-44">
                        {egg ? (
                          <div>
                            <div className="flex items-center justify-between text-[10px] mb-1">
                              <span className="font-semibold text-slate-600">
                                {egg.isHatched ? "ฟักแล้ว ✅" : `${currentExp}/${targetExp} EXP`}
                              </span>
                              <span className="font-bold text-slate-800">{percent}%</span>
                            </div>
                            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  egg.isHatched
                                    ? "bg-purple-500"
                                    : percent >= 100
                                    ? "bg-emerald-500 animate-pulse"
                                    : "bg-amber-500"
                                }`}
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[10px]">-</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-center">
                        {egg?.isHatched && egg.hatchedMonster ? (
                          <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-purple-50 border border-purple-200 text-purple-800 text-[11px] font-bold">
                            <span>👾</span>
                            <span>{egg.hatchedMonster.name}</span>
                          </div>
                        ) : (
                          <span className="text-amber-600 font-bold text-xs">
                            🥚 {egg?.eggType}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleGiveExp(std.id, 15)}
                            className="px-2 py-1 rounded-md text-[10px] font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition"
                            title="แจก +15 EXP"
                          >
                            +15 EXP
                          </button>
                          <button
                            onClick={() => handleGiveExp(std.id, 50)}
                            className="px-2 py-1 rounded-md text-[10px] font-bold bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 transition"
                            title="แจก +50 EXP"
                          >
                            +50 EXP
                          </button>

                          {isReadyToHatch && (
                            <button
                              onClick={() => handleHatchEgg(std.id)}
                              className="px-2.5 py-1 rounded-md text-[10px] font-black bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600 shadow-sm transition animate-bounce"
                            >
                              🎉 ฟักไข่
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal นำเข้าข้อมูลด้วยไฟล์ Excel */}
      {showImportModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-5 text-xs max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-xl font-bold">
                  📊
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    นำเข้ารายชื่อนักเรียนจากไฟล์ Excel (.xlsx, .xls, .csv)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    อัปโหลดรายชื่อนักเรียนพร้อมเลขที่เข้าสู่ห้อง {classroomName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowImportModal(false)}
                className="text-slate-400 hover:text-slate-600 text-base font-bold"
              >
                ✕
              </button>
            </div>

            {/* Template Download & Upload Area */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="text-slate-600">
                  <span className="font-bold text-slate-800 block text-xs">
                    ยังไม่มีแบบฟอร์ม?
                  </span>
                  <span className="text-[11px] text-slate-500">
                    ดาวน์โหลดเทมเพลต Excel ที่จัดรูปแบบคอลัมน์ไว้ให้เรียบร้อย
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white text-emerald-700 border border-emerald-300 hover:bg-emerald-50 transition shadow-sm flex items-center gap-1.5 whitespace-nowrap"
                >
                  <span>📄</span>
                  <span>ดาวน์โหลดไฟล์ตัวอย่าง (.xlsx)</span>
                </button>
              </div>

              {/* Upload Drop Zone */}
              <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center hover:border-emerald-500 bg-slate-50/50 hover:bg-emerald-50/20 transition cursor-pointer relative">
                <input
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleExcelFileUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <div className="space-y-1.5 pointer-events-none">
                  <div className="text-3xl">📁</div>
                  <p className="font-bold text-slate-800 text-xs">
                    {fileName ? `ไฟล์ที่เลือก: ${fileName}` : "คลิกหรือลากไฟล์ Excel (.xlsx, .xls, .csv) มาวางที่นี่"}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    ระบบจะตรวจจับคอลัมน์ "เลขที่", "ชื่อ-นามสกุล", และ "LINE ID" อัตโนมัติ
                  </p>
                </div>
              </div>

              {importError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 font-semibold text-xs">
                  ⚠️ {importError}
                </div>
              )}

              {/* Import Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    โหมดการนำเข้า:
                  </label>
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                      <input
                        type="radio"
                        name="importMode"
                        value="append"
                        checked={importMode === "append"}
                        onChange={() => setImportMode("append")}
                        className="text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>เพิ่มต่อจากเดิม (Append)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer font-medium text-rose-700">
                      <input
                        type="radio"
                        name="importMode"
                        value="replace"
                        checked={importMode === "replace"}
                        onChange={() => setImportMode("replace")}
                        className="text-rose-600 focus:ring-rose-500"
                      />
                      <span>แทนที่รายชื่อเดิมทั้งหมด (Replace)</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    เกรดไข่มอนสเตอร์เริ่มต้น:
                  </label>
                  <select
                    value={importEggType}
                    onChange={(e: any) => setImportEggType(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="NORMAL">ไข่ธรรมดา (NORMAL) - โอกาส Common / Rare</option>
                    <option value="RARE">ไข่หายาก (RARE) - โอกาส Rare / Epic</option>
                    <option value="LEGENDARY">ไข่ในตำนาน (LEGENDARY) - โอกาส Epic / Legendary</option>
                  </select>
                </div>
              </div>

              {/* Preview Table */}
              {previewStudents.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-900">
                      ตัวอย่างข้อมูลที่ตรวจพบ (ทั้งหมด {previewStudents.length} คน):
                    </span>
                    <span className="text-[11px] text-emerald-600 font-bold">
                      พร้อมนำเข้า ✅
                    </span>
                  </div>

                  <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 text-slate-600 sticky top-0 font-bold text-[10px]">
                        <tr>
                          <th className="py-2 px-3">เลขที่</th>
                          <th className="py-2 px-3">ชื่อ-นามสกุล</th>
                          <th className="py-2 px-3">LINE ID</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {previewStudents.map((ps, i) => (
                          <tr key={i} className="hover:bg-slate-50">
                            <td className="py-1.5 px-3 font-bold text-slate-900">
                              {ps.seatNumber}
                            </td>
                            <td className="py-1.5 px-3 text-slate-800">
                              {ps.name}
                            </td>
                            <td className="py-1.5 px-3 text-slate-400 font-mono text-[10px]">
                              {ps.lineUserId || "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2.5 rounded-xl font-semibold text-slate-600 hover:bg-slate-100 transition"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                disabled={importing || previewStudents.length === 0}
                onClick={handleConfirmImport}
                className="px-6 py-2.5 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/25 transition disabled:opacity-50 flex items-center gap-1.5"
              >
                <span>📥</span>
                <span>
                  {importing
                    ? "กำลังนำเข้าข้อมูล..."
                    : `ยืนยันนำเข้านักเรียน (${previewStudents.length} คน)`}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal เพิ่มนักเรียนเดี่ยว */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">
                เพิ่มนักเรียนใหม่ (เดี่ยว)
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddStudent} className="space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    เลขที่ *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={addFormData.seatNumber}
                    onChange={(e) =>
                      setAddFormData({ ...addFormData, seatNumber: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-slate-700 font-bold mb-1">
                    ชื่อ-นามสกุล *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ด.ช. สมศักดิ์ มีสุข"
                    value={addFormData.name}
                    onChange={(e) =>
                      setAddFormData({ ...addFormData, name: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  ประเภทไข่มอนสเตอร์เริ่มต้น
                </label>
                <select
                  value={addFormData.eggType}
                  onChange={(e) =>
                    setAddFormData({ ...addFormData, eggType: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
                >
                  <option value="NORMAL">ไข่ธรรมดา (NORMAL) - โอกาสได้ Common / Rare</option>
                  <option value="RARE">ไข่หายาก (RARE) - โอกาสได้ Rare / Epic</option>
                  <option value="LEGENDARY">ไข่ในตำนาน (LEGENDARY) - โอกาสได้ Epic / Legendary</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  LINE User ID (เว้นว่างไว้ให้นักเรียนพิมพ์ #ลงทะเบียน เองได้)
                </label>
                <input
                  type="text"
                  placeholder="U1234567890abcdef..."
                  value={addFormData.lineUserId}
                  onChange={(e) =>
                    setAddFormData({ ...addFormData, lineUserId: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50"
                >
                  {actionLoading ? "กำลังบันทึก..." : "เพิ่มนักเรียน"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
