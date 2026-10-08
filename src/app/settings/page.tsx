"use client";

import { useState } from "react";

export default function SettingsPage() {
  const [webhookUrl, setWebhookUrl] = useState("http://localhost:3000/api/line/webhook");
  const [copied, setCopied] = useState(false);
  const [testingCron, setTestingCron] = useState<string | null>(null);
  const [cronResult, setCronResult] = useState<any>(null);

  const copyWebhook = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTestCron = async (type: "reminders" | "attendance") => {
    setTestingCron(type);
    setCronResult(null);

    try {
      const res = await fetch(`/api/cron/${type}`);
      const data = await res.json();
      setCronResult(data);
    } catch (err: any) {
      setCronResult({ error: err.message });
    } finally {
      setTestingCron(null);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl animate-fade-in font-prompt">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-slate-800">
        <div className="absolute -right-12 -bottom-12 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-0 right-1/4 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold bg-white/10 text-white/90 border border-white/10 backdrop-blur-md">
            <span>⚙️ การเชื่อมต่อ & API</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            ตั้งค่าระบบ & การเชื่อมต่อ LINE Messaging API
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            คู่มือการนำระบบไปต่อเข้ากับ LINE Official Account, Webhook และระบบตั้งเวลาอัตโนมัติ (Cron Jobs)
          </p>
        </div>
      </div>

      {/* Webhook Configuration Card */}
      <div className="modern-card bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white flex items-center justify-center text-xl shadow-md shadow-indigo-500/20">
              🔗
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-base tracking-tight">
                LINE Messaging API Webhook URL
              </h3>
              <p className="text-xs text-slate-400">
                จุดเชื่อมต่อรับเหตุการณ์จาก LINE Platform เข้าสู่ระบบ
              </p>
            </div>
          </div>
          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200/80">
            Active Endpoint
          </span>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          นำ URL ด้านล่างนี้ไปกรอกในเมนู <strong>Messaging API</strong> &gt; <strong>Webhook URL</strong> บน{" "}
          <a
            href="https://developers.line.biz/"
            target="_blank"
            rel="noreferrer"
            className="text-indigo-600 underline font-bold hover:text-indigo-700"
          >
            LINE Developers Console
          </a>{" "}
          พร้อมทั้งเปิดใช้งานตัวเลือก <strong>Use Webhook</strong>
        </p>

        <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-2xl border border-slate-200">
          <input
            type="text"
            readOnly
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            className="flex-1 px-3 bg-transparent font-mono text-xs text-slate-800 outline-none select-all"
          />
          <button
            onClick={copyWebhook}
            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition active:scale-95 shadow-sm"
          >
            {copied ? "✓ คัดลอกแล้ว!" : "คัดลอก URL"}
          </button>
        </div>

        <div className="p-4 bg-amber-50/80 rounded-2xl border border-amber-200 text-xs text-amber-900 space-y-1">
          <div className="font-bold flex items-center gap-1.5">
            <span>💡</span>
            <span>คำแนะนำสำหรับการรัน Localhost:</span>
          </div>
          <p className="text-[11px] text-amber-800 leading-relaxed">
            หากต้องการทดสอบ LINE จริงบนเครื่อง สามารถใช้เครื่องมือเช่น <code className="bg-amber-100/80 px-1.5 py-0.5 rounded font-mono">ngrok http 3000</code> แล้วนำ URL ของ ngrok มาต่อท้ายด้วย <code className="bg-amber-100/80 px-1.5 py-0.5 rounded font-mono">/api/line/webhook</code> หรือทดสอบผ่านหน้า <strong>จำลอง LINE Bot (Simulator)</strong> ได้ทันที
          </p>
        </div>
      </div>

      {/* Automated Scheduler & Cron Card */}
      <div className="modern-card bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 text-white flex items-center justify-center text-xl shadow-md shadow-violet-500/20">
            ⏰
          </div>
          <div>
            <h3 className="font-black text-slate-900 text-base tracking-tight">
              ระบบตั้งเวลาและส่งแจ้งเตือนอัตโนมัติ (Automated Cron Jobs)
            </h3>
            <p className="text-xs text-slate-400">
              เรียกทำงานอัตโนมัติตามช่วงเวลาด้วย Vercel Cron หรือ Cloud Scheduler
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Cron 1: Homework Reminders */}
          <div className="p-5 rounded-2xl border border-slate-200/80 bg-slate-50/60 space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">1. ระบบทวงการบ้านล่วงหน้า</span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] bg-rose-100 text-rose-800 font-bold">
                  08:00 & 18:00
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                ตรวจหาการบ้านที่ครบกำหนดส่งภายใน 48 ชั่วโมง และส่งการ์ดแจ้งเตือนพร้อมรายชื่อผู้ค้างส่งเข้ากลุ่ม LINE
              </p>
              <div className="font-mono text-[11px] text-slate-700 bg-white p-2.5 rounded-xl border border-slate-200">
                GET /api/cron/reminders
              </div>
            </div>
            <button
              onClick={() => handleTestCron("reminders")}
              disabled={!!testingCron}
              className="w-full py-2.5 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition disabled:opacity-50 active:scale-95 shadow-sm"
            >
              {testingCron === "reminders" ? "กำลังประมวลผล..." : "⚡ ทดสอบยิง Cron ทวงงานตอนนี้"}
            </button>
          </div>

          {/* Cron 2: Attendance Summary */}
          <div className="p-5 rounded-2xl border border-slate-200/80 bg-slate-50/60 space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">2. ระบบสรุปการมาเรียนประจำวัน</span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] bg-blue-100 text-blue-800 font-bold">
                  16:30 ทุกวัน
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                สรุปสถิติจำนวนคนมาเรียน มาสาย ขาด ลา ประจำวัน และส่งใบสรุปเช็คชื่อเข้ากลุ่ม LINE ของแต่ละห้อง
              </p>
              <div className="font-mono text-[11px] text-slate-700 bg-white p-2.5 rounded-xl border border-slate-200">
                GET /api/cron/attendance
              </div>
            </div>
            <button
              onClick={() => handleTestCron("attendance")}
              disabled={!!testingCron}
              className="w-full py-2.5 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition disabled:opacity-50 active:scale-95 shadow-sm"
            >
              {testingCron === "attendance" ? "กำลังประมวลผล..." : "⚡ ทดสอบยิง Cron สรุปเช็คชื่อตอนนี้"}
            </button>
          </div>
        </div>

        {cronResult && (
          <div className="p-4 bg-slate-950 text-emerald-400 rounded-2xl font-mono text-xs overflow-x-auto space-y-1.5 border border-white/10 animate-fade-in">
            <div className="text-white font-bold flex items-center gap-2">
              <span>✅</span>
              <span>ผลการทำงานของ Cron:</span>
            </div>
            <pre className="text-[11px] text-emerald-300">{JSON.stringify(cronResult, null, 2)}</pre>
          </div>
        )}
      </div>

      {/* Gamification Settings Card */}
      <div className="modern-card bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-4 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 text-white flex items-center justify-center text-xl shadow-md shadow-amber-500/20">
            🎮
          </div>
          <div>
            <h3 className="font-black text-slate-900 text-base tracking-tight">
              กติกาการคำนวณ EXP และระบบกาชา (Gamification Rules)
            </h3>
            <p className="text-xs text-slate-400">
              แต้มคะแนนสำหรับการฟักไข่ เลเวล และของรางวัล
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="p-3.5 bg-emerald-50/70 rounded-2xl border border-emerald-100">
            <span className="text-slate-500 block text-[10px] font-semibold">เช็คชื่อมาเรียน</span>
            <span className="text-base font-black text-emerald-700 mt-0.5 block">+15 EXP</span>
          </div>
          <div className="p-3.5 bg-amber-50/70 rounded-2xl border border-amber-100">
            <span className="text-slate-500 block text-[10px] font-semibold">เช็คชื่อมาสาย</span>
            <span className="text-base font-black text-amber-700 mt-0.5 block">+5 EXP</span>
          </div>
          <div className="p-3.5 bg-blue-50/70 rounded-2xl border border-blue-100">
            <span className="text-slate-500 block text-[10px] font-semibold">ส่งการบ้านตรงเวลา</span>
            <span className="text-base font-black text-blue-700 mt-0.5 block">+50 EXP</span>
          </div>
          <div className="p-3.5 bg-purple-50/70 rounded-2xl border border-purple-100">
            <span className="text-slate-500 block text-[10px] font-semibold">คะแนนสอบ/งานดีเด่น</span>
            <span className="text-base font-black text-purple-700 mt-0.5 block">+20 EXP</span>
          </div>
        </div>

        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-[11px] text-slate-600 leading-relaxed space-y-1">
          <div>• ทุกๆ <strong className="text-slate-900">100 EXP</strong> ไข่มอนสเตอร์จะเติบโตเต็มที่และกะเทาะเปลือก (Hatch)</div>
          <div>• ทุกๆ <strong className="text-slate-900">50 EXP</strong> ระดับเลเวล (Level) ของนักเรียนจะเพิ่มขึ้น 1 เลเวล</div>
          <div>• ระบบ Gacha มีอัตราการสุ่มตามประเภทไข่: Common (65%), Rare (25%), Epic (8%), Legendary (2%)</div>
        </div>
      </div>
    </div>
  );
}
