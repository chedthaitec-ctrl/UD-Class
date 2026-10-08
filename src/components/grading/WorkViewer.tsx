"use client";

import React, { useState } from "react";
import {
  FileText,
  Image as ImageIcon,
  Video,
  Presentation,
  ExternalLink,
  PenTool,
  Eye,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Download
} from "lucide-react";
import PenAnnotationCanvas from "./PenAnnotationCanvas";

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  answer: number;
  points: number;
  explanation?: string;
}

interface WorkViewerProps {
  content?: string | null;
  submissionType?: string | null;
  annotationData?: string | null;
  assignmentType?: string;
  quizQuestions?: QuizQuestion[] | null;
  quizAnswers?: Record<string, number> | string | null;
  onSaveAnnotation?: (dataUrl: string) => void;
  readOnly?: boolean;
}

export default function WorkViewer({
  content,
  submissionType,
  annotationData,
  assignmentType = "GENERAL",
  quizQuestions,
  quizAnswers,
  onSaveAnnotation,
  readOnly = false,
}: WorkViewerProps) {
  const [penMode, setPenMode] = useState<boolean>(false);

  const rawContent = (content || "").trim();

  // Parse quiz answers if passed as string
  let parsedQuizAnswers: Record<string, number> = {};
  if (quizAnswers) {
    if (typeof quizAnswers === "string") {
      try {
        parsedQuizAnswers = JSON.parse(quizAnswers);
      } catch (e) {
        parsedQuizAnswers = {};
      }
    } else {
      parsedQuizAnswers = quizAnswers;
    }
  }

  // Detect content type
  const isUrl = rawContent.startsWith("http://") || rawContent.startsWith("https://");
  const isImage =
    submissionType === "IMAGE" ||
    rawContent.startsWith("data:image/") ||
    /\.(jpg|jpeg|png|webp|gif)($|\?)/i.test(rawContent);
  const isYoutube =
    /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/i.test(rawContent);
  const isVideoFile = /\.(mp4|webm|mov|m4v)($|\?)/i.test(rawContent);
  const isCanva = /canva\.com\/design\//i.test(rawContent);
  const isGoogleSlide = /docs\.google\.com\/presentation\//i.test(rawContent);
  const isPdf = /\.pdf($|\?)/i.test(rawContent);

  // Helper for YouTube Embed URL
  const getYoutubeEmbedUrl = (url: string) => {
    let videoId = "";
    if (url.includes("youtu.be/")) {
      videoId = url.split("youtu.be/")[1]?.split("?")[0] || "";
    } else if (url.includes("watch?v=")) {
      videoId = url.split("watch?v=")[1]?.split("&")[0] || "";
    } else if (url.includes("/embed/")) {
      return url;
    }
    return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
  };

  // Helper for Canva Embed URL
  const getCanvaEmbedUrl = (url: string) => {
    if (url.includes("view?embed")) return url;
    const base = url.split("?")[0].replace(/\/$/, "");
    return `${base}/view?embed`;
  };

  // Helper for Google Slides Embed URL
  const getGoogleSlideEmbedUrl = (url: string) => {
    if (url.includes("/embed")) return url;
    return url.replace(/\/edit.*$/, "/embed?start=false&loop=false&delayms=3000");
  };

  // If Quiz Assignment Type or Quiz Answers exist
  if (assignmentType === "QUIZ" || (quizQuestions && quizQuestions.length > 0)) {
    return (
      <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <span className="text-xl">📝</span>
            <div>
              <h4 className="font-bold text-slate-900 text-sm">
                รายละเอียดการตอบแบบทดสอบ (Quiz Breakdown)
              </h4>
              <p className="text-[11px] text-slate-500">
                ระบบตรวจคำตอบอัตโนมัติเปรียบเทียบกับเฉลยของครู
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-100 text-purple-800">
            {quizQuestions?.length || 0} ข้อ
          </span>
        </div>

        <div className="space-y-4 max-h-[550px] overflow-y-auto pr-1">
          {quizQuestions?.map((q, idx) => {
            const studentChoice = parsedQuizAnswers[q.id];
            const isCorrect = studentChoice === q.answer;
            const hasAnswered = studentChoice !== undefined;

            return (
              <div
                key={q.id || idx}
                className={`p-4 rounded-xl border transition ${
                  isCorrect
                    ? "bg-emerald-50/70 border-emerald-200"
                    : hasAnswered
                    ? "bg-rose-50/70 border-rose-200"
                    : "bg-slate-100/70 border-slate-200"
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2 font-bold text-slate-900 text-xs">
                    <span className="w-6 h-6 rounded-lg bg-slate-900 text-white flex items-center justify-center text-[10px]">
                      {idx + 1}
                    </span>
                    <span>{q.question}</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {isCorrect ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-600 text-white">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>+{q.points} คะแนน</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-600 text-white">
                        <XCircle className="w-3 h-3" />
                        <span>0 / {q.points} คะแนน</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Choices list */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 my-2 text-[11px]">
                  {q.options.map((opt, optIdx) => {
                    const isSelected = studentChoice === optIdx;
                    const isTheCorrectAnswer = q.answer === optIdx;

                    let badgeColor = "bg-white border-slate-200 text-slate-700";
                    if (isTheCorrectAnswer) {
                      badgeColor = "bg-emerald-100 border-emerald-300 text-emerald-900 font-bold";
                    } else if (isSelected && !isCorrect) {
                      badgeColor = "bg-rose-100 border-rose-300 text-rose-900 font-bold";
                    }

                    return (
                      <div
                        key={optIdx}
                        className={`p-2 rounded-lg border flex items-center justify-between gap-2 ${badgeColor}`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full border border-slate-300 flex items-center justify-center text-[10px] font-bold bg-white">
                            {String.fromCharCode(65 + optIdx)}
                          </span>
                          <span>{opt}</span>
                        </div>
                        {isSelected && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-900 text-white font-bold">
                            นักเรียนเลือก
                          </span>
                        )}
                        {isTheCorrectAnswer && !isSelected && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-600 text-white font-bold">
                            เฉลย
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {q.explanation && (
                  <div className="mt-2 p-2 bg-white/80 rounded-lg border border-slate-200 text-[10px] text-slate-600 flex items-start gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                    <span>คำอธิบายเฉลย: {q.explanation}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Pen Mode active: Render PenAnnotationCanvas
  if (penMode) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
            <PenTool className="w-4 h-4 text-rose-500" />
            <span>โหมดเขียนตรวจงานด้วยปากกา (iPad / Stylus Studio)</span>
          </div>
          <button
            type="button"
            onClick={() => setPenMode(false)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-200 hover:bg-slate-300 text-slate-800 transition"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>สลับไปดูชิ้นงานปกติ</span>
          </button>
        </div>

        <PenAnnotationCanvas
          backgroundImageUrl={isImage ? rawContent : null}
          initialAnnotationData={annotationData}
          onSave={onSaveAnnotation}
          readOnly={readOnly}
        />
      </div>
    );
  }

  // Non-pen mode: Multi-format preview
  return (
    <div className="space-y-3">
      {/* Top action switcher */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isImage ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-100 text-blue-800">
              <ImageIcon className="w-3.5 h-3.5" />
              <span>ชิ้นงานรูปภาพ</span>
            </span>
          ) : isYoutube || isVideoFile ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-100 text-rose-800">
              <Video className="w-3.5 h-3.5" />
              <span>วิดีโอคลิป</span>
            </span>
          ) : isCanva || isGoogleSlide ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-100 text-purple-800">
              <Presentation className="w-3.5 h-3.5" />
              <span>สไลด์นำเสนอ</span>
            </span>
          ) : isPdf ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-100 text-amber-800">
              <FileText className="w-3.5 h-3.5" />
              <span>เอกสาร PDF</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-800">
              <FileText className="w-3.5 h-3.5" />
              <span>งานเขียน / ลิงก์</span>
            </span>
          )}
        </div>

        {/* Switch to Pen annotation canvas */}
        <button
          type="button"
          onClick={() => setPenMode(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition shadow-sm"
        >
          <PenTool className="w-3.5 h-3.5" />
          <span>🖊️ เปิดโหมดเขียนคอมเมนต์บนงาน (iPad)</span>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="rounded-2xl border border-slate-200 bg-slate-900 overflow-hidden shadow-inner flex items-center justify-center min-h-[380px] max-h-[620px] relative">
        {/* Case 1: Image */}
        {isImage ? (
          <div className="relative w-full h-full p-2 flex items-center justify-center bg-slate-950">
            <img
              src={rawContent}
              alt="ชิ้นงานนักเรียน"
              className="max-h-[560px] w-auto object-contain rounded-lg shadow-lg"
            />
            {annotationData && (
              <img
                src={annotationData}
                alt="ลายเส้นคอมเมนต์"
                className="absolute inset-0 max-h-[560px] w-auto object-contain m-auto pointer-events-none"
              />
            )}
          </div>
        ) : isYoutube ? (
          // Case 2: YouTube Video
          <div className="w-full aspect-video">
            <iframe
              src={getYoutubeEmbedUrl(rawContent)}
              title="YouTube video player"
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : isVideoFile ? (
          // Case 3: MP4 HTML5 Video
          <div className="w-full aspect-video flex items-center justify-center bg-black">
            <video controls className="w-full max-h-[550px]">
              <source src={rawContent} />
              เบราว์เซอร์ไม่รองรับการเล่นวิดีโอนี้
            </video>
          </div>
        ) : isCanva ? (
          // Case 4: Canva Presentation Embed
          <div className="w-full aspect-video relative">
            <iframe
              src={getCanvaEmbedUrl(rawContent)}
              title="Canva Presentation"
              className="w-full h-full border-0"
              allowFullScreen
            />
          </div>
        ) : isGoogleSlide ? (
          // Case 5: Google Slides Embed
          <div className="w-full aspect-video relative">
            <iframe
              src={getGoogleSlideEmbedUrl(rawContent)}
              title="Google Slides"
              className="w-full h-full border-0"
              allowFullScreen
            />
          </div>
        ) : isPdf ? (
          // Case 6: PDF Viewer
          <div className="w-full h-[550px] bg-slate-100 flex flex-col">
            <iframe
              src={rawContent}
              title="PDF Document"
              className="w-full flex-1 border-0"
            />
          </div>
        ) : isUrl ? (
          // Case 7: General URL
          <div className="p-8 text-center bg-white w-full h-full flex flex-col items-center justify-center space-y-4">
            <div className="text-5xl">🔗</div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm mb-1">
                ลิงก์ส่งงานภายนอก
              </h4>
              <p className="text-xs text-slate-500 max-w-md break-all font-mono">
                {rawContent}
              </p>
            </div>
            <a
              href={rawContent}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition shadow"
            >
              <span>เปิดลิงก์ชิ้นงานในหน้าต่างใหม่</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        ) : (
          // Case 8: Plain Text Submission
          <div className="p-6 bg-white w-full h-full overflow-y-auto min-h-[350px]">
            <div className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">
              เนื้อหา / คำตอบที่นักเรียนส่ง:
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-slate-800 text-xs leading-relaxed whitespace-pre-wrap font-sans">
              {rawContent || "ไม่มีเนื้อหา"}
            </div>
          </div>
        )}
      </div>

      {/* External direct launch link for quick check */}
      {isUrl && (
        <div className="flex items-center justify-between text-[11px] text-slate-500 px-2">
          <span className="truncate max-w-[80%] font-mono">🔗 {rawContent}</span>
          <a
            href={rawContent}
            target="_blank"
            rel="noreferrer"
            className="text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1 shrink-0"
          >
            <span>เปิดหน้าต่างใหม่</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      )}
    </div>
  );
}
