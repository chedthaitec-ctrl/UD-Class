"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Lock,
  Plus,
  Pencil,
  Trash2,
  Swords,
  Shield,
  Sparkles,
  Flame,
  Droplets,
  Leaf,
  Zap,
  Sun,
  Moon,
  Wind,
  Mountain
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
  _count: {
    studentEggs: number;
    studentMonsters: number;
  };
}

function ElementBadge({ element }: { element: string }) {
  const el = element?.toUpperCase() || "FIRE";
  if (el === "FIRE") return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-rose-500/10 text-rose-700 border border-rose-200"><Flame className="w-3 h-3 text-rose-500" /> ไฟ (FIRE)</span>;
  if (el === "WATER") return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-sky-500/10 text-sky-700 border border-sky-200"><Droplets className="w-3 h-3 text-sky-500" /> น้ำ (WATER)</span>;
  if (el === "NATURE") return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-emerald-500/10 text-emerald-700 border border-emerald-200"><Leaf className="w-3 h-3 text-emerald-500" /> พืช (NATURE)</span>;
  if (el === "THUNDER") return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-cyan-500/10 text-cyan-700 border border-cyan-200"><Zap className="w-3 h-3 text-cyan-500" /> สายฟ้า (THUNDER)</span>;
  if (el === "WIND") return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-500/10 text-amber-700 border border-amber-200"><Wind className="w-3 h-3 text-amber-500" /> ลม (WIND)</span>;
  if (el === "EARTH") return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-700/10 text-amber-800 border border-amber-300"><Mountain className="w-3 h-3 text-amber-700" /> ดิน (EARTH)</span>;
  if (el === "LIGHT") return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-yellow-500/10 text-yellow-800 border border-yellow-200"><Sun className="w-3 h-3 text-yellow-600" /> แสง (LIGHT)</span>;
  if (el === "DARK") return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-purple-500/10 text-purple-700 border border-purple-200"><Moon className="w-3 h-3 text-purple-500" /> มืด (DARK)</span>;
  return <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-slate-100 text-slate-700">{element}</span>;
}

