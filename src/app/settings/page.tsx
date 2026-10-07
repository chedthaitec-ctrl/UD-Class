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
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">
          ตั้งค่าระบบ & การเชื่อมต่อ LINE Messaging API
        </h2>
        <p className="text-xs text-slate-500">
          คู่มือการนำระบบไปต่อเข้ากับ LINE Official Account, Webhook และระบบตั้งเวลาอัตโนมัติ (Cron)
        </p>
      </div>

      {/* Webhook Configuration Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <span>🔗</span>
            <span>LINE Messaging API Webhook URL</span>
          </h3>
          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            Active Endpoint
          </span>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          นำ URL ด้านล่างนี้ไปกรอกในเมนู <strong>Messaging API</strong> &gt; <strong>Webhook URL</strong> บน{" "}
          <a
            href="https://developers.line.biz/"
            target="_blank"
            rel="noreferrer"
            className="text-blue-600 underline font-semibold"
          >
            LINE Developers Console
          </a>{" "}
          พร้อมทั้งเปิดใช้งานตัวเลือก <strong>Use Webhook</strong>
        </p>

        <div className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200">
          <input
            type="text"
            readOnly
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            className="flex-1 bg-transparent font-mono text-xs text-slate-800 outline-none select-all"
          />
          <button
            onClick={copyWebhook}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition"
          >
            {copied ? "คัดลอกแล้ว!" : "คัดลอก"}
          </button>
        </div>

        <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-1">
          <div className="font-bold">💡 ทิปสำหรับการรัน Localhost:</div>
          <p className="text-[11px] text-amber-800">
            หากต้องการทดสอบ LINE จริงบนเครื่องส่วนตัว สามารถใช้เครื่องมือเช่น <code>ngrok http 3000</code> แล้วนำ URL ของ ngrok มาต่อท้ายด้วย <code>/api/line/webhook</code> หรือสามารถใช้หน้า <strong>จำลอง LINE Bot (Simulator)</strong> ในระบบนี้ได้ทันทีโดยไม่ต้องเปิด ngrok!
          </p>
        </div>
      </div>

      {/* Automated Scheduler & Cron Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
        <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
          <span>⏰</span>
          <span>ระบบตั้งเวลาและส่งแจ้งเตือนอัตโนมัติ (Automated Cron Jobs)</span>
        </h3>

        <p className="text-xs text-slate-600 leading-relaxed">
          ระบบมี Endpoint สำหรับให้เซิร์ฟเวอร์หรือ Cloud Scheduler เรียกทำงานตามช่วงเวลาที่กำหนด:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Cron 1: Homework Reminders */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900">1. ระบบทวงการบ้านล่วงหน้า</span>
              <span className="px-2 py-0.5 rounded text-[10px] bg-rose-100 text-rose-800 font-bold">
                แนะนำ 08:00 & 18:00
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              ตรวจหาการบ้านที่ครบกำหนดส่งภายใน 48 ชั่วโมง และส่งการ์ดทวงงานพร้อมรายชื่อคนค้างส่งเข้ากลุ่ม LINE
            </p>
            <div className="font-mono text-[10px] text-slate-600 bg-white p-2 rounded-lg border border-slate-200">
              GET /api/cron/reminders
            </div>
            <button
              onClick={() => handleTestCron("reminders")}
              disabled={!!testingCron}
              className="w-full py-2 rounded-lg text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition disabled:opacity-50"
            >
              {testingCron === "reminders" ? "กำลังประมวลผล..." : "⚡ ทดสอบยิง Cron ทวงงานตอนนี้"}
            </button>
          </div>

          {/* Cron 2: Attendance Summary */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900">2. ระบบสรุปการมาเรียนประจำวัน</span>
              <span className="px-2 py-0.5 rounded text-[10px] bg-blue-100 text-blue-800 font-bold">
                แนะนำ 16:30 ทุกวัน
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              สรุปสถิติจำนวนคนมาเรียน มาสาย ขาด ลา ประจำวัน และส่งใบสรุปเช็คชื่อเข้ากลุ่ม LINE ของแต่ละห้อง
            </p>
            <div className="font-mono text-[10px] text-slate-600 bg-white p-2 rounded-lg border border-slate-200">
              GET /api/cron/attendance
            </div>
            <button
              onClick={() => handleTestCron("attendance")}
              disabled={!!testingCron}
              className="w-full py-2 rounded-lg text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition disabled:opacity-50"
            >
              {testingCron === "attendance" ? "กำลังประมวลผล..." : "⚡ ทดสอบยิง Cron สรุปเช็คชื่อตอนนี้"}
            </button>
          </div>
        </div>

        {cronResult && (
          <div className="p-4 bg-slate-900 text-emerald-400 rounded-xl font-mono text-xs overflow-x-auto space-y-1">
            <div className="text-white font-bold">ผลการทำงานของ Cron:</div>
            <pre>{JSON.stringify(cronResult, null, 2)}</pre>
          </div>
        )}
      </div>

      {/* Gamification Settings Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-3 text-xs">
        <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
          <span>🎮</span>
          <span>กติกาการคำนวณ EXP และระบบกาชา (Gamification Rules)</span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
            <span className="text-slate-500 block text-[10px]">เช็คชื่อมาเรียน</span>
            <span className="text-base font-black text-emerald-700">+15 EXP</span>
          </div>
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
            <span className="text-slate-500 block text-[10px]">เช็คชื่อมาสาย</span>
            <span className="text-base font-black text-amber-700">+5 EXP</span>
          </div>
          <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
            <span className="text-slate-500 block text-[10px]">ส่งการบ้านตรงเวลา</span>
            <span className="text-base font-black text-blue-700">+50 EXP</span>
          </div>
          <div className="p-3 bg-purple-50 rounded-xl border border-purple-100">
            <span className="text-slate-500 block text-[10px]">คะแนนสอบ/งานดีเด่น</span>
            <span className="text-base font-black text-purple-700">+20 EXP</span>
          </div>
        </div>

        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-[11px] text-slate-600 leading-relaxed">
          • ทุกๆ <strong>100 EXP</strong> ไข่มอนสเตอร์จะเติบโตเต็มที่และกะเทาะเปลือก (Hatch)<br />
          • ทุกๆ <strong>50 EXP</strong> ระดับเลเวล (Level) ของนักเรียนจะเพิ่มขึ้น 1 เลเวล<br />
          • ระบบ Gacha มีอัตราการสุ่มตามประเภทไข่: Common (65%), Rare (25%), Epic (8%), Legendary (2%)
        </div>
      </div>
    </div>
  );
}
