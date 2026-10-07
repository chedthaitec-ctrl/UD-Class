"use client";

import { useState, useEffect } from "react";

interface Monster {
  id: string;
  name: string;
  species: string;
  rarity: string;
  element: string;
  imageUrl: string;
  _count: {
    studentEggs: number;
  };
}

export default function MonstersCatalogPage() {
  const [monsters, setMonsters] = useState<Monster[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterRarity, setFilterRarity] = useState<string>("ALL");
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    species: "",
    rarity: "RARE",
    element: "FIRE",
    imageUrl: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchMonsters();
  }, []);

  const fetchMonsters = async () => {
    try {
      const res = await fetch("/api/gamification/monsters");
      const data = await res.json();
      if (data.success) {
        setMonsters(data.monsters);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMonster = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.species) return;

    setSaving(true);
    try {
      const res = await fetch("/api/gamification/monsters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        setShowAddModal(false);
        setFormData({
          name: "",
          species: "",
          rarity: "RARE",
          element: "FIRE",
          imageUrl: "",
        });
        fetchMonsters();
      }
    } catch (err: any) {
      alert("ข้อผิดพลาด: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const filtered = monsters.filter(
    (m) => filterRarity === "ALL" || m.rarity === filterRarity
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            สารานุกรมมอนสเตอร์ (Monster Bestiary & Gacha Dex)
          </h2>
          <p className="text-xs text-slate-500">
            คลังสายพันธุ์มอนสเตอร์ อัตราความหายาก และจำนวนผู้ครอบครอง
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition shadow-sm"
        >
          <span>➕</span>
          <span>เพิ่มสายพันธุ์มอนสเตอร์</span>
        </button>
      </div>

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
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filtered.map((m) => {
            const rarityStyle =
              m.rarity === "LEGENDARY"
                ? "bg-rose-50 text-rose-700 border-rose-300"
                : m.rarity === "EPIC"
                ? "bg-purple-50 text-purple-700 border-purple-300"
                : m.rarity === "RARE"
                ? "bg-blue-50 text-blue-700 border-blue-300"
                : "bg-slate-100 text-slate-700 border-slate-300";

            return (
              <div
                key={m.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition overflow-hidden flex flex-col justify-between"
              >
                <div className="p-4">
                  <div className="relative aspect-video rounded-xl overflow-hidden mb-3 bg-slate-100">
                    <img
                      src={m.imageUrl}
                      alt={m.name}
                      className="w-full h-full object-cover"
                    />
                    <span
                      className={`absolute top-2 right-2 px-2 py-0.5 rounded-md text-[10px] font-black uppercase border ${rarityStyle}`}
                    >
                      {m.rarity}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-base mb-0.5">
                    {m.name}
                  </h3>
                  <p className="text-xs text-slate-500 mb-2">
                    {m.species}
                  </p>

                  <div className="flex items-center gap-2 text-xs">
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold text-[10px]">
                      ธาตุ: {m.element}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      มีผู้ครอบครอง:{" "}
                      <strong className="text-emerald-600">{m._count?.studentEggs || 0}</strong> คน
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal เพิ่มมอนสเตอร์ */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">
                เพิ่มสายพันธุ์มอนสเตอร์ใหม่
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddMonster} className="space-y-4">
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  ชื่อมอนสเตอร์ *
                </label>
                <input
                  type="text"
                  required
                  placeholder="เช่น ไพโรเดรค (Pyrodrake)"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  เผ่าพันธุ์ / คำอธิบาย *
                </label>
                <input
                  type="text"
                  required
                  placeholder="เช่น มังกรเพลิงสุริยะ"
                  value={formData.species}
                  onChange={(e) => setFormData({ ...formData, species: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  >
                    <option value="COMMON">COMMON (ธรรมดา)</option>
                    <option value="RARE">RARE (หายาก)</option>
                    <option value="EPIC">EPIC (มหากาพย์)</option>
                    <option value="LEGENDARY">LEGENDARY (ในตำนาน)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    ธาตุประจำตัว (Element)
                  </label>
                  <select
                    value={formData.element}
                    onChange={(e) => setFormData({ ...formData, element: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  >
                    <option value="FIRE">ไฟ (FIRE)</option>
                    <option value="WATER">น้ำ (WATER)</option>
                    <option value="NATURE">พืช (NATURE)</option>
                    <option value="LIGHT">แสง (LIGHT)</option>
                    <option value="DARK">มืด (DARK)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  URL รูปภาพมอนสเตอร์
                </label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono text-xs"
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
                  {saving ? "กำลังบันทึก..." : "เพิ่มเข้าตู้กาชา"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
