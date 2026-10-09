"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import confetti from "canvas-confetti";

interface Student {
  id: string;
  seatNumber: number;
  name: string;
  level: number;
  totalPoints: number;
  egg: {
    id: string;
    eggName: string;
    eggType: string;
    currentExp: number;
    targetExp: number;
    isHatched: boolean;
    hatchedMonster: {
      name: string;
      species: string;
      rarity: string;
      element: string;
      imageUrl: string;
    } | null;
  } | null;
}

export default function LiffMonsterPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [loading, setLoading] = useState(true);
  const [isHatching, setIsHatching] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const res = await fetch("/api/students");
      const data = await res.json();
      if (data.success && data.students.length > 0) {
        setStudents(data.students);
        setSelectedStudentId(data.students[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleHatch = async () => {
    if (!selectedStudentId) return;
    setIsHatching(true);

    try {
      const res = await fetch("/api/gamification/hatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: selectedStudentId }),
      });
      const data = await res.json();

      setTimeout(() => {
        setIsHatching(false);
        if (data.success) {
          confetti({
            particleCount: 150,
            spread: 90,
            origin: { y: 0.6 },
          });
          fetchStudents();
        } else {
          alert("ไข่ยังไม่พร้อมฟัก");
        }
      }, 1200);
    } catch (err: any) {
      setIsHatching(false);
      alert("ข้อผิดพลาด: " + err.message);
    }
  };

  const currentStudent = students.find((s) => s.id === selectedStudentId);
  const egg = currentStudent?.egg;
  const currentExp = egg?.currentExp || 0;
  const targetExp = egg?.targetExp || 100;
  const percent = Math.min(100, Math.round((currentExp / targetExp) * 100));
  const isReady = currentExp >= targetExp && !egg?.isHatched;

  return (
    <div className="max-w-lg mx-auto py-4 px-2 space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-tr from-amber-500 via-orange-500 to-amber-600 rounded-3xl p-6 text-white text-center shadow-xl space-y-3">
        <div className="text-4xl animate-bounce">🥚</div>
        <h2 className="text-xl font-black">ห้องฟักไข่มอนสเตอร์ (Incubator)</h2>
        <p className="text-xs text-amber-100">
          สะสม EXP จากการส่งการบ้านและทำแบบทดสอบ เพื่อสุ่มฟักมอนสเตอร์คู่หู!
        </p>
        <div className="pt-1">
          <Link
            href="/liff/my-monsters"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-950/80 hover:bg-slate-950 text-amber-300 font-bold text-xs transition border border-amber-300/30 shadow-md"
          >
            <span>🎒</span>
            <span>ดูกระเป๋ามอนสเตอร์ & ตู้กาชา (5 / 50 EXP) →</span>
          </Link>
        </div>
      </div>

      {/* Student Selector */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm text-xs">
        <label className="block text-slate-700 font-bold mb-1">
          เลือกโปรไฟล์นักเรียน:
        </label>
        <select
          value={selectedStudentId}
          onChange={(e) => setSelectedStudentId(e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold"
        >
          {students.map((s) => (
            <option key={s.id} value={s.id}>
              เลขที่ {s.seatNumber}: {s.name} (Lv.{s.level})
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="p-8 text-center text-slate-400 text-xs">กำลังโหลดข้อมูล...</div>
      ) : currentStudent && egg ? (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xl space-y-6 text-center">
          {/* Hatched or Unhatched View */}
          {egg.isHatched && egg.hatchedMonster ? (
            <div className="space-y-4 animate-fade-in">
              <span className="px-3 py-1 rounded-full text-xs font-black uppercase bg-purple-100 text-purple-700 border border-purple-200">
                {egg.hatchedMonster.rarity} ⭐
              </span>

              <img
                src={egg.hatchedMonster.imageUrl}
                alt={egg.hatchedMonster.name}
                className="w-48 h-48 mx-auto rounded-3xl object-cover shadow-2xl border-4 border-amber-300"
              />

              <div className="space-y-1">
                <h3 className="text-2xl font-black text-slate-900">
                  {egg.hatchedMonster.name}
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  {egg.hatchedMonster.species} • ธาตุ {egg.hatchedMonster.element}
                </p>
              </div>

              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-800 font-bold">
                🎉 มอนสเตอร์ตัวนี้พร้อมเป็นคู่หูประจำตัวของคุณแล้ว!
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div
                className={`text-8xl select-none inline-block my-2 ${
                  isReady
                    ? "animate-egg-pulse"
                    : percent >= 70
                    ? "animate-egg-wobble"
                    : ""
                }`}
              >
                {isReady ? "💥" : percent >= 70 ? "🐣" : "🥚"}
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800">
                  {egg.eggType}
                </span>
                <h3 className="text-lg font-bold text-slate-900">
                  {egg.eggName}
                </h3>
              </div>

              {/* EXP Progress */}
              <div className="space-y-2 p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs">
                <div className="flex items-center justify-between font-bold text-slate-700">
                  <span>พลังงาน EXP สะสม:</span>
                  <span className="text-emerald-600">
                    {currentExp} / {targetExp} EXP ({percent}%)
                  </span>
                </div>

                <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      isReady ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
                    }`}
                    style={{ width: `${percent}%` }}
                  />
                </div>

                <p className="text-[11px] text-slate-400 text-left pt-1">
                  💡 ส่งการบ้านตรงเวลาและทำควิซเพื่อรับ EXP มาฟักไข่และแลกตู้กาชา!
                </p>
              </div>

              {/* Hatch Button */}
              {isReady && (
                <button
                  onClick={handleHatch}
                  disabled={isHatching}
                  className="w-full py-4 rounded-2xl text-xs font-black bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 text-white shadow-xl shadow-emerald-500/30 transition animate-bounce"
                >
                  {isHatching ? "กำลังกะเทาะเปลือกไข่..." : "🎉 กดสุ่มฟักมอนสเตอร์ (Gacha) ทันที!"}
                </button>
              )}
            </div>
          )}

          {/* Quick Stats Summary */}
          <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-slate-400 block text-[10px]">เลเวลปัจจุบัน</span>
              <span className="text-base font-black text-indigo-600">
                Lv.{currentStudent.level}
              </span>
            </div>
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-slate-400 block text-[10px]">แต้มสะสมรวม</span>
              <span className="text-base font-black text-amber-600">
                {currentStudent.totalPoints} แต้ม 🏆
              </span>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
