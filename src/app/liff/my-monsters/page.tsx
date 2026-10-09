"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import confetti from "canvas-confetti";
import {
  Sparkles,
  Shield,
  Swords,
  Flame,
  Droplets,
  Leaf,
  Zap,
  Sun,
  Moon,
  Wind,
  Mountain,
  CheckCircle2,
  RefreshCw,
  Gift,
  Layers,
  Star,
  ChevronRight
} from "lucide-react";

interface Monster {
  id: string;
  name: string;
  species: string;
  rarity: string;
  element: string;
  imageUrl: string;
  attack: number;
  defense: number;
  description: string | null;
}

interface StudentMonster {
  id: string;
  monsterId: string;
  level: number;
  exp: number;
  isEquipped: boolean;
  obtainedAt: string;
  monster: Monster;
}

interface Student {
  id: string;
  seatNumber: number;
  name: string;
  exp: number;
  totalPoints: number;
  level: number;
}

function ElementBadge({ element }: { element: string }) {
  const el = element.toUpperCase();
  if (el === "FIRE") return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-rose-500/20 text-rose-300 border border-rose-500/30"><Flame className="w-3 h-3 text-rose-400" /> ไฟ</span>;
  if (el === "WATER") return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-sky-500/20 text-sky-300 border border-sky-500/30"><Droplets className="w-3 h-3 text-sky-400" /> น้ำ</span>;
  if (el === "NATURE") return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"><Leaf className="w-3 h-3 text-emerald-400" /> พืช</span>;
  if (el === "THUNDER") return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"><Zap className="w-3 h-3 text-cyan-400" /> สายฟ้า</span>;
  if (el === "WIND") return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30"><Wind className="w-3 h-3 text-amber-400" /> ลม</span>;
  if (el === "EARTH") return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-700/20 text-amber-400 border border-amber-700/30"><Mountain className="w-3 h-3 text-amber-500" /> ดิน</span>;
  if (el === "LIGHT") return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-yellow-500/20 text-yellow-300 border border-yellow-500/30"><Sun className="w-3 h-3 text-yellow-400" /> แสง</span>;
  if (el === "DARK") return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-purple-500/20 text-purple-300 border border-purple-500/30"><Moon className="w-3 h-3 text-purple-400" /> มืด</span>;
  return <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-slate-700 text-slate-300">{element}</span>;
}

function RarityBadge({ rarity }: { rarity: string }) {
  const r = rarity.toUpperCase();
  if (r === "LEGENDARY") return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-slate-950 shadow-sm border border-amber-300 animate-pulse">LEGENDARY 👑</span>;
  if (r === "EPIC") return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-purple-500 text-white shadow-sm border border-purple-400">EPIC 💜</span>;
  if (r === "RARE") return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-500 text-white shadow-sm border border-blue-400">RARE 💙</span>;
  return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-700 text-slate-300">COMMON</span>;
}

