"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

interface Submission {
  id: string;
  studentId: string;
  content: string | null;
  submittedAt: string;
  score: number | null;
  status: string;
  student: {
    id: string;
    seatNumber: number;
    name: string;
  };
}

interface Assignment {
  id: string;
  title: string;
  description: string | null;
  dueDate: string;
  maxScore: number;
  expReward: number;
  submissions: Submission[];
}

export default function AssignmentsPage() {
  const params = useParams();
  const classroomId = params.id as string;

  const [classroom, setClassroom] = useState<any>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createData, setCreateData] = useState({
    title: "",
    description: "",
    dueDate: "",
    maxScore: "100",
    expReward: "50",
    broadcastToLine: true,
  });

  const [gradingAssignment, setGradingAssignment] = useState<Assignment | null>(null);
  const [gradingScores, setGradingScores] = useState<Record<string, string>>({});
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchClassroomAndAssignments();
  }, [classroomId]);

  const fetchClassroomAndAssignments = async () => {
    try {
      const res = await fetch(`/api/classrooms/${classroomId}`);
      const data = await res.json();
      if (data.success) {
        setClassroom(data.classroom);
        setAssignments(data.classroom.assignments);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createData.title || !createData.dueDate) return;

    setActionLoading(true);
    try {
      const res = await fetch("/api/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classroomId,
          ...createData,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowCreateModal(false);
        setCreateData({
          title: "",
          description: "",
          dueDate: "",
          maxScore: "100",
          expReward: "50",
          broadcastToLine: true,
        });
        fetchClassroomAndAssignments();
        alert("สร้างการบ้านและส่งแจ้งเตือนเข้า LINE เรียบร้อยแล้ว!");
      }
    } catch (err: any) {
      alert("ข้อผิดพลาด: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleBroadcastReminder = async (assignmentId: string) => {
    try {
      const res = await fetch(`/api/classrooms/${classroomId}/broadcast`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "reminder",
          assignmentId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert(data.note || "ส่งการ์ดทวงงานเข้ากลุ่ม LINE สำเร็จแล้ว!");
      } else {
        alert("ข้อผิดพลาด: " + data.error);
      }
    } catch (err: any) {
      alert("เกิดข้อผิดพลาด: " + err.message);
    }
  };

  const handleBroadcastAssignment = async (assignmentId: string) => {
    try {
      const res = await fetch(`/api/classrooms/${classroomId}/broadcast`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "assignment",
          assignmentId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert(data.note || "ส่งการ์ดการบ้านเข้ากลุ่ม LINE สำเร็จแล้ว!");
      } else {
        alert("ข้อผิดพลาด: " + data.error);
      }
    } catch (err: any) {
      alert("เกิดข้อผิดพลาด: " + err.message);
    }
  };

  const handleSaveGrade = async (assignmentId: string, submissionId: string) => {
    const scoreVal = gradingScores[submissionId];
    if (scoreVal === undefined || scoreVal === "") return;

    try {
      const res = await fetch(`/api/assignments/${assignmentId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "grade",
          submissionId,
          score: scoreVal,
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert("บันทึกคะแนนและแจกโบนัส EXP ให้เรียบร้อย!");
        fetchClassroomAndAssignments();
      }
    } catch (err: any) {
      alert("ข้อผิดพลาด: " + err.message);
    }
  };

  const totalStudents = classroom?.students?.length || 0;

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
            <span className="text-slate-600 font-semibold">การบ้าน & ตรวจงาน</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            การบ้านและระบบทวงงานอัตโนมัติ
          </h2>
          <p className="text-xs text-slate-500">
            มอบหมายงาน แจ้งเตือนผ่าน LINE Flex Message และตรวจงานให้คะแนน
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition shadow-sm"
        >
          <span>➕</span>
          <span>สร้างการบ้านใหม่</span>
        </button>
      </div>

      {/* Assignments List */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 text-xs">
          กำลังโหลดรายการการบ้าน...
        </div>
      ) : assignments.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
          <div className="text-4xl mb-3">📝</div>
          <h3 className="font-bold text-slate-800 text-base mb-1">
            ยังไม่มีการบ้านในห้องเรียนนี้
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            กดสร้างการบ้านเพื่อเริ่มมอบหมายงานและทวงงานผ่านบ็อต
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-500"
          >
            สร้างการบ้านใหม่
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {assignments.map((asg) => {
            const subCount = asg.submissions.length;
            const percent = totalStudents > 0 ? Math.round((subCount / totalStudents) * 100) : 0;
            const dueDate = new Date(asg.dueDate);
            const isPast = new Date() > dueDate;

            const formattedDue = new Intl.DateTimeFormat("th-TH", {
              dateStyle: "medium",
              timeStyle: "short",
            }).format(dueDate);

            return (
              <div
                key={asg.id}
                className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition space-y-4"
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-base font-bold text-slate-900">
                        {asg.title}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                        +{asg.expReward} EXP
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                        คะแนนเต็ม {asg.maxScore}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          isPast ? "bg-rose-100 text-rose-700" : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {isPast ? "เลยกำหนดส่งแล้ว" : "กำลังเปิดรับงาน"}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      {asg.description || "ไม่มีรายละเอียดเพิ่มเติม"}
                    </p>

                    <div className="text-[11px] text-slate-400 font-medium">
                      ⏰ กำหนดส่ง: <strong className={isPast ? "text-rose-600" : "text-slate-700"}>{formattedDue}</strong>
                    </div>
                  </div>

                  {/* Submission Rate Block */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 min-w-[200px] text-center">
                    <div className="text-[10px] font-semibold text-slate-400 uppercase">
                      สถานะการส่งงาน
                    </div>
                    <div className="text-xl font-black text-slate-900 mt-0.5">
                      {subCount} / {totalStudents} คน
                    </div>
                    <div className="text-[11px] text-emerald-600 font-bold mb-2">
                      ({percent}%)
                    </div>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full rounded-full transition-all"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Action Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleBroadcastAssignment(asg.id)}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition flex items-center gap-1.5"
                    >
                      <span>📢</span>
                      <span>ส่งการ์ดเข้ากลุ่ม LINE</span>
                    </button>

                    <button
                      onClick={() => handleBroadcastReminder(asg.id)}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition flex items-center gap-1.5"
                    >
                      <span>🚨</span>
                      <span>กดทวงงานคนค้างส่งเข้า LINE</span>
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      setGradingAssignment(asg);
                      // initialize scores
                      const scores: Record<string, string> = {};
                      asg.submissions.forEach((s) => {
                        scores[s.id] = s.score !== null ? s.score.toString() : "";
                      });
                      setGradingScores(scores);
                    }}
                    className="px-4 py-1.5 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition flex items-center gap-1.5"
                  >
                    <span>📋</span>
                    <span>ดูผู้ส่งงาน & ตรวจคะแนน ({subCount})</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal สร้างการบ้านใหม่ */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">
                มอบหมายการบ้านใหม่
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateAssignment} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  หัวข้อการบ้าน *
                </label>
                <input
                  type="text"
                  required
                  placeholder="เช่น ใบงานที่ 2: การทดลองสมดุลกลและคานดีดคานงัด"
                  value={createData.title}
                  onChange={(e) =>
                    setCreateData({ ...createData, title: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  คำอธิบาย / รายละเอียดคำสั่ง
                </label>
                <textarea
                  rows={3}
                  placeholder="รายละเอียดงาน เอกสารอ้างอิง หรือลิงก์โจทย์..."
                  value={createData.description}
                  onChange={(e) =>
                    setCreateData({ ...createData, description: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    กำหนดส่ง *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={createData.dueDate}
                    onChange={(e) =>
                      setCreateData({ ...createData, dueDate: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    คะแนนเต็ม
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={createData.maxScore}
                    onChange={(e) =>
                      setCreateData({ ...createData, maxScore: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    EXP รางวัล ⭐
                  </label>
                  <input
                    type="number"
                    min={10}
                    value={createData.expReward}
                    onChange={(e) =>
                      setCreateData({ ...createData, expReward: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="broadcastToLine"
                  checked={createData.broadcastToLine}
                  onChange={(e) =>
                    setCreateData({
                      ...createData,
                      broadcastToLine: e.target.checked,
                    })
                  }
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <label
                  htmlFor="broadcastToLine"
                  className="text-xs text-emerald-900 font-semibold cursor-pointer"
                >
                  📢 ส่งการ์ด LINE Flex Message มอบหมายงานเข้ากลุ่มทันที
                </label>
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
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50"
                >
                  {actionLoading ? "กำลังสร้าง..." : "บันทึกและมอบหมายงาน"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal ดูผู้ส่งงาน & ตรวจคะแนน */}
      {gradingAssignment && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  ตรวจงาน: {gradingAssignment.title}
                </h3>
                <p className="text-xs text-slate-500">
                  ส่งแล้ว {gradingAssignment.submissions.length} คน (คะแนนเต็ม:{" "}
                  {gradingAssignment.maxScore})
                </p>
              </div>
              <button
                onClick={() => setGradingAssignment(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
              {gradingAssignment.submissions.length === 0 ? (
                <div className="p-8 text-center text-slate-400">
                  ยังไม่มีนักเรียนส่งงานในชิ้นนี้
                </div>
              ) : (
                gradingAssignment.submissions.map((sub) => {
                  const subDate = new Intl.DateTimeFormat("th-TH", {
                    dateStyle: "short",
                    timeStyle: "short",
                  }).format(new Date(sub.submittedAt));

                  return (
                    <div
                      key={sub.id}
                      className="p-4 rounded-xl border border-slate-100 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-slate-900">
                            เลขที่ {sub.student.seatNumber} {sub.student.name}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              sub.status === "GRADED"
                                ? "bg-emerald-100 text-emerald-800"
                                : sub.status === "LATE"
                                ? "bg-rose-100 text-rose-800"
                                : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {sub.status === "GRADED"
                              ? "ตรวจแล้ว"
                              : sub.status === "LATE"
                              ? "ส่งช้า"
                              : "ส่งแล้ว"}
                          </span>
                        </div>

                        <div className="text-[11px] text-slate-600">
                          <strong>งานที่ส่ง: </strong>
                          {sub.content?.startsWith("http") ? (
                            <a
                              href={sub.content}
                              target="_blank"
                              rel="noreferrer"
                              className="text-blue-600 underline break-all font-mono"
                            >
                              {sub.content}
                            </a>
                          ) : (
                            <span className="text-slate-700">{sub.content}</span>
                          )}
                        </div>

                        <div className="text-[10px] text-slate-400">
                          ส่งเมื่อ: {subDate}
                        </div>
                      </div>

                      {/* Score Input */}
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          placeholder="คะแนน"
                          min={0}
                          max={gradingAssignment.maxScore}
                          value={gradingScores[sub.id] || ""}
                          onChange={(e) =>
                            setGradingScores({
                              ...gradingScores,
                              [sub.id]: e.target.value,
                            })
                          }
                          className="w-20 px-2 py-1.5 border border-slate-300 rounded-lg text-center font-bold text-xs"
                        />
                        <button
                          onClick={() => handleSaveGrade(gradingAssignment.id, sub.id)}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-500 transition"
                        >
                          บันทึก
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setGradingAssignment(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
