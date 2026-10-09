"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import confetti from "canvas-confetti";

interface Monster {
  id: string;
  name: string;
  species: string;
  rarity: string;
  element: string;
  imageUrl: string;
}

interface StudentEgg {
  id: string;
  eggName: string;
  eggType: string;
  eggColor: string;
  currentExp: number;
  targetExp: number;
  isHatched: boolean;
  hatchedMonster: Monster | null;
}

interface Student {
  id: string;
  seatNumber: number;
  name: string;
  level: number;
  totalPoints: number;
  egg: StudentEgg | null;
}

export default function MonsterSanctuaryPage() {
  const params = useParams();
  const classroomId = params.id as string;

  const [classroom, setClassroom] = useState<any>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [hatchingStudent, setHatchingStudent] = useState<Student | null>(null);
  const [hatchedResult, setHatchedResult] = useState<Monster | null>(null);
  const [isHatchingAnim, setIsHatchingAnim] = useState(false);

  useEffect(() => {
    fetchSanctuaryData();
  }, [classroomId]);

  const fetchSanctuaryData = async () => {
    try {
      const res = await fetch(`/api/classrooms/${classroomId}`);
      const data = await res.json();
      if (data.success) {
        setClassroom(data.classroom);
        setStudents(data.classroom.students);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleClasswideExpBonus = async (amount: number) => {
    try {
      const res = await fetch("/api/gamification/add-exp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classroomId,
          amount,
          points: Math.floor(amount / 2),
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert(`🌟 แจก +${amount} EXP ให้กับนักเรียนทุกคนในห้องเรียบร้อย!`);
        fetchSanctuaryData();
      }
    } catch (err: any) {
      alert("ข้อผิดพลาด: " + err.message);
    }
  };

  const triggerHatch = async (student: Student) => {
    setHatchingStudent(student);
    setIsHatchingAnim(true);
    setHatchedResult(null);

    try {
      const res = await fetch("/api/gamification/hatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: student.id }),
      });
      const data = await res.json();

      setTimeout(() => {
        setIsHatchingAnim(false);
        if (data.success && data.monster) {
          setHatchedResult(data.monster);
          confetti({
            particleCount: 120,
            spread: 70,
            origin: { y: 0.6 },
          });
          fetchSanctuaryData();
        }
      }, 1500);
    } catch (err: any) {
      setIsHatchingAnim(false);
      alert("ข้อผิดพลาด: " + err.message);
    }
  };

  const hatchedCount = students.filter((s) => s.egg?.isHatched).length;

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
            <span className="text-slate-600 font-semibold">ห้องเพาะพันธุ์มอนสเตอร์</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            ห้องเพาะพันธุ์ไข่ & มอนสเตอร์ (Monster Sanctuary)
          </h2>
          <p className="text-xs text-slate-500">
            ดูสถานะรอยร้าวของไข่ การเจริญเติบโต และสุ่มฟักมอนสเตอร์ประจำตัวนักเรียน
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleClasswideExpBonus(20)}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition shadow-sm flex items-center gap-1.5"
          >
            <span>✨</span>
            <span>แจกโบนัส +20 EXP ทั้งห้อง</span>
          </button>
        </div>
      </div>

      {/* Progress & Milestone Overview */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            Gacha Gamification System
          </span>
          <h3 className="text-xl font-extrabold">
            มอนสเตอร์ฟักแล้ว {hatchedCount} / {students.length} ตัว
          </h3>
          <p className="text-xs text-slate-300 max-w-lg">
            เมื่อนักเรียนทำการบ้านหรือทำแบบทดสอบครบ 100 EXP ไข่จะพร้อมกะเทาะเปลือกและสุ่มสายพันธุ์มอนสเตอร์หายาก Common, Rare, Epic ไปจนถึง Legendary!
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/liff/my-monsters"
            className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition shadow-md"
          >
            🎒 ดูกระเป๋า & ตู้กาชา (LIFF)
          </Link>
          <Link
            href="/monsters"
            className="px-4 py-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white border border-white/20 transition"
          >
            📖 สารานุกรมมอนสเตอร์
          </Link>
        </div>
      </div>

      {/* Eggs & Monsters Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 text-xs">กำลังโหลดข้อมูลไข่...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {students.map((std) => {
            const egg = std.egg;
            if (!egg) return null;

            const currentExp = egg.currentExp;
            const targetExp = egg.targetExp || 100;
            const percent = Math.min(100, Math.round((currentExp / targetExp) * 100));
            const isReadyToHatch = currentExp >= targetExp && !egg.isHatched;

            return (
              <div
                key={std.id}
                className={`bg-white rounded-2xl border transition-all overflow-hidden flex flex-col justify-between ${
                  egg.isHatched
                    ? "border-purple-200 shadow-md hover:shadow-lg"
                    : isReadyToHatch
                    ? "border-emerald-400 shadow-lg shadow-emerald-500/10 ring-2 ring-emerald-400"
                    : "border-slate-200/80 shadow-sm hover:shadow-md"
                }`}
              >
                {/* Visual Header */}
                <div className="p-5 text-center relative overflow-hidden bg-slate-50/50">
                  <div className="flex items-center justify-between text-[11px] mb-3">
                    <span className="font-black text-slate-700">
                      เลขที่ {std.seatNumber}
                    </span>
                    <span className="font-extrabold text-indigo-600">
                      Lv.{std.level}
                    </span>
                  </div>

                  {/* Egg or Monster Visual */}
                  {egg.isHatched && egg.hatchedMonster ? (
                    <div className="py-2">
                      <div className="w-24 h-24 mx-auto rounded-2xl bg-slate-950 p-2 shadow-lg border-2 border-purple-300 flex items-center justify-center">
                        <img
                          src={egg.hatchedMonster.imageUrl}
                          alt={egg.hatchedMonster.name}
                          className="w-20 h-20 object-contain"
                          style={{ imageRendering: "pixelated" }}
                        />
                      </div>
                      <div className="mt-3">
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                          {egg.hatchedMonster.rarity}
                        </span>
                        <h4 className="font-bold text-slate-900 text-sm mt-1">
                          {egg.hatchedMonster.name}
                        </h4>
                        <p className="text-[10px] text-slate-500">
                          {egg.hatchedMonster.species} • ธาตุ {egg.hatchedMonster.element}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="py-2">
                      <div
                        className={`text-6xl mx-auto my-2 select-none inline-block ${
                          isReadyToHatch
                            ? "animate-egg-pulse"
                            : percent >= 70
                            ? "animate-egg-wobble"
                            : ""
                        }`}
                      >
                        {isReadyToHatch ? "💥" : percent >= 70 ? "🐣" : percent >= 30 ? "🥚" : "🥚"}
                      </div>
                      <div className="mt-2">
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                          {egg.eggType}
                        </span>
                        <h4 className="font-bold text-slate-900 text-xs mt-1">
                          {egg.eggName}
                        </h4>
                      </div>
                    </div>
                  )}
                </div>

                {/* Body Progress */}
                <div className="p-5 border-t border-slate-100 space-y-3 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-slate-500 font-medium">เจ้าของ:</span>
                      <strong className="text-slate-900">{std.name}</strong>
                    </div>

                    {!egg.isHatched && (
                      <div className="space-y-1 mt-2">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-slate-400">EXP สะสม:</span>
                          <span className="font-bold text-slate-800">
                            {currentExp} / {targetExp} ({percent}%)
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              isReadyToHatch
                                ? "bg-emerald-500 animate-pulse"
                                : percent >= 70
                                ? "bg-amber-500"
                                : "bg-blue-500"
                            }`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Button */}
                  <div className="pt-2">
                    {isReadyToHatch ? (
                      <button
                        onClick={() => triggerHatch(std)}
                        className="w-full py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600 shadow-md shadow-emerald-500/20 transition animate-bounce"
                      >
                        🎉 กดฟักไข่ทันที (Gacha)
                      </button>
                    ) : egg.isHatched ? (
                      <div className="text-center text-[11px] text-purple-600 font-bold py-1">
                        ✨ คู่หูมอนสเตอร์พร้อมลุย!
                      </div>
                    ) : (
                      <div className="text-center text-[10px] text-slate-400 py-1">
                        ต้องการอีก {targetExp - currentExp} EXP เพื่อฟัก
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Gacha Hatching Modal */}
      {hatchingStudent && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-8 shadow-2xl text-center space-y-6 animate-fade-in relative overflow-hidden">
            {isHatchingAnim ? (
              <div className="py-8 space-y-4">
                <div className="text-7xl animate-egg-wobble">🥚</div>
                <h3 className="text-lg font-black text-slate-900 animate-pulse">
                  เปลือกไข่กำลังกะเทาะออก...!
                </h3>
                <p className="text-xs text-slate-500">
                  ระบบ Gacha กำลังสุ่มสายพันธุ์มอนสเตอร์ให้ {hatchingStudent.name}
                </p>
              </div>
            ) : hatchedResult ? (
              <div className="space-y-4">
                <span className="px-3 py-1 rounded-full text-xs font-black uppercase bg-purple-100 text-purple-700 border border-purple-200">
                  {hatchedResult.rarity} ⭐
                </span>

                <img
                  src={hatchedResult.imageUrl}
                  alt={hatchedResult.name}
                  className="w-40 h-40 mx-auto rounded-3xl object-cover shadow-2xl border-4 border-amber-300"
                />

                <div className="space-y-1">
                  <h3 className="text-xl font-black text-slate-900">
                    {hatchedResult.name}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {hatchedResult.species} • ธาตุ {hatchedResult.element}
                  </p>
                </div>

                <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-800 font-bold">
                  🎉 ยินดีกับ {hatchingStudent.name} ได้รับแต้มพิเศษจากการฟักมอนสเตอร์!
                </div>

                <button
                  onClick={() => setHatchingStudent(null)}
                  className="w-full py-3 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition"
                >
                  ยอดเยี่ยมมาก ปิดหน้าต่าง
                </button>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