function MyMonstersContent() {
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [myMonsters, setMyMonsters] = useState<StudentMonster[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"BAG" | "GACHA" | "FUSION">("BAG");

  // Gacha State
  const [gachaRolling, setGachaRolling] = useState(false);
  const [gachaResults, setGachaResults] = useState<StudentMonster[] | null>(null);

  // Fusion / Upgrade State
  const [targetMonsterId, setTargetMonsterId] = useState<string>("");
  const [selectedFodderIds, setSelectedFodderIds] = useState<string[]>([]);
  const [upgrading, setUpgrading] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    if (selectedStudentId) {
      fetchMyMonsters(selectedStudentId);
    }
  }, [selectedStudentId]);

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

  const fetchMyMonsters = async (studentId: string) => {
    try {
      const res = await fetch(`/api/students/${studentId}/monsters`);
      const data = await res.json();
      if (data.success) {
        setMyMonsters(data.monsters || []);
        if (data.student) {
          // Update student in state with latest EXP
          setStudents((prev) =>
            prev.map((s) => (s.id === studentId ? { ...s, exp: data.student.exp } : s))
          );
        }
        // Set default target monster for fusion if not selected
        const equipped = data.monsters.find((m: StudentMonster) => m.isEquipped);
        if (equipped && !targetMonsterId) {
          setTargetMonsterId(equipped.id);
        } else if (data.monsters.length > 0 && !targetMonsterId) {
          setTargetMonsterId(data.monsters[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEquip = async (studentMonsterId: string) => {
    try {
      const res = await fetch(`/api/students/${selectedStudentId}/monsters`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentMonsterId }),
      });
      const data = await res.json();
      if (data.success) {
        setMyMonsters((prev) =>
          prev.map((m) => ({
            ...m,
            isEquipped: m.id === studentMonsterId,
          }))
        );
        alert("✨ ตั้งเป็นมอนสเตอร์คู่หูหลักเรียบร้อยแล้ว!");
      }
    } catch (err: any) {
      alert("ข้อผิดพลาด: " + err.message);
    }
  };

  const handleRollGacha = async (count: 1 | 11) => {
    const cost = count === 11 ? 50 : 5;
    const currentStudent = students.find((s) => s.id === selectedStudentId);

    if (!currentStudent || currentStudent.exp < cost) {
      alert(`EXP ไม่เพียงพอ! คุณมี ${currentStudent?.exp || 0} EXP (ต้องการ ${cost} EXP)`);
      return;
    }

    setGachaRolling(true);
    setGachaResults(null);

    try {
      const res = await fetch("/api/gamification/gacha", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: selectedStudentId, count }),
      });

      const data = await res.json();
      if (data.success) {
        setTimeout(() => {
          setGachaRolling(false);
          setGachaResults(data.pulledMonsters);
          confetti({
            particleCount: count === 11 ? 250 : 120,
            spread: 90,
            origin: { y: 0.6 },
          });
          fetchMyMonsters(selectedStudentId);
        }, 1200);
      } else {
        setGachaRolling(false);
        alert("ข้อผิดพลาด: " + data.error);
      }
    } catch (err: any) {
      setGachaRolling(false);
      alert("เกิดข้อผิดพลาด: " + err.message);
    }
  };

  const handleUpgradeMonster = async () => {
    if (!targetMonsterId || selectedFodderIds.length === 0) {
      alert("กรุณาเลือกมอนสเตอร์เป้าหมายและวัตถุดิบที่ต้องการใช้");
      return;
    }

    setUpgrading(true);
    try {
      const res = await fetch("/api/gamification/monsters/upgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: selectedStudentId,
          targetStudentMonsterId: targetMonsterId,
          fodderStudentMonsterIds: selectedFodderIds,
        }),
      });

      const data = await res.json();
      if (data.success) {
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 },
        });

        alert(
          `⚡ อัพเลเวลสำเร็จ! ได้รับ +${data.expGained} EXP${
            data.leveledUp ? `\n🎉 มอนสเตอร์เลเวลอัพเป็น Lv.${data.newLevel}!` : ""
          }`
        );
        setSelectedFodderIds([]);
        fetchMyMonsters(selectedStudentId);
      } else {
        alert("ข้อผิดพลาด: " + data.error);
      }
    } catch (err: any) {
      alert("เกิดข้อผิดพลาด: " + err.message);
    } finally {
      setUpgrading(false);
    }
  };

  const currentStudent = students.find((s) => s.id === selectedStudentId);
  const equippedMonster = myMonsters.find((m) => m.isEquipped) || (myMonsters.length > 0 ? myMonsters[0] : null);

  // Calculate duplicate counts for bag view
  const duplicateMap: Record<string, number> = {};
  myMonsters.forEach((m) => {
    duplicateMap[m.monsterId] = (duplicateMap[m.monsterId] || 0) + 1;
  });

  const targetMonsterObj = myMonsters.find((m) => m.id === targetMonsterId);

  return (
    <div className="max-w-xl mx-auto py-5 px-3 space-y-6 font-prompt">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-3xl">🎒</span>
            <div>
              <h2 className="text-lg font-black tracking-tight">คลังมอนสเตอร์ & กาชา 2D Pixel</h2>
              <p className="text-[11px] text-slate-400">สะสม อัพเลเวล และหมุนกาชาด้วย EXP</p>
            </div>
          </div>

          <div className="text-right bg-amber-500/20 px-3 py-1.5 rounded-2xl border border-amber-500/30">
            <span className="text-[10px] text-amber-300 font-bold block">EXP สะสม</span>
            <span className="text-base font-black text-amber-400">{currentStudent?.exp || 0} ⭐</span>
          </div>
        </div>

        {/* Student Selector */}
        <div className="pt-2">
          <select
            value={selectedStudentId}
            onChange={(e) => {
              setSelectedStudentId(e.target.value);
              setSelectedFodderIds([]);
            }}
            className="w-full px-3.5 py-2.5 bg-slate-900/90 text-white border border-slate-700 rounded-xl text-xs font-bold outline-none cursor-pointer"
          >
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                เลขที่ {s.seatNumber}: {s.name} (มี {s.exp} EXP)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ACTIVE PARTNER MONSTER CARD */}
      {equippedMonster && (
        <div className="bg-gradient-to-b from-slate-900 to-slate-950 rounded-3xl p-5 border-2 border-indigo-500/40 shadow-2xl text-white space-y-4 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs">
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30 flex items-center gap-1 text-[11px]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>คู่หูประจำตัว (Active Partner)</span>
            </span>

            <RarityBadge rarity={equippedMonster.monster.rarity} />
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-5 pt-1">
            {/* Pixel Sprite with Glow */}
            <div className="relative shrink-0">
              <div className="w-28 h-28 rounded-2xl bg-slate-900 p-2 border-2 border-slate-700/80 shadow-inner flex items-center justify-center">
                <img
                  src={equippedMonster.monster.imageUrl}
                  alt={equippedMonster.monster.name}
                  className="w-24 h-24 object-contain filter drop-shadow-[0_4px_12px_rgba(255,255,255,0.15)]"
                  style={{ imageRendering: "pixelated" }}
                />
              </div>
              <span className="absolute -bottom-2 -right-2 px-2.5 py-0.5 rounded-lg bg-indigo-600 text-white font-black text-xs shadow-md border border-indigo-400">
                Lv.{equippedMonster.level}
              </span>
            </div>

            {/* Info and Stats */}
            <div className="space-y-2 flex-1 text-center sm:text-left">
              <div>
                <h3 className="text-xl font-black tracking-tight text-white">
                  {equippedMonster.monster.name}
                </h3>
                <div className="flex items-center justify-center sm:justify-start gap-2 text-xs mt-1">
                  <ElementBadge element={equippedMonster.monster.element} />
                  <span className="text-[11px] text-slate-400">{equippedMonster.monster.species}</span>
                </div>
              </div>

              {/* Stat ATK / DEF */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="bg-slate-800/80 p-2 rounded-xl border border-slate-700/60 flex items-center gap-2">
                  <Swords className="w-4 h-4 text-rose-400" />
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold">พลังโจมตี</span>
                    <span className="text-xs font-black text-rose-300">
                      {equippedMonster.monster.attack + (equippedMonster.level - 1) * 15}
                    </span>
                  </div>
                </div>

                <div className="bg-slate-800/80 p-2 rounded-xl border border-slate-700/60 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-blue-400" />
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold">พลังป้องกัน</span>
                    <span className="text-xs font-black text-blue-300">
                      {equippedMonster.monster.defense + (equippedMonster.level - 1) * 12}
                    </span>
                  </div>
                </div>
              </div>

              {/* EXP Progress bar to next level */}
              <div className="space-y-1 pt-1">
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span>EXP สู่เลเวลถัดไป:</span>
                  <span className="font-bold text-slate-200">{equippedMonster.exp} / 100 ({equippedMonster.exp}%)</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-indigo-500 h-full rounded-full transition-all"
                    style={{ width: `${equippedMonster.exp}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB NAVIGATION: กระเป๋า / ตู้กาชา / ฟิวชั่นอัพเลเวล */}
      <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-2xl text-xs font-bold">
        <button
          type="button"
          onClick={() => setActiveTab("BAG")}
          className={`py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 ${
            activeTab === "BAG"
              ? "bg-white text-slate-950 shadow-sm"
              : "text-slate-500 hover:text-slate-900"
          }`}
        >
          <span>🎒</span>
          <span>กระเป๋า ({myMonsters.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("GACHA")}
          className={`py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 ${
            activeTab === "GACHA"
              ? "bg-white text-slate-950 shadow-sm"
              : "text-slate-500 hover:text-slate-900"
          }`}
        >
          <span>🎰</span>
          <span>ตู้แลกกาชา</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("FUSION")}
          className={`py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 ${
            activeTab === "FUSION"
              ? "bg-white text-slate-950 shadow-sm"
              : "text-slate-500 hover:text-slate-900"
          }`}
        >
          <span>⚡</span>
          <span>อัพเลเวลตัวซ้ำ</span>
        </button>
      </div>

      {/* TAB CONTENT 1: MONSTER BAG */}
      {activeTab === "BAG" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs px-1">
            <span className="font-bold text-slate-700">มอนสเตอร์ที่ครอบครองทั้งหมด ({myMonsters.length} ตัว)</span>
            <button
              onClick={() => setActiveTab("GACHA")}
              className="text-indigo-600 hover:text-indigo-700 font-bold flex items-center gap-1"
            >
              <span>🎰 หมุนกาชาเพิ่ม</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {myMonsters.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 text-center border border-slate-200 space-y-3">
              <div className="text-4xl animate-bounce">🥚</div>
              <h4 className="font-bold text-slate-800 text-sm">ยังไม่มีมอนสเตอร์ในกระเป๋า</h4>
              <p className="text-xs text-slate-500">
                คุณสามารถใช้ EXP ที่ได้จากการส่งงาน มาแลกหมุนตู้กาชาได้ทันที!
              </p>
              <button
                onClick={() => setActiveTab("GACHA")}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition shadow-sm"
              >
                ไปที่ตู้หมุนกาชา (5 EXP)
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {myMonsters.map((m) => {
                const count = duplicateMap[m.monsterId] || 1;

                return (
                  <div
                    key={m.id}
                    className={`bg-white rounded-2xl p-3.5 border transition hover:shadow-md flex flex-col justify-between space-y-2.5 ${
                      m.isEquipped ? "border-indigo-500 ring-2 ring-indigo-500/20" : "border-slate-200"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between text-[10px] mb-1">
                        <ElementBadge element={m.monster.element} />
                        <span className="font-black text-indigo-600">Lv.{m.level}</span>
                      </div>

                      <div className="w-full aspect-square rounded-xl bg-slate-900 flex items-center justify-center p-2 mb-2 relative overflow-hidden">
                        <img
                          src={m.monster.imageUrl}
                          alt={m.monster.name}
                          className="w-20 h-20 object-contain"
                          style={{ imageRendering: "pixelated" }}
                        />
                        {count > 1 && (
                          <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-amber-400 text-slate-950 font-black text-[9px] shadow">
                            มี {count} ตัว
                          </span>
                        )}
                        {m.isEquipped && (
                          <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-emerald-500 text-white font-bold text-[9px]">
                            คู่หู
                          </span>
                        )}
                      </div>

                      <h4 className="font-bold text-slate-900 text-xs truncate">
                        {m.monster.name}
                      </h4>
                      <div className="flex items-center justify-between text-[10px] text-slate-500 mt-0.5">
                        <RarityBadge rarity={m.monster.rarity} />
                        <span>ATK {m.monster.attack + (m.level - 1) * 15}</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5">
                      {!m.isEquipped ? (
                        <button
                          type="button"
                          onClick={() => handleEquip(m.id)}
                          className="flex-1 py-1.5 rounded-lg text-[10px] font-bold bg-slate-900 hover:bg-slate-800 text-white transition"
                        >
                          ตั้งเป็นคู่หู
                        </button>
                      ) : (
                        <span className="flex-1 text-center py-1.5 text-[10px] font-bold text-emerald-600">
                          ✓ กำลังใช้งาน
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setTargetMonsterId(m.id);
                          setActiveTab("FUSION");
                        }}
                        className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 text-[10px] font-bold border border-amber-200 transition"
                        title="อัพเลเวลมอนสเตอร์ตัวนี้"
                      >
                        ⚡ อัพเวล
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT 2: GACHA MACHINE */}
      {activeTab === "GACHA" && (
        <div className="space-y-5">
          {/* Gacha Cabinet Banner */}
          <div className="bg-gradient-to-tr from-purple-900 via-indigo-900 to-slate-950 rounded-3xl p-6 text-white text-center shadow-xl space-y-4 border-2 border-purple-500/30 relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-purple-500/20 rounded-full blur-2xl pointer-events-none" />

            <div className="text-5xl animate-bounce">🎰</div>
            <div>
              <h3 className="text-xl font-black tracking-tight">ตู้กาชาแลกมอนสเตอร์อัศจรรย์</h3>
              <p className="text-xs text-purple-200 mt-1 max-w-sm mx-auto">
                ใช้แต้ม EXP ที่ได้จากการส่งงานและการบ้าน มาสุ่มมอนสเตอร์ Pixel 2D ระดับตำนาน!
              </p>
            </div>

            {/* Rates breakdown badge */}
            <div className="flex flex-wrap items-center justify-center gap-2 text-[10px] pt-1">
              <span className="px-2 py-0.5 rounded-md bg-amber-400 text-slate-950 font-black">LEGENDARY 4%</span>
              <span className="px-2 py-0.5 rounded-md bg-purple-500 text-white font-bold">EPIC 14%</span>
              <span className="px-2 py-0.5 rounded-md bg-blue-500 text-white font-bold">RARE 30%</span>
              <span className="px-2 py-0.5 rounded-md bg-slate-700 text-slate-300 font-bold">COMMON 52%</span>
            </div>

            {/* Gacha Roll Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-3">
              {/* 1 Pull */}
              <button
                type="button"
                onClick={() => handleRollGacha(1)}
                disabled={gachaRolling || (currentStudent?.exp || 0) < 5}
                className="py-3.5 px-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs shadow-lg transition active:scale-95 disabled:opacity-40 flex flex-col items-center gap-0.5"
              >
                <span>🎲 สุ่ม 1 ครั้ง</span>
                <span className="text-[11px] text-amber-300 font-bold">ใช้ 5 EXP ⭐</span>
              </button>

              {/* 11 Pulls (Discount) */}
              <button
                type="button"
                onClick={() => handleRollGacha(11)}
                disabled={gachaRolling || (currentStudent?.exp || 0) < 50}
                className="py-3.5 px-3 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs shadow-lg transition active:scale-95 disabled:opacity-40 flex flex-col items-center gap-0.5"
              >
                <span>🔥 สุ่ม 11 ครั้ง (แถมฟรี 1)</span>
                <span className="text-[11px] font-black text-slate-900">ใช้ 50 EXP ⭐ (การันตี R+)</span>
              </button>
            </div>
          </div>

          {/* Gacha Pulling Animation / Results */}
          {gachaRolling ? (
            <div className="bg-white rounded-3xl p-10 text-center border border-slate-200 shadow-md space-y-3 animate-fade-in">
              <div className="text-6xl animate-spin">🌀</div>
              <h4 className="font-black text-slate-900 text-sm animate-pulse">
                วงล้อเวทมนตร์กำลังหมุนสุ่มมอนสเตอร์...
              </h4>
              <p className="text-xs text-slate-500">กรุณารอสักครู่ กำลังอัญเชิญมอนสเตอร์ Pixel 2D</p>
            </div>
          ) : gachaResults ? (
            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xl space-y-4 animate-fade-in">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🎉</span>
                  <h4 className="font-black text-slate-900 text-sm">
                    ผลการอัญเชิญมอนสเตอร์ ({gachaResults.length} ตัว)
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => setGachaResults(null)}
                  className="text-xs text-slate-400 hover:text-slate-600 font-bold"
                >
                  ปิด
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-80 overflow-y-auto pr-1">
                {gachaResults.map((m, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-1.5"
                  >
                    <div className="w-16 h-16 mx-auto rounded-lg bg-slate-900 flex items-center justify-center p-1">
                      <img
                        src={m.monster.imageUrl}
                        alt={m.monster.name}
                        className="w-14 h-14 object-contain"
                        style={{ imageRendering: "pixelated" }}
                      />
                    </div>
                    <RarityBadge rarity={m.monster.rarity} />
                    <h5 className="font-bold text-slate-900 text-[11px] truncate">{m.monster.name}</h5>
                    <ElementBadge element={m.monster.element} />
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setActiveTab("BAG")}
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition"
              >
                ดูมอนสเตอร์ทั้งหมดในกระเป๋า
              </button>
            </div>
          ) : null}
        </div>
      )}

      {/* TAB CONTENT 3: FUSION / UPGRADE WITH DUPLICATES */}
      {activeTab === "FUSION" && (
        <div className="space-y-4">
          <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-900 space-y-1">
            <span className="font-black flex items-center gap-1.5 text-amber-950">
              <Zap className="w-4 h-4 text-amber-600" />
              <span>ระบบอัพเลเวลมอนสเตอร์ด้วยตัวซ้ำ (Duplicate Fusion)</span>
            </span>
            <p className="text-[11px] leading-relaxed text-amber-800">
              เลือกมอนสเตอร์เป้าหมายที่ต้องการเพิ่มเลเวล แล้วเลือกมอนสเตอร์ตัวซ้ำหรือตัวอื่นเพื่อใช้เป็นวัตถุดิบ (มอนสเตอร์ตัวซ้ำสายพันธุ์เดียวกันจะมอบโบนัส <strong>+150 EXP x3 เท่า!</strong>)
            </p>
          </div>

          {/* STEP 1: SELECT TARGET */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3">
            <label className="block text-slate-800 font-bold text-xs">
              1. เลือกมอนสเตอร์เป้าหมายที่จะอัพเลเวล:
            </label>
            <select
              value={targetMonsterId}
              onChange={(e) => {
                setTargetMonsterId(e.target.value);
                setSelectedFodderIds([]);
              }}
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-bold outline-none"
            >
              {myMonsters.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.monster.name} (Lv.{m.level} - EXP {m.exp}/100) {m.isEquipped ? "[คู่หู]" : ""}
                </option>
              ))}
            </select>

            {targetMonsterObj && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3">
                <div className="w-14 h-14 rounded-lg bg-slate-900 flex items-center justify-center p-1 shrink-0">
                  <img
                    src={targetMonsterObj.monster.imageUrl}
                    alt={targetMonsterObj.monster.name}
                    className="w-12 h-12 object-contain"
                    style={{ imageRendering: "pixelated" }}
                  />
                </div>
                <div className="space-y-0.5">
                  <span className="font-black text-slate-900 text-xs">{targetMonsterObj.monster.name}</span>
                  <div className="text-[10px] text-slate-500 flex items-center gap-2">
                    <span className="font-bold text-indigo-600">Lv.{targetMonsterObj.level}</span>
                    <ElementBadge element={targetMonsterObj.monster.element} />
                    <span>ATK {targetMonsterObj.monster.attack + (targetMonsterObj.level - 1) * 15}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* STEP 2: SELECT FODDER MONSTERS */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-slate-800 font-bold text-xs">
                2. เลือกมอนสเตอร์วัตถุดิบที่จะนำมาสังเวย ({selectedFodderIds.length} ตัวที่เลือก):
              </label>
              {selectedFodderIds.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedFodderIds([])}
                  className="text-[11px] text-rose-600 font-bold hover:underline"
                >
                  ล้างที่เลือก
                </button>
              )}
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {myMonsters
                .filter((m) => m.id !== targetMonsterId)
                .map((m) => {
                  const isSelected = selectedFodderIds.includes(m.id);
                  const isDuplicate = targetMonsterObj?.monsterId === m.monsterId;

                  return (
                    <label
                      key={m.id}
                      className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition text-xs ${
                        isSelected
                          ? "bg-amber-100 border-amber-400 font-bold text-amber-950"
                          : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedFodderIds([...selectedFodderIds, m.id]);
                            } else {
                              setSelectedFodderIds(selectedFodderIds.filter((id) => id !== m.id));
                            }
                          }}
                          className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
                        />
                        <div className="w-9 h-9 rounded-lg bg-slate-900 flex items-center justify-center p-0.5 shrink-0">
                          <img
                            src={m.monster.imageUrl}
                            alt={m.monster.name}
                            className="w-8 h-8 object-contain"
                            style={{ imageRendering: "pixelated" }}
                          />
                        </div>
                        <div>
                          <span className="font-bold">{m.monster.name}</span>
                          <span className="text-[10px] text-slate-400 block">Lv.{m.level}</span>
                        </div>
                      </div>

                      {isDuplicate && (
                        <span className="px-2 py-0.5 rounded text-[9px] font-black bg-amber-400 text-slate-950 shadow-sm animate-pulse">
                          ✨ ตัวซ้ำ +150 EXP!
                        </span>
                      )}
                    </label>
                  );
                })}

              {myMonsters.filter((m) => m.id !== targetMonsterId).length === 0 && (
                <div className="p-4 text-center text-xs text-slate-400">
                  ไม่มีมอนสเตอร์ตัวอื่นในกระเป๋า (หมุนตู้กาชาเพิ่มเพื่อรับตัวซ้ำ)
                </div>
              )}
            </div>

            {/* Upgrade Button */}
            <button
              type="button"
              onClick={handleUpgradeMonster}
              disabled={upgrading || selectedFodderIds.length === 0}
              className="w-full py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md transition disabled:opacity-40 flex items-center justify-center gap-2"
            >
              <span>⚡</span>
              <span>{upgrading ? "กำลังฟิวชั่น..." : `ยืนยันฟิวชั่นอัพเลเวล (ใช้วัตถุดิบ ${selectedFodderIds.length} ตัว)`}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MyMonstersPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-xs text-slate-400">กำลังโหลดกระเป๋ามอนสเตอร์...</div>}>
      <MyMonstersContent />
    </Suspense>
  );
}
