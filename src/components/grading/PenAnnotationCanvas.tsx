"use client";

import React, { useRef, useState, useEffect } from "react";
import {
  Pen,
  Highlighter,
  Eraser,
  Undo2,
  Trash2,
  Save,
  Download,
  Stamp,
  Palette,
  CheckCircle2,
  ZoomIn,
  ZoomOut,
  Maximize2
} from "lucide-react";

interface PenAnnotationCanvasProps {
  backgroundImageUrl?: string | null;
  initialAnnotationData?: string | null;
  onSave?: (dataUrl: string) => void;
  readOnly?: boolean;
  className?: string;
}

type ToolType = "pen" | "highlighter" | "eraser" | "stamp";

const PEN_COLORS = [
  { name: "แดง (ตรวจงาน)", value: "#ef4444" },
  { name: "เขียว (ถูก)", value: "#10b981" },
  { name: "น้ำเงิน", value: "#2563eb" },
  { name: "ม่วง", value: "#8b5cf6" },
  { name: "ดำ", value: "#0f172a" },
];

const HIGHLIGHTER_COLORS = [
  { name: "เหลืองนีออน", value: "#facc15" },
  { name: "เขียวนีออน", value: "#4ade80" },
  { name: "ชมนีออน", value: "#f472b6" },
];

const STAMPS = [
  { id: "graded", label: "✅ ตรวจแล้ว", color: "#10b981", border: "#059669" },
  { id: "excellent", label: "🌟 ยอดเยี่ยม!", color: "#f59e0b", border: "#d97706" },
  { id: "good", label: "👍 ดีมาก", color: "#3b82f6", border: "#2563eb" },
  { id: "fix", label: "⚠️ แก้ไขจุดนี้", color: "#ef4444", border: "#dc2626" },
  { id: "full", label: "💯 คะแนนเต็ม", color: "#8b5cf6", border: "#7c3aed" },
];

