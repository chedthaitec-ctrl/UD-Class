"use client";

import { useState, useEffect, Suspense, useRef } from "react";
import { useSearchParams } from "next/navigation";
import confetti from "canvas-confetti";
import {
  FileText,
  Image as ImageIcon,
  Video,
  Presentation,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Upload,
  Link as LinkIcon,
  Sparkles,
  ArrowRight
} from "lucide-react";

interface Student {
  id: string;
  seatNumber: number;
  name: string;
}

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  answer: number;
  points: number;
  explanation?: string;
}

interface Assignment {
  id: string;
  title: string;
  description: string | null;
  type: string;
  format: string;
  dueDate: string;
  maxScore: number;
  expReward: number;
  quizQuestions?: string | null;
}

type SubmissionFormatTab = "IMAGE" | "VIDEO" | "SLIDES" | "PDF" | "LINK";

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

  // General submission state
  const [formatTab, setFormatTab] = useState<SubmissionFormatTab>("IMAGE");
  const [content, setContent] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Quiz state
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [quizResult, setQuizResult] = useState<any>(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState<any>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

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

  const currentAssignment = assignments.find((a) => a.id === selectedAssignmentId);
  const currentStudent = students.find((s) => s.id === selectedStudentId);

  // Parse questions if this is a quiz
  let parsedQuestions: QuizQuestion[] = [];
  if (currentAssignment?.quizQuestions) {
    try {
      parsedQuestions = JSON.parse(currentAssignment.quizQuestions);
    } catch (e) {
      parsedQuestions = [];
    }
  }
  const isQuizMode = currentAssignment?.type === "QUIZ" || parsedQuestions.length > 0;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const dataUrl = uploadEvent.target?.result as string;
        setImagePreview(dataUrl);
        setContent(dataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignmentId || !selectedStudentId) {
      alert("กรุณาเลือกชื่อนักเรียนและการบ้านที่ต้องการส่ง");
      return;
    }

    if (isQuizMode) {
      // Validate all questions answered
      const answeredCount = Object.keys(quizAnswers).length;
      if (answeredCount < parsedQuestions.length) {
        if (!confirm(`คุณยังไม่ได้ตอบคำถามครบทุกข้อ (ตอบแล้ว ${answeredCount}/${parsedQuestions.length} ข้อ) ยืนยันที่จะส่งหรือไม่?`)) {
          return;
        }
      }
    } else if (!content.trim()) {
      alert("กรุณาแนบไฟล์ ลิงก์ หรือระบุรายละเอียดงานที่ส่ง");
      return;
    }

    setSubmitting(true);
    try {
      const payload: any = {
        action: "submit",
        studentId: selectedStudentId,
        submissionType: isQuizMode ? "QUIZ" : formatTab,
        content: isQuizMode ? `ทำแบบทดสอบ (${Object.keys(quizAnswers).length}/${parsedQuestions.length} ข้อ)` : content,
      };

      if (isQuizMode) {
        payload.quizAnswers = quizAnswers;
      }

      const res = await fetch(`/api/assignments/${selectedAssignmentId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        setSubmittedSuccess(data);
        if (data.instantGraded) {
          setQuizResult({
            score: data.score,
            maxScore: data.maxScore,
            answers: quizAnswers,
          });
        }
        confetti({
          particleCount: 160,
          spread: 90,
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

  return (
    <div className="max-w-xl mx-auto py-5 px-3 space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-tr from-emerald-600 via-teal-600 to-cyan-700 rounded-3xl p-6 text-white text-center shadow-xl space-y-2 relative overflow-hidden">
        <div className="text-4xl animate-bounce">🚀</div>
        <h2 className="text-xl font-black tracking-tight">ระบบส่งการบ้านออนไลน์ (LIFF Portal)</h2>
        <p className="text-xs text-emerald-100">
          ส่งงานตรงเวลารับทันที +50 EXP เพื่อฟักไข่มอนสเตอร์ของคุณ!
        </p>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400 text-xs">กำลังโหลดแบบฟอร์ม...</div>
      ) : submittedSuccess ? (
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xl text-center space-y-5 animate-fade-in">
          <div className="text-6xl animate-bounce">🎉</div>
          
          <div>
            <h3 className="text-2xl font-black text-slate-900">
              {isQuizMode ? "ทำแบบทดสอบเรียบร้อยแล้ว!" : "ส่งการบ้านสำเร็จเรียบร้อย!"}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {currentStudent?.name} ได้รับ{" "}
              <strong className="text-amber-500 font-bold">
                +{submittedSuccess.expGained || 50} EXP
              </strong>{" "}
              เข้าสู่ไข่มอนสเตอร์แล้ว!
            </p>
          </div>

          {/* Instant Quiz Score Banner */}
          {submittedSuccess.instantGraded && (
            <div className="p-5 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl border border-purple-200 text-center space-y-3">
              <span className="text-xs font-bold text-purple-700 uppercase tracking-wider block">
                ⚡ ตรวจข้อสอบอัตโนมัติ (Instant Auto-Grading)
              </span>
              <div className="text-4xl font-black text-purple-950">
                {submittedSuccess.score} / {submittedSuccess.maxScore}
                <span className="text-base text-purple-600 font-bold ml-1">คะแนน</span>
              </div>
              <div className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-purple-600 text-white shadow-sm">
                คิดเป็น {Math.round((submittedSuccess.score / submittedSuccess.maxScore) * 100)}%
              </div>
            </div>
          )}

          {/* Question Breakdown if Quiz */}
          {isQuizMode && parsedQuestions.length > 0 && (
            <div className="text-left space-y-3 pt-2">
              <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                <span>เฉลยคำตอบและรายละเอียด:</span>
              </h4>
              <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                {parsedQuestions.map((q, idx) => {
                  const studentAnswer = quizAnswers[q.id];
                  const isCorrect = studentAnswer === q.answer;
                  return (
                    <div
                      key={q.id || idx}
                      className={`p-3 rounded-xl border text-xs ${
                        isCorrect
                          ? "bg-emerald-50 border-emerald-200 text-emerald-950"
                          : "bg-rose-50 border-rose-200 text-rose-950"
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold mb-1">
                        <span>ข้อ {idx + 1}: {q.question}</span>
                        {isCorrect ? (
                          <span className="text-emerald-700 flex items-center gap-1 text-[11px]">
                            <CheckCircle2 className="w-3.5 h-3.5" /> ถูก (+{q.points})
                          </span>
                        ) : (
                          <span className="text-rose-700 flex items-center gap-1 text-[11px]">
                            <XCircle className="w-3.5 h-3.5" /> ผิด (0)
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-600">
                        คุณตอบ: <strong>{q.options[studentAnswer] || "ไม่ได้ตอบ"}</strong>
                        {!isCorrect && (
                          <span className="ml-2 text-emerald-700">
                            เฉลยที่ถูกต้อง: <strong>{q.options[q.answer]}</strong>
                          </span>
                        )}
                      </div>
                      {q.explanation && (
                        <div className="text-[10px] text-slate-500 mt-1 italic">
                          💡 {q.explanation}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-900 font-bold flex items-center justify-center gap-2">
            <span>🥚</span>
            <span>ระดับพลังของไข่มอนสเตอร์เพิ่มขึ้นแล้ว แวะไปดูมอนสเตอร์ได้เลย!</span>
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <a
              href="/liff/monster"
              className="py-3 rounded-2xl text-xs font-black bg-amber-500 hover:bg-amber-400 text-slate-950 transition shadow-md flex items-center justify-center gap-1.5"
            >
              <span>🥚 ไปส่องไข่มอนสเตอร์ของฉัน</span>
            </a>
            <button
              onClick={() => {
                setSubmittedSuccess(null);
                setContent("");
                setImagePreview(null);
                setQuizAnswers({});
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
          className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xl space-y-5 text-xs"
        >
          {/* Select Student */}
          <div>
            <label className="block text-slate-700 font-bold mb-1.5">
              1. เลือกชื่อของคุณ *
            </label>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
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
            <label className="block text-slate-700 font-bold mb-1.5">
              2. เลือกหัวข้องานที่ต้องการส่ง *
            </label>
            <select
              value={selectedAssignmentId}
              onChange={(e) => {
                setSelectedAssignmentId(e.target.value);
                setQuizAnswers({});
                setContent("");
                setImagePreview(null);
              }}
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
            >
              {assignments.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.type === "QUIZ" ? "📝 [ควิซ]" : "📄 [การบ้าน]"} {a.title} (+{a.expReward} EXP)
                </option>
              ))}
            </select>
          </div>

          {/* Assignment Description Banner */}
          {currentAssignment && (
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 text-xs">
                  คำสั่ง / คำชี้แจง:
                </span>
                <span className="text-[11px] font-bold text-emerald-600">
                  +{currentAssignment.expReward} EXP ⭐
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                {currentAssignment.description || "ไม่มีคำอธิบายเพิ่มเติม"}
              </p>
            </div>
          )}

          {/* MODE A: QUIZ TAKING FORM */}
          {isQuizMode ? (
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-1.5 font-bold text-slate-900 text-xs">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  <span>ทำแบบทดสอบ ({parsedQuestions.length} ข้อ)</span>
                </div>
                <span className="text-[11px] font-bold text-purple-600">
                  ตอบแล้ว {Object.keys(quizAnswers).length}/{parsedQuestions.length}
                </span>
              </div>

              <div className="space-y-4">
                {parsedQuestions.map((q, qIdx) => (
                  <div
                    key={q.id || qIdx}
                    className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3"
                  >
                    <div className="font-bold text-slate-900 text-xs flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                        {qIdx + 1}
                      </span>
                      <span>{q.question}</span>
                    </div>

                    <div className="space-y-1.5 pl-7">
                      {q.options.map((opt, optIdx) => {
                        const isSelected = quizAnswers[q.id] === optIdx;
                        return (
                          <label
                            key={optIdx}
                            onClick={() =>
                              setQuizAnswers({ ...quizAnswers, [q.id]: optIdx })
                            }
                            className={`p-2.5 rounded-xl border flex items-center gap-3 cursor-pointer transition text-xs ${
                              isSelected
                                ? "bg-purple-100 border-purple-400 font-bold text-purple-950"
                                : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                            }`}
                          >
                            <span
                              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border ${
                                isSelected
                                  ? "bg-purple-600 text-white border-purple-600"
                                  : "border-slate-300 text-slate-500"
                              }`}
                            >
                              {String.fromCharCode(65 + optIdx)}
                            </span>
                            <span>{opt}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* MODE B: MULTI-FORMAT SUBMISSION TABS */
            <div className="space-y-3 pt-2">
              <label className="block text-slate-700 font-bold mb-1">
                3. เลือกรูปแบบชิ้นงานที่ต้องการส่ง *
              </label>

              {/* Format Switcher Tabs */}
              <div className="grid grid-cols-5 gap-1.5 p-1 bg-slate-100 rounded-2xl text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setFormatTab("IMAGE")}
                  className={`py-2 px-1 rounded-xl transition flex flex-col items-center gap-1 ${
                    formatTab === "IMAGE"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <ImageIcon className="w-4 h-4 text-blue-500" />
                  <span>รูปภาพ</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFormatTab("VIDEO")}
                  className={`py-2 px-1 rounded-xl transition flex flex-col items-center gap-1 ${
                    formatTab === "VIDEO"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <Video className="w-4 h-4 text-rose-500" />
                  <span>วิดีโอ</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFormatTab("SLIDES")}
                  className={`py-2 px-1 rounded-xl transition flex flex-col items-center gap-1 ${
                    formatTab === "SLIDES"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <Presentation className="w-4 h-4 text-purple-500" />
                  <span>Canva/สไลด์</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFormatTab("PDF")}
                  className={`py-2 px-1 rounded-xl transition flex flex-col items-center gap-1 ${
                    formatTab === "PDF"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <FileText className="w-4 h-4 text-amber-500" />
                  <span>PDF/ไดรฟ์</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFormatTab("LINK")}
                  className={`py-2 px-1 rounded-xl transition flex flex-col items-center gap-1 ${
                    formatTab === "LINK"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <LinkIcon className="w-4 h-4 text-emerald-500" />
                  <span>ลิงก์/พิมพ์</span>
                </button>
              </div>

              {/* Format Specific Inputs */}
              {formatTab === "IMAGE" && (
                <div className="space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-300 rounded-xl hover:border-blue-500 bg-white cursor-pointer transition">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex flex-col items-center gap-2"
                    >
                      <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-xl">
                        📸
                      </div>
                      <span className="font-bold text-slate-800 text-xs">
                        แตะเพื่อถ่ายรูป หรือเลือกภาพจากอุปกรณ์
                      </span>
                      <span className="text-[10px] text-slate-400">
                        รองรับ JPG, PNG, ถ่ายจากกล้องมือถือ/iPad
                      </span>
                    </button>
                  </div>

                  {imagePreview && (
                    <div className="relative rounded-xl overflow-hidden border border-slate-200 max-h-56 bg-slate-900 flex items-center justify-center">
                      <img
                        src={imagePreview}
                        alt="ภาพตัวอย่าง"
                        className="max-h-56 object-contain"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setImagePreview(null);
                          setContent("");
                        }}
                        className="absolute top-2 right-2 px-2 py-1 rounded-md bg-black/70 text-white text-[10px] font-bold"
                      >
                        ลบรูป
                      </button>
                    </div>
                  )}

                  <div>
                    <label className="block text-slate-600 text-[11px] font-semibold mb-1">
                      หรือวาง URL ของรูปภาพ:
                    </label>
                    <input
                      type="url"
                      placeholder="https://example.com/my-drawing.jpg"
                      value={content.startsWith("http") ? content : ""}
                      onChange={(e) => {
                        setContent(e.target.value);
                        setImagePreview(e.target.value);
                      }}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono"
                    />
                  </div>
                </div>
              )}

              {formatTab === "VIDEO" && (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <label className="block text-slate-700 font-bold text-xs">
                    แนบลิงก์คลิปวิดีโอ (YouTube / Google Drive / MP4) *
                  </label>
                  <input
                    type="url"
                    required={formatTab === "VIDEO"}
                    placeholder="https://www.youtube.com/watch?v=... หรือ https://youtu.be/..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-xs font-mono"
                  />
                  <p className="text-[10px] text-slate-400">
                    💡 ระบบรองรับการเปิดเล่นวิดีโอคลิปให้ครูตรวจได้โดยตรงทันที
                  </p>
                </div>
              )}

              {formatTab === "SLIDES" && (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <label className="block text-slate-700 font-bold text-xs">
                    แนบลิงก์ Canva Presentation หรือ Google Slides *
                  </label>
                  <input
                    type="url"
                    required={formatTab === "SLIDES"}
                    placeholder="https://www.canva.com/design/... หรือ Google Slides"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-xs font-mono"
                  />
                  <p className="text-[10px] text-slate-400">
                    💡 คุณครูจะสามารถดูสไลด์และเปิดพรีเซนต์ของ Canva ได้ในระบบตรวจงาน
                  </p>
                </div>
              )}

              {formatTab === "PDF" && (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <label className="block text-slate-700 font-bold text-xs">
                    แนบลิงก์ Google Drive หรือไฟล์ PDF *
                  </label>
                  <input
                    type="url"
                    required={formatTab === "PDF"}
                    placeholder="https://drive.google.com/file/d/... หรือ ลิงก์ PDF"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-xs font-mono"
                  />
                  <p className="text-[10px] text-slate-400">
                    💡 กรุณาตั้งค่าสิทธิ์ Google Drive ให้ "ทุกคนที่มีลิงก์มีสิทธิ์ดู"
                  </p>
                </div>
              )}

              {formatTab === "LINK" && (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <label className="block text-slate-700 font-bold text-xs">
                    ระบุลิงก์เว็บไซต์ หรือพิมพ์สรุปเนื้อหาที่ต้องการส่ง *
                  </label>
                  <textarea
                    rows={4}
                    required={formatTab === "LINK"}
                    placeholder="พิมพ์สรุปคำตอบ รายงาน หรือวางลิงก์ที่นี่..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-xs font-sans"
                  />
                </div>
              )}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 rounded-2xl text-xs font-black bg-[#06C755] hover:bg-emerald-600 text-white transition shadow-lg shadow-emerald-500/25 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <span>{isQuizMode ? "⚡" : "🚀"}</span>
            <span>
              {submitting
                ? "กำลังส่งข้อมูล..."
                : isQuizMode
                ? "ยืนยันส่งคำตอบ & ตรวจคะแนนทันที"
                : "ยืนยันส่งงาน & รับทันที +50 EXP"}
            </span>
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
