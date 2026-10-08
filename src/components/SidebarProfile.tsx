"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface TeacherOption {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "TEACHER";
  department: string | null;
}

export default function SidebarProfile() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [teachers, setTeachers] = useState<TeacherOption[]>([]);
  const [showSwitchModal, setShowSwitchModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      if (data.success && data.user) {
        setCurrentUser(data.user);
        if (data.teachers) {
          setTeachers(data.teachers);
        }
      }
    } catch (err) {
      console.error("Failed to load user profile", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSwitch = async (teacherId: string) => {
    try {
      const res = await fetch("/api/auth/switch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teacherId }),
      });
      const data = await res.json();
      if (data.success) {
        setShowSwitchModal(false);
        setCurrentUser(data.user);
        window.location.reload();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch (err) {
      console.error(err);
    }
  };

  const isAdmin = currentUser?.role === "ADMIN";
  const isImpersonating = !!currentUser?.originalAdminId;

  return (
    <>
      <div className="p-3 border-t border-slate-800 bg-slate-950/70">
        {/* Banner เมื่อแอดมินกำลังสลับดูในมุมมองครู */}
        {isImpersonating && (
          <div className="mb-2 p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-300 flex items-center justify-between">
            <span className="truncate">👁️ ดูในมุมมองครู</span>
            <button
              onClick={() => handleSwitch(currentUser.originalAdminId)}
              className="text-[10px] font-bold bg-amber-500 text-slate-950 px-2 py-0.5 rounded hover:bg-amber-400 transition"
            >
              คืนสิทธิ์แอดมิน
            </button>
          </div>
        )}

        {/* Admin Navigation Banner (Visible when user is Admin) */}
        {isAdmin && !isImpersonating && (
          <Link
            href="/admin/teachers"
            className="mb-2.5 flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 border border-amber-500/30 transition group"
          >
            <div className="flex items-center gap-2">
              <span className="text-sm">🛡️</span>
              <span>ระบบจัดการครู (Admin)</span>
            </div>
            <span className="text-[10px] bg-amber-500 text-slate-950 px-1.5 py-0.5 rounded font-extrabold group-hover:scale-105 transition">
              แอดมิน
            </span>
          </Link>
        )}

        {/* Profile Card */}
        <div
          onClick={() => setShowSwitchModal(true)}
          className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-800/80 transition cursor-pointer group"
          title="คลิกเพื่อดูข้อมูลบัญชีผู้ใช้งาน"
        >
          <div className="flex items-center gap-3 overflow-hidden">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black shadow-inner flex-shrink-0 ${
                isAdmin
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                  : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
              }`}
            >
              {isAdmin ? "🛡️" : currentUser?.name?.charAt(0) || "ครู"}
            </div>
            <div className="overflow-hidden">
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-bold text-white truncate group-hover:text-emerald-400 transition">
                  {currentUser?.name || "เข้าสู่ระบบ"}
                </p>
              </div>
              <p className="text-[10px] text-slate-400 truncate">
                {isAdmin
                  ? "ผู้ดูแลระบบใหญ่ (Super Admin)"
                  : currentUser?.department || "กลุ่มสาระการเรียนรู้"}
              </p>
            </div>
          </div>

          <span className="text-slate-500 group-hover:text-slate-300 text-xs px-1">
            ⚙️
          </span>
        </div>
      </div>

      {/* Account Info & Switch Modal */}
      {showSwitchModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in text-slate-900">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-black text-slate-900 text-sm">
                  บัญชีผู้ใช้งานปัจจุบัน
                </h3>
                <p className="text-[11px] text-slate-400">
                  {isAdmin || isImpersonating
                    ? "จัดการสิทธิ์และสลับบัญชีผู้สอน"
                    : "ข้อมูลประจำตัวคุณครูผู้สอน"}
                </p>
              </div>
              <button
                onClick={() => setShowSwitchModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            {/* Current Active User Info */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block mb-0.5">
                    ชื่อ-นามสกุล:
                  </span>
                  <span className="font-black text-slate-900 text-sm block">
                    {currentUser?.name}
                  </span>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                    isAdmin
                      ? "bg-amber-100 text-amber-800"
                      : "bg-blue-100 text-blue-800"
                  }`}
                >
                  {isAdmin ? "🛡️ Super Admin" : "👨‍🏫 คุณครูผู้สอน"}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/60 text-[11px]">
                <div>
                  <span className="text-slate-400 block text-[10px]">อีเมล:</span>
                  <span className="font-mono text-slate-700 truncate block">
                    {currentUser?.email}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">สังกัด:</span>
                  <span className="text-slate-700 truncate block">
                    {currentUser?.department || "-"}
                  </span>
                </div>
              </div>
            </div>

            {/* หากเป็นผู้ที่สลับมาจากแอดมิน มีปุ่มคืนสิทธิ์ */}
            {isImpersonating && (
              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 flex items-center justify-between">
                <span className="text-[11px] text-amber-900 font-semibold">
                  คุณกำลังสลับมาดูในนามของ {currentUser?.name}
                </span>
                <button
                  type="button"
                  onClick={() => handleSwitch(currentUser.originalAdminId)}
                  className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-[11px] transition"
                >
                  ↩️ คืนสิทธิ์แอดมิน
                </button>
              </div>
            )}

            {/* สำหรับ Admin: แสดงรายชื่อครูเพื่อสลับบัญชี (Impersonate) */}
            {(isAdmin || isImpersonating) && teachers.length > 0 && (
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-600">
                    👁️ สลับดูห้องเรียนของครูท่านอื่น:
                  </span>
                  <Link
                    href="/admin/teachers"
                    onClick={() => setShowSwitchModal(false)}
                    className="text-[10px] font-semibold text-indigo-600 hover:underline"
                  >
                    จัดการครูทั้งหมด →
                  </Link>
                </div>

                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {teachers.map((t) => {
                    const isSelected = t.id === currentUser?.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => handleSwitch(t.id)}
                        disabled={isSelected}
                        className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition ${
                          isSelected
                            ? "bg-emerald-50 border-emerald-300 text-emerald-900 opacity-90 cursor-default"
                            : "hover:bg-slate-50 border-slate-200 text-slate-800"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-base">
                            {t.role === "ADMIN" ? "🛡️" : "👨‍🏫"}
                          </span>
                          <div>
                            <div className="font-bold text-xs">{t.name}</div>
                            <div className="text-[10px] text-slate-400">
                              {t.department || t.email}
                            </div>
                          </div>
                        </div>

                        {isSelected ? (
                          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">
                            กำลังใช้งาน
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-semibold hover:text-slate-600">
                            สลับ →
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Footer Actions */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
              {isAdmin && (
                <Link
                  href="/admin/teachers"
                  onClick={() => setShowSwitchModal(false)}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition"
                >
                  👥 หน้าแอดมินใหญ่
                </Link>
              )}

              <div className="flex items-center gap-2 ml-auto">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 transition flex items-center gap-1.5"
                >
                  <span>🚪</span>
                  <span>ออกจากระบบ</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
