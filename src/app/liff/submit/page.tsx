"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import confetti from "canvas-confetti";

interface Student {
  id: string;
  seatNumber: number;
  name: string;
}

interface Assignment {
  id: string;
  title: string;
  description: string | null;
  dueDate: string;
  maxScore: number;
  expReward: number;
}

function LiffSubmitContent() {
  const searchParams = useSearchParams();
  const initialAssignmentId = searchParams.get("assignmentId");
  const studentIdParam = searchParams.get("studentId");

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState(
    initialAssignmentId || ""
  );
  const [selectedStudentId, setSelectedStudentId] = useState(
    studentIdParam || ""
  );
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/classrooms");
      const data = await res.json();
      if (data.success && data.classrooms.length > 0) {
        const firstClass = data.classrooms[0];
        const classRes = await fetch(`/api/classrooms/${firstClass.id}`);
        const classData = await classRes.json();
        if (classData.success) {
          setAssignments(classData.classroom.assignments);
          setStudents(classData.classroom.students);
          if (!selectedAssignmentId && classData.classroom.assignments.length > 0) {
            setSelectedAssignmentId(classData.classroom.assignments[0].id);
          }
          if (!selectedStudentId && classData.classroom.students.length > 0) {
            setSelectedStudentId(classData.classroom.students[0].id);
          }
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignmentId || !selectedStudentId || !content) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/assignments/${selectedAssignmentId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "submit",
          studentId: selectedStudentId,
          content,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSubmittedSuccess(data);
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 },
        });
      } else {
        alert("ข้อผิดพลาด: " + data.error);
      }
    } catch (err: any) {
      alert("เกิดข้อผิดพลาด: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const currentAssignment = assignments.find((a) => a.id === selectedAssignmentId);
  const currentStudent = students.find((s) => s.id === selectedStudentId);

  return (
    <div className="max-w-lg mx-auto py-4 px-2 space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-tr from-emerald-600 to-teal-500 rounded-3xl p-6 text-white text-center shadow-xl space-y-2 relative overflow-hidden">
        <div className="text-4xl animate-bounce">🚀</div>
        <h2 className="text-xl font-black">ส่งการบ้านออนไลน์ (LIFF Portal)</h2>
        <p className="text-xs text-emerald-100">
          ส่งงานตรงเวลารับทันที +50 EXP เพื่อฟักไข่มอนสเตอร์ของคุณ!
        </p>
      </div>

      {loading ? (
        <div className="p-8 text-center text-slate-400 text-xs">กำลังโหลดแบบฟอร์ม...</div>
      ) : submittedSuccess ? (
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xl text-center space-y-4 animate-fade-in">
          <div className="text-6xl animate-bounce">🎉</div>
          <h3 className="text-xl font-black text-slate-900">
            ส่งการบ้านสำเร็จเรียบร้อย!
          </h3>
          <p className="text-xs text-slate-500">
            {currentStudent?.name} ได้รับ{" "}
            <strong className="text-amber-500">+{submittedSuccess.expGained} EXP</strong>{" "}
            เข้าสู่ไข่มอนสเตอร์แล้ว!
          </p>

          <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-800 font-bold">
            🌟 รอยร้าวของไข่กำลังเพิ่มขึ้น ตรวจสอบได้ในห้องฟักไข่
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <a
              href="/liff/monster"
              className="py-3 rounded-2xl text-xs font-black bg-amber-500 hover:bg-amber-400 text-slate-950 transition shadow-md"
            >
              🥚 ไปส่องไข่มอนสเตอร์ของฉัน
            </a>
            <button
              onClick={() => {
                setSubmittedSuccess(null);
                setContent("");
              }}
              className="py-2.5 rounded-2xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
            >
              ส่งงานชิ้นอื่นเพิ่มเติม
            </button>
          </div>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xl space-y-4 text-xs"
        >
          {/* Select Student */}
          <div>
            <label className="block text-slate-700 font-bold mb-1">
              เลือกชื่อนักเรียนของคุณ *
            </label>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
            >
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  เลขที่ {s.seatNumber}: {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Select Assignment */}
          <div>
            <label className="block text-slate-700 font-bold mb-1">
              เลือกการบ้านที่ต้องการส่ง *
            </label>
            <select
              value={selectedAssignmentId}
              onChange={(e) => setSelectedAssignmentId(e.target.value)}
              className="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
            >
              {assignments.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.title} (+{a.expReward} EXP)
                </option>
              ))}
            </select>
          </div>

          {currentAssignment && (
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
              <span className="font-bold text-slate-800 block text-xs">
                คำสั่งงาน:
              </span>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                {currentAssignment.description || "ไม่มีคำอธิบายเพิ่มเติม"}
              </p>
            </div>
          )}

          {/* Submission Content */}
          <div>
            <label className="block text-slate-700 font-bold mb-1">
              แนบลิงก์ Google Drive / ไฟล์ / หรือพิมพ์คำตอบ *
            </label>
            <textarea
              required
              rows={4}
              placeholder="เช่น ลิงก์ Google Drive, Canva, Youtube หรือสรุปผลการทดลองที่นี่..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-xs"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 rounded-2xl text-xs font-black bg-[#06C755] hover:bg-emerald-600 text-white transition shadow-lg shadow-emerald-500/25 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <span>🚀</span>
            <span>{submitting ? "กำลังส่งงาน..." : "ยืนยันส่งงาน & รับทันที +50 EXP"}</span>
          </button>
        </form>
      )}
    </div>
  );
}

export default function LiffSubmitPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-xs text-slate-400">กำลังโหลด...</div>}>
      <LiffSubmitContent />
    </Suspense>
  );
}
