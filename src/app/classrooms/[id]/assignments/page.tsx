"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  FileText,
  Sparkles,
  PenTool,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Send,
  Plus,
  Trash2,
  HelpCircle,
  Video,
  Image as ImageIcon,
  Presentation,
  Check,
  AlertCircle,
  Share2,
  BellRing
} from "lucide-react";
import WorkViewer from "@/components/grading/WorkViewer";

interface Student {
  id: string;
  seatNumber: number;
  name: string;
  lineUserId?: string | null;
  egg?: any;
}

interface Submission {
  id: string;
  studentId: string;
  content: string | null;
  submissionType?: string | null;
  quizAnswers?: string | null;
  submittedAt: string;
  score: number | null;
  feedback?: string | null;
  aiFeedback?: string | null;
  annotationData?: string | null;
  status: string;
  student: Student;
}

interface RubricCriterion {
  id: string;
  name: string;
  maxScore: number;
  description?: string;
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
  rubric?: string | null;
  quizQuestions?: string | null;
  submissions: Submission[];
}

export default function AssignmentsPage() {
  const params = useParams();
  const classroomId = params.id as string;

  const [classroom, setClassroom] = useState<any>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal Create Assignment State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createType, setCreateType] = useState<"GENERAL" | "QUIZ">("GENERAL");
  const [createFormat, setCreateFormat] = useState<string>("ALL");
  const [createData, setCreateData] = useState({
    title: "",
    description: "",
    dueDate: "",
    maxScore: "100",
    expReward: "50",
    broadcastToLine: true,
  });

  // Rubric Builder State
  const [rubricCriteria, setRubricCriteria] = useState<RubricCriterion[]>([
    { id: "c1", name: "ความถูกต้องและความสมบูรณ์ของเนื้อหา", maxScore: 40, description: "เนื้อหาตรงตามโจทย์ ครบถ้วน ถูกต้อง" },
    { id: "c2", name: "ความคิดสร้างสรรค์และการประยุกต์ใช้", maxScore: 30, description: "มีการคิดวิเคราะห์และนำเสนอแปลกใหม่" },
    { id: "c3", name: "การจัดระเบียบและการนำเสนอ", maxScore: 30, description: "ความเรียบร้อย ลำดับขั้นตอน สื่อสารชัดเจน" },
  ]);

  // Quiz Builder State
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([
    {
      id: "q1",
      question: "ข้อใดคือความหมายของความเร่งในวิชาฟิสิกส์?",
      options: [
        "ระยะทางที่เคลื่อนที่ได้ในหนึ่งหน่วยเวลา",
        "อัตราการเปลี่ยนแปลงความเร็วต่อหนึ่งหน่วยเวลา",
        "มวลของวัตถุคูณด้วยความเร็ว",
        "แรงดึงดูดของโลกที่กระทำต่อวัตถุ",
      ],
      answer: 1,
      points: 10,
      explanation: "ความเร่งคืออัตราการเปลี่ยนแปลงของความเร็วต่อเวลา (a = Δv/Δt)",
    },
  ]);

  // Sequential Grading Studio State
  const [gradingAssignment, setGradingAssignment] = useState<Assignment | null>(null);
  const [activeStudentIndex, setActiveStudentIndex] = useState(0);

  // Grading form values for current active student
  const [currentScore, setCurrentScore] = useState<string>("");
  const [currentFeedback, setCurrentFeedback] = useState<string>("");
  const [currentAiFeedback, setCurrentAiFeedback] = useState<string>("");
  const [currentAnnotation, setCurrentAnnotation] = useState<string | null>(null);
  const [rubricScores, setRubricScores] = useState<Record<string, number>>({});
  const [notifyLineOnGrade, setNotifyLineOnGrade] = useState(true);

  // AI & Action Status
  const [aiLoading, setAiLoading] = useState(false);
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

  // Preset rubric loader
  const applyRubricPreset = (type: "REPORT" | "VIDEO" | "PROJECT") => {
    if (type === "REPORT") {
      setRubricCriteria([
        { id: "c1", name: "ความถูกต้องของเนื้อหา", maxScore: 50, description: "เนื้อหาถูกต้อง ครอบคลุมโจทย์" },
        { id: "c2", name: "การจัดระเบียบและลายมือ/ฟอนต์", maxScore: 25, description: "อ่านง่าย สะอาดเรียบร้อย" },
        { id: "c3", name: "การสรุปบทเรียนและตรงเวลา", maxScore: 25, description: "มีข้อสรุปที่ชัดเจน ส่งตามกำหนด" },
      ]);
    } else if (type === "VIDEO") {
      setRubricCriteria([
        { id: "c1", name: "เนื้อหาและการลำดับเรื่อง", maxScore: 40, description: "เรื่องราวต่อเนื่อง เข้าใจง่าย" },
        { id: "c2", name: "การสื่อสารและบุคลิกภาพ", maxScore: 30, description: "พูดชัดเจน มั่นใจ น่าสนใจ" },
        { id: "c3", name: "ความคิดสร้างสรรค์และเทคนิคตัดต่อ", maxScore: 30, description: "ภาพและเสียงคมชัด ลูกเล่นสร้างสรรค์" },
      ]);
    } else if (type === "PROJECT") {
      setRubricCriteria([
        { id: "c1", name: "กระบวนการแก้ปัญหาและการวิเคราะห์", maxScore: 40, description: "ใช้วิธีการทางวิทยาศาสตร์สมบูรณ์" },
        { id: "c2", name: "ความสมบูรณ์ของผลงาน", maxScore: 30, description: "ชิ้นงานใช้งานได้จริง ตอบโจทย์" },
        { id: "c3", name: "การนำเสนอและความคิดริเริ่ม", maxScore: 30, description: "แปลกใหม่ ไม่ลอกเลียนแบบ" },
      ]);
    }
  };

  // Add Question to Quiz Builder
  const handleAddQuizQuestion = () => {
    const newQ: QuizQuestion = {
      id: `q${Date.now()}`,
      question: `คำถามข้อที่ ${quizQuestions.length + 1}`,
      options: ["ตัวเลือก ก", "ตัวเลือก ข", "ตัวเลือก ค", "ตัวเลือก ง"],
      answer: 0,
      points: 10,
      explanation: "",
    };
    setQuizQuestions([...quizQuestions, newQ]);
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createData.title || !createData.dueDate) return;

    setActionLoading(true);
    try {
      const payload: any = {
        classroomId,
        ...createData,
        type: createType,
        format: createFormat,
      };

      if (createType === "GENERAL") {
        payload.rubric = rubricCriteria;
      } else {
        payload.quizQuestions = quizQuestions;
        // Total points equals sum of questions
        const totalQuizPoints = quizQuestions.reduce((sum, q) => sum + (q.points || 0), 0);
        payload.maxScore = totalQuizPoints > 0 ? totalQuizPoints : parseInt(createData.maxScore, 10);
      }

      const res = await fetch("/api/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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
      } else {
        alert("ข้อผิดพลาด: " + data.error);
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
        alert(data.note || "ส่งการ์ดทวงงานคนค้างส่งเข้ากลุ่ม LINE สำเร็จแล้ว!");
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

  // Open Sequential Grading Studio
  const openGradingStudio = (asg: Assignment) => {
    setGradingAssignment(asg);
    setActiveStudentIndex(0);
    loadStudentGradingState(asg, 0);
  };

  // Load state when switching student
  const loadStudentGradingState = (asg: Assignment, studentIdx: number) => {
    const student = classroom?.students?.[studentIdx];
    if (!student) return;

    const submission = asg.submissions.find((s) => s.studentId === student.id);
    if (submission) {
      setCurrentScore(submission.score !== null ? submission.score.toString() : "");
      setCurrentFeedback(submission.feedback || "");
      setCurrentAiFeedback(submission.aiFeedback || "");
      setCurrentAnnotation(submission.annotationData || null);
    } else {
      setCurrentScore("");
      setCurrentFeedback("");
      setCurrentAiFeedback("");
      setCurrentAnnotation(null);
    }
    setRubricScores({});
  };

  const handleSelectStudentIndex = (idx: number) => {
    if (!gradingAssignment) return;
    setActiveStudentIndex(idx);
    loadStudentGradingState(gradingAssignment, idx);
  };

  const handlePrevStudent = () => {
    if (activeStudentIndex > 0) {
      handleSelectStudentIndex(activeStudentIndex - 1);
    }
  };

  const handleNextStudent = () => {
    const total = classroom?.students?.length || 0;
    if (activeStudentIndex < total - 1) {
      handleSelectStudentIndex(activeStudentIndex + 1);
    }
  };

  // AI Rubric Pre-grader
  const handleRunAiEvaluation = async () => {
    if (!gradingAssignment) return;
    const student = classroom?.students?.[activeStudentIndex];
    if (!student) return;

    const submission = gradingAssignment.submissions.find((s) => s.studentId === student.id);
    if (!submission) {
      alert("นักเรียนยังไม่ได้ส่งงาน ไม่สามารถให้ AI ช่วยวิเคราะห์ได้");
      return;
    }

    setAiLoading(true);
    try {
      const res = await fetch(`/api/assignments/${gradingAssignment.id}/ai-grade`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submissionId: submission.id,
        }),
      });

      const data = await res.json();
      if (data.success && data.evaluation) {
        const ev = data.evaluation;
        // Populate score & feedback
        setCurrentScore(ev.totalScore.toString());
        setRubricScores(ev.criteriaScores || {});
        setCurrentAiFeedback(
          `จุดเด่น: ${ev.strengths.join(", ")}\nจุดที่ควรต่อยอด: ${ev.improvements.join(", ")}`
        );
        if (!currentFeedback.trim()) {
          setCurrentFeedback(ev.feedbackDraft);
        }
      } else {
        alert("ไม่สามารถให้ AI วิเคราะห์ได้: " + (data.error || "ข้อผิดพลาด"));
      }
    } catch (err: any) {
      alert("เกิดข้อผิดพลาด: " + err.message);
    } finally {
      setAiLoading(false);
    }
  };

  // Save Grade & Optionally Notify Individual via LINE
  const handleSaveCurrentGrade = async (autoNext = false) => {
    if (!gradingAssignment) return;
    const student = classroom?.students?.[activeStudentIndex];
    if (!student) return;

    const submission = gradingAssignment.submissions.find((s) => s.studentId === student.id);
    if (!submission) {
      alert("นักเรียนคนนี้ยังไม่ได้ส่งงาน");
      return;
    }

    if (currentScore === "" || isNaN(Number(currentScore))) {
      alert("กรุณาระบุคะแนนให้ถูกต้อง");
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch(`/api/assignments/${gradingAssignment.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "grade",
          submissionId: submission.id,
          score: currentScore,
          feedback: currentFeedback,
          aiFeedback: currentAiFeedback,
          annotationData: currentAnnotation,
          notifyStudentLine: notifyLineOnGrade,
        }),
      });

      const data = await res.json();
      if (data.success) {
        // Update local state
        const updatedSubs = gradingAssignment.submissions.map((s) =>
          s.id === submission.id
            ? {
                ...s,
                score: parseFloat(currentScore),
                status: "GRADED",
                feedback: currentFeedback,
                aiFeedback: currentAiFeedback,
                annotationData: currentAnnotation,
              }
            : s
        );

        const updatedAssignment = { ...gradingAssignment, submissions: updatedSubs };
        setGradingAssignment(updatedAssignment);

        // Update main assignments list
        setAssignments((prev) =>
          prev.map((a) => (a.id === updatedAssignment.id ? updatedAssignment : a))
        );

        let msg = "บันทึกคะแนนเรียบร้อยแล้ว!";
        if (data.lineNotified) {
          msg += "\n📲 ส่งการ์ดแจ้งผลคะแนนเข้า LINE ส่วนตัวของนักเรียนสำเร็จ!";
        }
        alert(msg);

        if (autoNext) {
          handleNextStudent();
        }
      } else {
        alert("ข้อผิดพลาด: " + data.error);
      }
    } catch (err: any) {
      alert("ข้อผิดพลาด: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle saving annotation from canvas
  const handleSaveAnnotation = (dataUrl: string) => {
    setCurrentAnnotation(dataUrl);
    alert("บันทึกภาพคอมเมนต์ปากกาเรียบร้อยแล้ว! (จะถูกบันทึกเมื่อกดปุ่มบันทึกคะแนน)");
  };

  const totalStudents = classroom?.students?.length || 0;
  const currentStudent = classroom?.students?.[activeStudentIndex];
  const currentSubmission = gradingAssignment?.submissions?.find(
    (s) => s.studentId === currentStudent?.id
  );

  // Parse rubric / quiz for grading view
  let parsedRubricCriteria: RubricCriterion[] = [];
  if (gradingAssignment?.rubric) {
    try {
      parsedRubricCriteria = JSON.parse(gradingAssignment.rubric);
    } catch (e) {
      parsedRubricCriteria = [];
    }
  }

  let parsedQuizQuestions: QuizQuestion[] = [];
  if (gradingAssignment?.quizQuestions) {
    try {
      parsedQuizQuestions = JSON.parse(gradingAssignment.quizQuestions);
    } catch (e) {
      parsedQuizQuestions = [];
    }
  }

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
            ระบบตรวจงานและประเมินผลอัจฉริยะ
          </h2>
          <p className="text-xs text-slate-500">
            ตรวจด้วย AI ตาม Rubric • รองรับปากกา iPad • ตรวจเรียงทีละคน • ควิซตรวจอัตโนมัติ
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>สร้างการบ้าน / ควิซใหม่</span>
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
            ยังไม่มีการบ้านหรือแบบทดสอบในห้องเรียนนี้
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            กดสร้างการบ้านหรือควิซเพื่อเริ่มมอบหมายงานและทวงงานผ่านบ็อต
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-500"
          >
            สร้างการบ้าน / ควิซใหม่
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
                      {asg.type === "QUIZ" ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                          ⚡ ควิซตรวจอัตโนมัติ
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                          📄 การบ้านทั่วไป
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                        +{asg.expReward} EXP
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                        คะแนนเต็ม {asg.maxScore}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          isPast ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"
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
                    onClick={() => openGradingStudio(asg)}
                    className="px-4 py-1.5 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition flex items-center gap-2 shadow-sm"
                  >
                    <PenTool className="w-3.5 h-3.5 text-rose-400" />
                    <span>เปิดห้องตรวจงาน & ให้คะแนน ({subCount})</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL 1: CREATE ASSIGNMENT / QUIZ */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">
                สร้างงานมอบหมาย / แบบทดสอบใหม่
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Type Switcher */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-2xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setCreateType("GENERAL")}
                className={`py-2 rounded-xl transition flex items-center justify-center gap-2 ${
                  createType === "GENERAL"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <FileText className="w-4 h-4 text-blue-500" />
                <span>การบ้านทั่วไป (Rubric & มัลติมีเดีย)</span>
              </button>

              <button
                type="button"
                onClick={() => setCreateType("QUIZ")}
                className={`py-2 rounded-xl transition flex items-center justify-center gap-2 ${
                  createType === "QUIZ"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <Sparkles className="w-4 h-4 text-purple-600" />
                <span>แบบทดสอบควิซ (ตรวจคะแนนอัตโนมัติ)</span>
              </button>
            </div>

            <form onSubmit={handleCreateAssignment} className="space-y-4 text-xs flex-1 overflow-y-auto pr-1">
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  หัวข้อ {createType === "QUIZ" ? "แบบทดสอบ" : "การบ้าน"} *
                </label>
                <input
                  type="text"
                  required
                  placeholder={
                    createType === "QUIZ"
                      ? "เช่น ควิซท้ายบท: การเคลื่อนที่แบบฮาร์มอนิกอย่างง่าย"
                      : "เช่น ใบงานที่ 3: สรุปผลการทดลองการสังเคราะห์ด้วยแสง"
                  }
                  value={createData.title}
                  onChange={(e) =>
                    setCreateData({ ...createData, title: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  คำอธิบาย / วัตถุประสงค์
                </label>
                <textarea
                  rows={2}
                  placeholder="รายละเอียดคำสั่ง หรือสิ่งที่ต้องการให้นักเรียนเรียนรู้..."
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

              {/* SPECIFIC BUILDER A: GENERAL RUBRICS */}
              {createType === "GENERAL" ? (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900 block text-xs">
                        เกณฑ์การประเมินตาม Rubric (ใช้สำหรับ AI และครูให้คะแนน)
                      </span>
                      <span className="text-[10px] text-slate-500">
                        เลือกเทมเพลตสำเร็จรูป หรือปรับแต่งเกณฑ์ของตนเอง
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-[10px]">
                      <button
                        type="button"
                        onClick={() => applyRubricPreset("REPORT")}
                        className="px-2 py-1 rounded bg-white border border-slate-300 hover:bg-slate-100 font-semibold"
                      >
                        รายงาน/ใบงาน
                      </button>
                      <button
                        type="button"
                        onClick={() => applyRubricPreset("VIDEO")}
                        className="px-2 py-1 rounded bg-white border border-slate-300 hover:bg-slate-100 font-semibold"
                      >
                        คลิปวิดีโอ
                      </button>
                      <button
                        type="button"
                        onClick={() => applyRubricPreset("PROJECT")}
                        className="px-2 py-1 rounded bg-white border border-slate-300 hover:bg-slate-100 font-semibold"
                      >
                        โครงงาน
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {rubricCriteria.map((rc, idx) => (
                      <div
                        key={rc.id || idx}
                        className="p-2.5 bg-white rounded-xl border border-slate-200 flex items-center gap-2"
                      >
                        <input
                          type="text"
                          value={rc.name}
                          onChange={(e) => {
                            const updated = [...rubricCriteria];
                            updated[idx].name = e.target.value;
                            setRubricCriteria(updated);
                          }}
                          placeholder="ชื่อเกณฑ์ประเมิน"
                          className="flex-1 px-2 py-1 border border-slate-200 rounded-lg text-xs"
                        />
                        <div className="flex items-center gap-1 shrink-0">
                          <input
                            type="number"
                            value={rc.maxScore}
                            onChange={(e) => {
                              const updated = [...rubricCriteria];
                              updated[idx].maxScore = parseInt(e.target.value, 10) || 0;
                              setRubricCriteria(updated);
                            }}
                            className="w-16 px-2 py-1 border border-slate-200 rounded-lg text-center font-bold text-xs"
                          />
                          <span className="text-[10px] text-slate-400">คะแนน</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            if (rubricCriteria.length > 1) {
                              setRubricCriteria(rubricCriteria.filter((_, i) => i !== idx));
                            }
                          }}
                          className="text-slate-400 hover:text-rose-500 p-1"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setRubricCriteria([
                        ...rubricCriteria,
                        {
                          id: `c${Date.now()}`,
                          name: `เกณฑ์ข้อที่ ${rubricCriteria.length + 1}`,
                          maxScore: 20,
                        },
                      ])
                    }
                    className="text-[11px] text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1"
                  >
                    <span>➕ เพิ่มเกณฑ์การประเมิน</span>
                  </button>
                </div>
              ) : (
                /* SPECIFIC BUILDER B: AUTO-GRADED QUIZ QUESTIONS */
                <div className="p-4 bg-purple-50/70 rounded-2xl border border-purple-200 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-purple-950 block text-xs">
                        ชุดคำถามแบบทดสอบ ({quizQuestions.length} ข้อ)
                      </span>
                      <span className="text-[10px] text-purple-700">
                        ระบบจะตรวจคำตอบและคิดคะแนนให้นักเรียนทันทีที่กดส่ง
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={handleAddQuizQuestion}
                      className="px-3 py-1 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white transition flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>เพิ่มข้อสอบ</span>
                    </button>
                  </div>

                  <div className="space-y-4 max-h-72 overflow-y-auto pr-1">
                    {quizQuestions.map((q, qIdx) => (
                      <div
                        key={q.id || qIdx}
                        className="p-3 bg-white rounded-xl border border-purple-100 shadow-sm space-y-2.5 text-xs"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-black text-slate-800">
                            ข้อที่ {qIdx + 1}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-500">คะแนน:</span>
                            <input
                              type="number"
                              min={1}
                              value={q.points}
                              onChange={(e) => {
                                const updated = [...quizQuestions];
                                updated[qIdx].points = parseInt(e.target.value, 10) || 1;
                                setQuizQuestions(updated);
                              }}
                              className="w-14 px-2 py-0.5 border border-slate-200 rounded text-center font-bold text-xs"
                            />
                            {quizQuestions.length > 1 && (
                              <button
                                type="button"
                                onClick={() =>
                                  setQuizQuestions(quizQuestions.filter((_, i) => i !== qIdx))
                                }
                                className="text-slate-400 hover:text-rose-500"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        </div>

                        <input
                          type="text"
                          required
                          value={q.question}
                          onChange={(e) => {
                            const updated = [...quizQuestions];
                            updated[qIdx].question = e.target.value;
                            setQuizQuestions(updated);
                          }}
                          placeholder="โจทย์คำถาม..."
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-medium text-xs"
                        />

                        {/* Options */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                          {q.options.map((opt, optIdx) => (
                            <div key={optIdx} className="flex items-center gap-1.5">
                              <input
                                type="radio"
                                name={`answer-${q.id}`}
                                checked={q.answer === optIdx}
                                onChange={() => {
                                  const updated = [...quizQuestions];
                                  updated[qIdx].answer = optIdx;
                                  setQuizQuestions(updated);
                                }}
                                className="text-purple-600 focus:ring-purple-500"
                                title="เลือกข้อนี้เป็นเฉลยที่ถูกต้อง"
                              />
                              <input
                                type="text"
                                required
                                value={opt}
                                onChange={(e) => {
                                  const updated = [...quizQuestions];
                                  updated[qIdx].options[optIdx] = e.target.value;
                                  setQuizQuestions(updated);
                                }}
                                placeholder={`ตัวเลือก ${String.fromCharCode(65 + optIdx)}`}
                                className="flex-1 px-2 py-1 border border-slate-200 rounded-lg"
                              />
                            </div>
                          ))}
                        </div>

                        <input
                          type="text"
                          value={q.explanation || ""}
                          onChange={(e) => {
                            const updated = [...quizQuestions];
                            updated[qIdx].explanation = e.target.value;
                            setQuizQuestions(updated);
                          }}
                          placeholder="คำอธิบายเฉลย (จะแสดงให้นักเรียนดูหลังตรวจเสร็จ)..."
                          className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[10px]"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

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

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
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

      {/* MODAL 2: SEQUENTIAL GRADING STUDIO (ตรวจเรียงทีละคนทั้งห้อง) */}
      {gradingAssignment && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-2 sm:p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-7xl w-full h-[95vh] shadow-2xl flex flex-col overflow-hidden border border-slate-200">
            {/* Studio Header Bar */}
            <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between gap-4 shrink-0">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setGradingAssignment(null)}
                  className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                  title="ปิดสตูดิโอ"
                >
                  ✕
                </button>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm sm:text-base text-white truncate max-w-md">
                      {gradingAssignment.title}
                    </h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300">
                      คะแนนเต็ม {gradingAssignment.maxScore}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    โหมดตรวจงานเรียงทีละคน • ส่งแล้ว {gradingAssignment.submissions.length}/{totalStudents} คน
                  </p>
                </div>
              </div>

              {/* Prev / Next controls */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrevStudent}
                  disabled={activeStudentIndex === 0}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white disabled:opacity-30 transition flex items-center gap-1 text-xs font-bold"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">คนก่อนหน้า</span>
                </button>

                <div className="px-3 py-1.5 rounded-xl bg-slate-800 text-xs font-bold text-slate-200">
                  {activeStudentIndex + 1} / {totalStudents}
                </div>

                <button
                  type="button"
                  onClick={handleNextStudent}
                  disabled={activeStudentIndex >= totalStudents - 1}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white disabled:opacity-30 transition flex items-center gap-1 text-xs font-bold"
                >
                  <span className="hidden sm:inline">คนถัดไป</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Student Horizontal Ribbon Bar */}
            <div className="bg-slate-100 border-b border-slate-200 px-4 py-2 flex items-center gap-2 overflow-x-auto shrink-0 select-none">
              {classroom?.students?.map((s: Student, idx: number) => {
                const sub = gradingAssignment.submissions.find((sub) => sub.studentId === s.id);
                const isSelected = activeStudentIndex === idx;

                let badge = "bg-slate-200 text-slate-600";
                let statusIcon = "⚠️";
                if (sub) {
                  if (sub.status === "GRADED") {
                    badge = "bg-emerald-100 text-emerald-800 border-emerald-300";
                    statusIcon = "✅";
                  } else {
                    badge = "bg-amber-100 text-amber-800 border-amber-300";
                    statusIcon = "⏳";
                  }
                }

                return (
                  <button
                    key={s.id}
                    onClick={() => handleSelectStudentIndex(idx)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition border ${
                      isSelected
                        ? "bg-slate-900 text-white border-slate-900 shadow-md scale-105"
                        : `${badge} hover:bg-white`
                    }`}
                  >
                    <span>{statusIcon}</span>
                    <span>{s.seatNumber}. {s.name}</span>
                    {sub?.score !== null && sub?.score !== undefined && (
                      <span className="ml-1 text-[10px] opacity-80">({sub.score}ค)</span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Studio Main Workspace (2 Columns) */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
              {/* LEFT COLUMN: Student Work Viewer (Col 7) */}
              <div className="lg:col-span-7 bg-slate-50 p-4 overflow-y-auto border-r border-slate-200 flex flex-col justify-start space-y-3">
                {currentSubmission ? (
                  <WorkViewer
                    content={currentSubmission.content}
                    submissionType={currentSubmission.submissionType}
                    annotationData={currentAnnotation}
                    assignmentType={gradingAssignment.type}
                    quizQuestions={parsedQuizQuestions}
                    quizAnswers={currentSubmission.quizAnswers}
                    onSaveAnnotation={handleSaveAnnotation}
                  />
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-white rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
                    <div className="text-5xl">⏳</div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-base">
                        {currentStudent?.name} (เลขที่ {currentStudent?.seatNumber}) ยังไม่ได้ส่งงาน
                      </h4>
                      <p className="text-xs text-slate-500 mt-1 max-w-sm">
                        คุณสามารถกดแจ้งเตือนทาง LINE หรือข้ามไปตรวจนักเรียนคนถัดไปได้ทันที
                      </p>
                    </div>
                    <button
                      onClick={() => handleBroadcastReminder(gradingAssignment.id)}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition flex items-center gap-1.5"
                    >
                      <BellRing className="w-3.5 h-3.5" />
                      <span>กดทวงงานเข้า LINE</span>
                    </button>
                  </div>
                )}
              </div>

              {/* RIGHT COLUMN: Grading & AI Rubric Assistant (Col 5) */}
              <div className="lg:col-span-5 bg-white p-5 overflow-y-auto flex flex-col justify-between space-y-4">
                <div className="space-y-4">
                  {/* Current Student Card */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase">
                        กำลังตรวจงานของ
                      </div>
                      <div className="font-black text-slate-900 text-sm">
                        เลขที่ {currentStudent?.seatNumber}: {currentStudent?.name}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        {currentSubmission ? (
                          <>
                            ส่งเมื่อ:{" "}
                            {new Intl.DateTimeFormat("th-TH", {
                              dateStyle: "short",
                              timeStyle: "short",
                            }).format(new Date(currentSubmission.submittedAt))}
                          </>
                        ) : (
                          <span className="text-rose-600 font-semibold">ยังไม่ส่งงาน</span>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <span
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                          currentSubmission?.status === "GRADED"
                            ? "bg-emerald-100 text-emerald-800"
                            : currentSubmission
                            ? "bg-amber-100 text-amber-800"
                            : "bg-slate-200 text-slate-600"
                        }`}
                      >
                        {currentSubmission?.status === "GRADED"
                          ? "ตรวจแล้ว"
                          : currentSubmission
                          ? "รอตรวจ"
                          : "ยังไม่ส่ง"}
                      </span>
                    </div>
                  </div>

                  {/* AI Rubric Assistant Panel */}
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-50 via-indigo-50 to-purple-50/60 border border-purple-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-purple-600" />
                        <span className="font-bold text-purple-950 text-xs">
                          AI ผู้ช่วยตรวจตาม Rubric
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={handleRunAiEvaluation}
                        disabled={aiLoading || !currentSubmission}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white transition shadow-sm disabled:opacity-50 flex items-center gap-1.5"
                      >
                        {aiLoading ? (
                          <span>กำลังวิเคราะห์...</span>
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>✨ ให้ AI ช่วยตรวจ</span>
                          </>
                        )}
                      </button>
                    </div>

                    {currentAiFeedback && (
                      <div className="p-3 bg-white/90 rounded-xl border border-purple-100 text-[11px] text-purple-950 whitespace-pre-wrap leading-relaxed">
                        {currentAiFeedback}
                      </div>
                    )}
                  </div>

                  {/* Rubric Criteria Breakdown (if any) */}
                  {parsedRubricCriteria.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-xs font-bold text-slate-700">
                        เกณฑ์การให้คะแนนตาม Rubric:
                      </div>
                      <div className="space-y-2">
                        {parsedRubricCriteria.map((crit) => {
                          const assigned = rubricScores[crit.id] ?? "";
                          return (
                            <div
                              key={crit.id}
                              className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-3 text-xs"
                            >
                              <div className="flex-1">
                                <span className="font-bold text-slate-800 block">
                                  {crit.name}
                                </span>
                                {crit.description && (
                                  <span className="text-[10px] text-slate-400 block">
                                    {crit.description}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                <input
                                  type="number"
                                  min={0}
                                  max={crit.maxScore}
                                  value={assigned}
                                  onChange={(e) => {
                                    const val = parseInt(e.target.value, 10) || 0;
                                    const newScores = { ...rubricScores, [crit.id]: val };
                                    setRubricScores(newScores);
                                    // compute total
                                    const sum = Object.values(newScores).reduce((a, b) => a + b, 0);
                                    setCurrentScore(sum.toString());
                                  }}
                                  className="w-14 px-2 py-1 border border-slate-300 rounded-lg text-center font-bold text-xs"
                                  placeholder="0"
                                />
                                <span className="text-[10px] text-slate-400">/ {crit.maxScore}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Total Score Field */}
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <label className="block text-slate-800 font-bold text-xs">
                        คะแนนรวมที่ได้ *
                      </label>
                      <span className="text-[10px] text-slate-400">
                        คะแนนเต็ม {gradingAssignment.maxScore}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min={0}
                        max={gradingAssignment.maxScore}
                        value={currentScore}
                        onChange={(e) => setCurrentScore(e.target.value)}
                        placeholder="คะแนน"
                        className="w-24 px-3 py-2 border border-slate-300 rounded-xl text-center font-black text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      <span className="text-xs font-bold text-slate-500">
                        / {gradingAssignment.maxScore}
                      </span>
                    </div>
                  </div>

                  {/* Teacher Feedback Field */}
                  <div>
                    <label className="block text-slate-800 font-bold text-xs mb-1">
                      ข้อเสนอแนะและคอมเมนต์จากคุณครู (ส่งแจ้งเตือนเข้า LINE นักเรียน)
                    </label>
                    <textarea
                      rows={3}
                      value={currentFeedback}
                      onChange={(e) => setCurrentFeedback(e.target.value)}
                      placeholder="เขียนคำชม ข้อสังเกต หรือข้อแนะนำเพื่อการพัฒนาชิ้นงาน..."
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 leading-relaxed"
                    />
                  </div>

                  {/* Individual LINE Notification Toggle */}
                  <div className="p-3 bg-emerald-50/80 rounded-2xl border border-emerald-200 flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="notifyLineOnGrade"
                      checked={notifyLineOnGrade}
                      onChange={(e) => setNotifyLineOnGrade(e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <label
                      htmlFor="notifyLineOnGrade"
                      className="text-xs text-emerald-950 font-semibold cursor-pointer"
                    >
                      📲 ส่งผลคะแนน & ข้อเสนอแนะเข้า LINE ส่วนตัวนักเรียนทันที
                    </label>
                  </div>
                </div>

                {/* Studio Footer Buttons */}
                <div className="pt-3 border-t border-slate-200 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => handleSaveCurrentGrade(false)}
                    disabled={actionLoading || !currentSubmission}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 transition disabled:opacity-50"
                  >
                    💾 บันทึกคะแนนคนนี้
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSaveCurrentGrade(true)}
                    disabled={actionLoading || !currentSubmission}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-sm disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <span>{actionLoading ? "กำลังบันทึก..." : "💾 บันทึก & ตรวจคนถัดไป"}</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