export default function PenAnnotationCanvas({
  backgroundImageUrl,
  initialAnnotationData,
  onSave,
  readOnly = false,
  className = "",
}: PenAnnotationCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const bgImageRef = useRef<HTMLImageElement | null>(null);

  const [activeTool, setActiveTool] = useState<ToolType>("pen");
  const [penColor, setPenColor] = useState<string>("#ef4444");
  const [highlighterColor, setHighlighterColor] = useState<string>("#facc15");
  const [penSize, setPenSize] = useState<number>(3);
  const [selectedStamp, setSelectedStamp] = useState<string>("graded");
  const [isDrawing, setIsDrawing] = useState(false);
  const [history, setHistory] = useState<ImageData[]>([]);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Canvas dimensions
  const CANVAS_WIDTH = 900;
  const CANVAS_HEIGHT = 650;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    // Reset canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // If there is a background image
    if (backgroundImageUrl) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = backgroundImageUrl;
      img.onload = () => {
        bgImageRef.current = img;
        drawBackgroundAndContent(ctx, img, initialAnnotationData);
      };
      img.onerror = () => {
        // Fallback white canvas with grid pattern
        drawPaperGrid(ctx);
        if (initialAnnotationData) loadSavedAnnotation(ctx, initialAnnotationData);
      };
    } else {
      drawPaperGrid(ctx);
      if (initialAnnotationData) {
        loadSavedAnnotation(ctx, initialAnnotationData);
      }
    }
  }, [backgroundImageUrl, initialAnnotationData]);

  const drawPaperGrid = (ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw subtle paper grid
    ctx.strokeStyle = "#f1f5f9";
    ctx.lineWidth = 1;
    const gridSize = 30;
    for (let x = 0; x < CANVAS_WIDTH; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, CANVAS_HEIGHT);
      ctx.stroke();
    }
    for (let y = 0; y < CANVAS_HEIGHT; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(CANVAS_WIDTH, y);
      ctx.stroke();
    }
  };

  const drawBackgroundAndContent = (
    ctx: CanvasRenderingContext2D,
    img: HTMLImageElement,
    annotationData?: string | null
  ) => {
    // Fill white first
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Scale to fit maintaining aspect ratio
    const scale = Math.min(CANVAS_WIDTH / img.width, CANVAS_HEIGHT / img.height);
    const x = (CANVAS_WIDTH - img.width * scale) / 2;
    const y = (CANVAS_HEIGHT - img.height * scale) / 2;

    ctx.drawImage(img, x, y, img.width * scale, img.height * scale);

    if (annotationData) {
      loadSavedAnnotation(ctx, annotationData);
    } else {
      saveHistory();
    }
  };

  const loadSavedAnnotation = (ctx: CanvasRenderingContext2D, dataUrl: string) => {
    const annotImg = new Image();
    annotImg.src = dataUrl;
    annotImg.onload = () => {
      ctx.drawImage(annotImg, 0, 0);
      saveHistory();
    };
  };

  const saveHistory = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;
    const state = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setHistory((prev) => [...prev.slice(-15), state]);
  };

  const handleUndo = () => {
    if (history.length <= 1) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    const newHistory = [...history];
    newHistory.pop(); // Remove current
    const previousState = newHistory[newHistory.length - 1];
    if (previousState) {
      ctx.putImageData(previousState, 0, 0);
      setHistory(newHistory);
    }
  };

  const handleClear = () => {
    if (readOnly) return;
    if (!confirm("ต้องการล้างการเขียนคอมเมนต์ทั้งหมดหรือไม่?")) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    if (bgImageRef.current) {
      drawBackgroundAndContent(ctx, bgImageRef.current);
    } else {
      drawPaperGrid(ctx);
    }
    saveHistory();
  };

  // Pointer event coordinate translation for iPad / Touch / Desktop
  const getCoordinates = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height;
    return { x, y };
  };

  const startDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (readOnly) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.setPointerCapture(e.pointerId);

    const { x, y } = getCoordinates(e);
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    if (activeTool === "stamp") {
      drawStampAt(ctx, x, y, selectedStamp);
      saveHistory();
      return;
    }

    setIsDrawing(true);
    ctx.beginPath();
    ctx.moveTo(x, y);

    setupContextStyles(ctx);
  };

  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing || readOnly) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    const { x, y } = getCoordinates(e);

    // Apply pressure if Apple pencil / stylus
    if (e.pointerType === "pen" && e.pressure && e.pressure > 0) {
      ctx.lineWidth = Math.max(1, penSize * e.pressure * 1.5);
    }

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing || readOnly) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      canvas.releasePointerCapture(e.pointerId);
    } catch {}

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (ctx) {
      ctx.closePath();
    }
    setIsDrawing(false);
    saveHistory();
  };

  const setupContextStyles = (ctx: CanvasRenderingContext2D) => {
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (activeTool === "pen") {
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = penColor;
      ctx.lineWidth = penSize;
      ctx.globalAlpha = 1.0;
    } else if (activeTool === "highlighter") {
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = highlighterColor;
      ctx.lineWidth = penSize * 4;
      ctx.globalAlpha = 0.35;
    } else if (activeTool === "eraser") {
      ctx.globalCompositeOperation = "destination-out";
      ctx.lineWidth = penSize * 5;
      ctx.globalAlpha = 1.0;
    }
  };

  const drawStampAt = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    stampId: string
  ) => {
    const stampObj = STAMPS.find((s) => s.id === stampId) || STAMPS[0];

    ctx.save();
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 0.95;

    // Draw Stamp Badge
    const stampWidth = 140;
    const stampHeight = 44;
    const startX = x - stampWidth / 2;
    const startY = y - stampHeight / 2;

    // Pill Background
    ctx.fillStyle = stampObj.color;
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(startX, startY, stampWidth, stampHeight, 22);
    ctx.fill();
    ctx.stroke();

    // Shadow & Border
    ctx.strokeStyle = stampObj.border;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Text
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 16px Prompt, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(stampObj.label, x, y + 1);

    ctx.restore();
  };

  const handleExport = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");
    if (onSave) {
      onSave(dataUrl);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    }
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `annotation-${Date.now()}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  return (
    <div className={`flex flex-col bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-xl select-none ${className}`}>
      {/* iPad Toolbar */}
      {!readOnly && (
        <div className="bg-slate-800/90 border-b border-slate-700/80 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 backdrop-blur-md">
          {/* Main Drawing Tools */}
          <div className="flex items-center gap-1.5 bg-slate-900/60 p-1 rounded-xl border border-slate-700/50">
            <button
              type="button"
              onClick={() => setActiveTool("pen")}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                activeTool === "pen"
                  ? "bg-red-500 text-white shadow-sm"
                  : "text-slate-300 hover:text-white hover:bg-slate-800"
              }`}
              title="ปากกาตรวจงาน (Apple Pencil / Touch)"
            >
              <Pen className="w-3.5 h-3.5" />
              <span>ปากกา</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTool("highlighter")}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                activeTool === "highlighter"
                  ? "bg-amber-400 text-slate-950 shadow-sm"
                  : "text-slate-300 hover:text-white hover:bg-slate-800"
              }`}
              title="ปากกาไฮไลท์"
            >
              <Highlighter className="w-3.5 h-3.5" />
              <span>ไฮไลท์</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTool("eraser")}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                activeTool === "eraser"
                  ? "bg-slate-600 text-white shadow-sm"
                  : "text-slate-300 hover:text-white hover:bg-slate-800"
              }`}
              title="ยางลบ"
            >
              <Eraser className="w-3.5 h-3.5" />
              <span>ยางลบ</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTool("stamp")}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                activeTool === "stamp"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-slate-300 hover:text-white hover:bg-slate-800"
              }`}
              title="แสตมป์ตรวจงานด่วน"
            >
              <Stamp className="w-3.5 h-3.5" />
              <span>ตราปั๊ม</span>
            </button>
          </div>

          {/* Color Palettes */}
          {activeTool === "pen" && (
            <div className="flex items-center gap-1.5 bg-slate-900/60 p-1.5 rounded-xl border border-slate-700/50">
              {PEN_COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setPenColor(c.value)}
                  className={`w-6 h-6 rounded-full border-2 transition ${
                    penColor === c.value ? "border-white scale-110 shadow" : "border-transparent opacity-80"
                  }`}
                  style={{ backgroundColor: c.value }}
                  title={c.name}
                />
              ))}
            </div>
          )}

          {activeTool === "highlighter" && (
            <div className="flex items-center gap-1.5 bg-slate-900/60 p-1.5 rounded-xl border border-slate-700/50">
              {HIGHLIGHTER_COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setHighlighterColor(c.value)}
                  className={`w-6 h-6 rounded-full border-2 transition ${
                    highlighterColor === c.value ? "border-white scale-110 shadow" : "border-transparent opacity-80"
                  }`}
                  style={{ backgroundColor: c.value }}
                  title={c.name}
                />
              ))}
            </div>
          )}

          {activeTool === "stamp" && (
            <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
              {STAMPS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSelectedStamp(s.id)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                    selectedStamp === s.id
                      ? "bg-white text-slate-950 shadow"
                      : "bg-slate-700/80 text-slate-200 hover:bg-slate-700"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          )}

          {/* Pen Size Slider */}
          {(activeTool === "pen" || activeTool === "highlighter" || activeTool === "eraser") && (
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <span className="text-[10px] text-slate-400 font-medium">ขนาด:</span>
              <div className="flex items-center gap-1">
                {[2, 4, 8, 14].map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setPenSize(size)}
                    className={`w-6 h-6 rounded-lg text-[10px] font-bold flex items-center justify-center transition ${
                      penSize === size ? "bg-white text-slate-950 font-black" : "bg-slate-700/60 text-slate-300 hover:bg-slate-700"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Actions: Undo, Clear, Save, Download */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleUndo}
              disabled={history.length <= 1}
              className="p-1.5 rounded-lg bg-slate-700/80 hover:bg-slate-700 text-slate-200 disabled:opacity-30 transition"
              title="เลิกทำ (Undo)"
            >
              <Undo2 className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleClear}
              className="p-1.5 rounded-lg bg-slate-700/80 hover:bg-rose-900/60 text-rose-300 transition"
              title="ล้างทั้งหมด"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleDownload}
              className="p-1.5 rounded-lg bg-slate-700/80 hover:bg-slate-700 text-slate-200 transition"
              title="ดาวน์โหลดภาพคอมเมนต์"
            >
              <Download className="w-4 h-4" />
            </button>

            {onSave && (
              <button
                type="button"
                onClick={handleExport}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-sm"
              >
                {savedSuccess ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                    <span>บันทึกแล้ว!</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>บันทึกคอมเมนต์</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      )}

      {/* iPad Touch Canvas Drawing Area */}
      <div
        className="relative w-full overflow-hidden flex items-center justify-center bg-slate-950 p-2"
        style={{ touchAction: "none" }}
      >
        <div className="relative shadow-2xl rounded-xl overflow-hidden border border-slate-800">
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            onPointerDown={startDrawing}
            onPointerMove={draw}
            onPointerUp={stopDrawing}
            onPointerCancel={stopDrawing}
            onPointerLeave={stopDrawing}
            className="cursor-crosshair block max-w-full h-auto bg-white"
            style={{
              touchAction: "none",
              userSelect: "none",
              WebkitUserSelect: "none",
            }}
          />

          {/* iPad Mode indicator overlay */}
          <div className="absolute bottom-2 left-2 pointer-events-none px-2 py-1 rounded-md bg-slate-900/80 text-[10px] text-slate-300 font-mono flex items-center gap-1.5 backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>iPad & Pen Ready • {activeTool === "stamp" ? "แตะเพื่อวางแสตมป์" : "วาดด้วยปากกา/Apple Pencil ได้ทันที"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