export default function MonstersCatalogPage() {
  const [monsters, setMonsters] = useState<Monster[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filterRarity, setFilterRarity] = useState<string>("ALL");

  // Add / Edit Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMonster, setEditingMonster] = useState<Monster | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    species: "",
    rarity: "RARE",
    element: "FIRE",
    imageUrl: "",
    attack: "180",
    defense: "160",
    description: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [authRes, monstersRes] = await Promise.all([
        fetch("/api/auth/me"),
        fetch("/api/gamification/monsters"),
      ]);

      const authData = await authRes.json();
      if (authData.success) {
        setCurrentUser(authData.user);
      }

      const mData = await monstersRes.json();
      if (mData.success) {
        setMonsters(mData.monsters);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const isSuperAdmin = currentUser?.role === "ADMIN";

  const handleOpenAdd = () => {
    setEditingMonster(null);
    setFormData({
      name: "",
      species: "",
      rarity: "RARE",
      element: "FIRE",
      imageUrl: "",
      attack: "180",
      defense: "160",
      description: "",
    });
    setShowAddModal(true);
  };

  const handleOpenEdit = (m: Monster) => {
    setEditingMonster(m);
    setFormData({
      name: m.name,
      species: m.species,
      rarity: m.rarity,
      element: m.element,
      imageUrl: m.imageUrl,
      attack: (m.attack || 150).toString(),
      defense: (m.defense || 150).toString(),
      description: m.description || "",
    });
    setShowAddModal(true);
  };

  const handleSaveMonster = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSuperAdmin) {
      alert("เฉพาะ Super Admin เท่านั้นที่สามารถแก้ไขคลังมอนสเตอร์ได้");
      return;
    }
    if (!formData.name || !formData.species) return;

    setSaving(true);
    try {
      const url = editingMonster
        ? `/api/gamification/monsters/${editingMonster.id}`
        : "/api/gamification/monsters";
      const method = editingMonster ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        setShowAddModal(false);
        fetchInitialData();
        alert(editingMonster ? "แก้ไขมอนสเตอร์เรียบร้อยแล้ว!" : "เพิ่มมอนสเตอร์เข้าตู้กาชาเรียบร้อยแล้ว!");
      } else {
        alert("ข้อผิดพลาด: " + data.error);
      }
    } catch (err: any) {
      alert("ข้อผิดพลาด: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMonster = async (id: string, name: string) => {
    if (!isSuperAdmin) {
      alert("เฉพาะ Super Admin เท่านั้นที่สามารถลบมอนสเตอร์ได้");
      return;
    }
    if (!confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบมอนสเตอร์ "${name}" ออกจากคลัง?`)) return;

    try {
      const res = await fetch(`/api/gamification/monsters/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        fetchInitialData();
        alert("ลบมอนสเตอร์เรียบร้อยแล้ว");
      } else {
        alert("ข้อผิดพลาด: " + data.error);
      }
    } catch (err: any) {
      alert("ข้อผิดพลาด: " + err.message);
    }
  };

  const filtered = monsters.filter(
    (m) => filterRarity === "ALL" || m.rarity === filterRarity
  );

  return (
    <div className="space-y-6 font-prompt">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            สารานุกรมมอนสเตอร์ Pixel 2D (Monster Bestiary & Gacha Dex)
          </h2>
          <p className="text-xs text-slate-500">
            คลังสายพันธุ์มอนสเตอร์ 2D Pixel อัตราความหายาก สเตตัส และระบบตู้กาชา
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isSuperAdmin ? (
            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>เพิ่มสายพันธุ์มอนสเตอร์</span>
            </button>
          ) : (
            <div className="px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 text-xs font-semibold flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span>เฉพาะ Super Admin เท่านั้นที่แก้ไขได้</span>
            </div>
          )}
        </div>
      </div>

      {/* Role Notice Banner */}
      {isSuperAdmin ? (
        <div className="p-3.5 bg-indigo-50 border border-indigo-200 rounded-2xl flex items-center gap-2.5 text-xs text-indigo-900">
          <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0" />
          <span>
            คุณเข้าสู่ระบบในฐานะ <strong>Super Admin</strong> สามารถเพิ่ม ลบ และแก้ไขค่าพลัง/รูปภาพมอนสเตอร์ในตู้กาชาได้
          </span>
        </div>
      ) : (
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center gap-2.5 text-xs text-slate-600">
          <Lock className="w-4 h-4 text-slate-400 shrink-0" />
          <span>
            <strong>โหมดอ่านสารานุกรม:</strong> คลังมอนสเตอร์และระบบกาชานี้สงวนสิทธิ์ให้ Super Admin เท่านั้นในการแก้ไขข้อมูล
          </span>
        </div>
      )}

      {/* Rarity Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {["ALL", "LEGENDARY", "EPIC", "RARE", "COMMON"].map((r) => (
          <button
            key={r}
            onClick={() => setFilterRarity(r)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              filterRarity === r
                ? "bg-slate-900 text-white shadow-sm"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            {r === "ALL" ? "ทั้งหมด" : r}
          </button>
        ))}
      </div>

      {/* Monsters Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 text-xs">กำลังโหลดมอนสเตอร์...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {filtered.map((m) => {
            const rarityStyle =
              m.rarity === "LEGENDARY"
                ? "bg-amber-400 text-slate-950 border-amber-300 font-black animate-pulse"
                : m.rarity === "EPIC"
                ? "bg-purple-100 text-purple-700 border-purple-300 font-bold"
                : m.rarity === "RARE"
                ? "bg-blue-100 text-blue-700 border-blue-300 font-bold"
                : "bg-slate-100 text-slate-700 border-slate-300 font-semibold";

            return (
              <div
                key={m.id}
                className="bg-white rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-md transition overflow-hidden flex flex-col justify-between"
              >
                <div className="p-4 space-y-3">
                  {/* Pixel Art Stage */}
                  <div className="relative aspect-square rounded-2xl overflow-hidden bg-slate-950 flex items-center justify-center p-3 border border-slate-800">
                    <img
                      src={m.imageUrl}
                      alt={m.name}
                      className="w-28 h-28 object-contain filter drop-shadow-[0_4px_10px_rgba(255,255,255,0.12)]"
                      style={{ imageRendering: "pixelated" }}
                    />
                    <span
                      className={`absolute top-2.5 right-2.5 px-2.5 py-0.5 rounded-md text-[10px] uppercase border shadow-sm ${rarityStyle}`}
                    >
                      {m.rarity}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-black text-slate-900 text-base">
                      {m.name}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-1">
                      {m.species}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <ElementBadge element={m.element} />
                  </div>

                  {m.description && (
                    <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                      {m.description}
                    </p>
                  )}

                  {/* Stats ATK & DEF */}
                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
                    <div className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold">
                      <Swords className="w-3.5 h-3.5 text-rose-500" />
                      <span>ATK {m.attack || 150}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold">
                      <Shield className="w-3.5 h-3.5 text-blue-500" />
                      <span>DEF {m.defense || 150}</span>
                    </div>
                  </div>
                </div>

                {/* Footer Bar (Super Admin Controls) */}
                <div className="px-4 py-3 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">
                    มีผู้ครอบครอง: <strong className="text-slate-800 font-bold">{(m._count?.studentEggs || 0) + (m._count?.studentMonsters || 0)}</strong>
                  </span>

                  {isSuperAdmin && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(m)}
                        className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition"
                        title="แก้ไขมอนสเตอร์"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteMonster(m.id, m.name)}
                        className="p-1.5 rounded-lg bg-white border border-slate-200 text-rose-600 hover:bg-rose-50 transition"
                        title="ลบมอนสเตอร์"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL เพิ่ม / แก้ไขมอนสเตอร์ (Super Admin Only) */}
      {showAddModal && isSuperAdmin && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 text-xs max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">
                {editingMonster ? `แก้ไขมอนสเตอร์: ${editingMonster.name}` : "เพิ่มสายพันธุ์มอนสเตอร์ใหม่ (Pixel 2D)"}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveMonster} className="space-y-4">
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  ชื่อมอนสเตอร์ *
                </label>
                <input
                  type="text"
                  required
                  placeholder="เช่น กริฟฟิน (Griffin)"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  เผ่าพันธุ์ / ฉายา *
                </label>
                <input
                  type="text"
                  required
                  placeholder="เช่น อสูรปักษาสิงโตเวหา"
                  value={formData.species}
                  onChange={(e) => setFormData({ ...formData, species: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    ระดับความหายาก (Rarity)
                  </label>
                  <select
                    value={formData.rarity}
                    onChange={(e) => setFormData({ ...formData, rarity: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold"
                  >
                    <option value="COMMON">COMMON (ธรรมดา 52%)</option>
                    <option value="RARE">RARE (หายาก 30%)</option>
                    <option value="EPIC">EPIC (มหากาพย์ 14%)</option>
                    <option value="LEGENDARY">LEGENDARY (ในตำนาน 4%)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    ธาตุประจำตัว (Element)
                  </label>
                  <select
                    value={formData.element}
                    onChange={(e) => setFormData({ ...formData, element: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold"
                  >
                    <option value="FIRE">ไฟ (FIRE)</option>
                    <option value="WATER">น้ำ (WATER)</option>
                    <option value="NATURE">พืช (NATURE)</option>
                    <option value="THUNDER">สายฟ้า (THUNDER)</option>
                    <option value="WIND">ลม (WIND)</option>
                    <option value="EARTH">ดิน (EARTH)</option>
                    <option value="LIGHT">แสง (LIGHT)</option>
                    <option value="DARK">มืด (DARK)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    พลังโจมตี (ATK)
                  </label>
                  <input
                    type="number"
                    value={formData.attack}
                    onChange={(e) => setFormData({ ...formData, attack: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    พลังป้องกัน (DEF)
                  </label>
                  <input
                    type="number"
                    value={formData.defense}
                    onChange={(e) => setFormData({ ...formData, defense: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  คำอธิบายความเป็นมา / ตำนาน
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="เขียนอธิบายลักษณะหรือตำนานของมอนสเตอร์..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  URL ภาพ Pixel 2D (หากเว้นว่างไว้ ระบบจะสร้างภาพ Pixel 2D อัตโนมัติ)
                </label>
                <input
                  type="text"
                  placeholder="data:image/svg+xml;... หรือปล่อยว่างเพื่อใช้ Pixel Generator"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono text-[10px]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl font-bold bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50"
                >
                  {saving ? "กำลังบันทึก..." : editingMonster ? "บันทึกการแก้ไข" : "เพิ่มเข้าตู้กาชา"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
