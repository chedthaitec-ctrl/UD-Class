"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e?: React.FormEvent, customEmail?: string, customPassword?: string) => {
    if (e) e.preventDefault();
    setError(null);
    setLoading(true);

    const targetEmail = customEmail || email;
    const targetPassword = customPassword || password;

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: targetEmail, password: targetPassword }),
      });

      const data = await res.json();
      if (data.success) {
        // ถ้าเป็นแอดมิน ให้พาไปหน้าจัดการครู /admin/teachers
        // ถ้าเป็นครู ให้พาไปหน้าแรกของครู /
        if (data.user?.role === "ADMIN") {
          router.push("/admin/teachers");
        } else {
          router.push("/");
        }
        router.refresh();
      } else {
        setError(data.error || "อีเมลหรือรหัสผ่านไม่ถูกต้อง");
      }
    } catch (err: any) {
      setError("เกิดข้อผิดพลาดในการเชื่อมต่อ: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = (qEmail: string, qPass: string) => {
    setEmail(qEmail);
    setPassword(qPass);
    handleLogin(undefined, qEmail, qPass);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-3xl bg-white p-1 mx-auto shadow-2xl shadow-blue-500/20 border border-slate-700 flex items-center justify-center">
            <img
              src="/logo.jpg"
              alt="UD-Class Logo"
              className="w-full h-full object-contain rounded-2xl"
            />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            UD-Class System
          </h1>
          <p className="text-xs text-slate-400">
            ระบบบริหารจัดการชั้นเรียน & บัญชีคุณครู โรงเรียนอุดมดรุณี
          </p>
        </div>

        {/* Quick Demo Switcher Cards */}
        <div className="bg-slate-900/90 backdrop-blur border border-slate-800 rounded-3xl p-5 space-y-3 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              ⚡ เข้าสู่ระบบด่วน (คลิกเดียวเพื่อทดสอบ)
            </span>
            <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              Demo Access
            </span>
          </div>

          <div className="space-y-2">
            {/* Super Admin */}
            <button
              type="button"
              onClick={() => quickLogin("admin@udclass.ac.th", "admin")}
              disabled={loading}
              className="w-full p-3 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-left flex items-center justify-between transition group"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">🛡️</span>
                <div>
                  <div className="text-xs font-bold text-amber-300 group-hover:text-amber-200">
                    ผู้ดูแลระบบใหญ่ (Super Admin)
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    admin@udclass.ac.th
                  </div>
                </div>
              </div>
              <span className="text-xs text-amber-400 group-hover:translate-x-1 transition font-bold">
                เข้าใช้งาน →
              </span>
            </button>

            {/* Teacher 1: วิทยาศาสตร์ */}
            <button
              type="button"
              onClick={() => quickLogin("chedtha.teacher@school.ac.th", "123456")}
              disabled={loading}
              className="w-full p-3 rounded-2xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-left flex items-center justify-between transition group"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">👨‍🏫</span>
                <div>
                  <div className="text-xs font-bold text-blue-300 group-hover:text-blue-200">
                    ครูเชษฐ์ พัฒนาวิชาการ (วิทย์ ม.3/1)
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    chedtha.teacher@school.ac.th
                  </div>
                </div>
              </div>
              <span className="text-xs text-blue-400 group-hover:translate-x-1 transition font-bold">
                เข้าใช้งาน →
              </span>
            </button>

            {/* Teacher 2: คณิตศาสตร์ */}
            <button
              type="button"
              onClick={() => quickLogin("somchai.math@school.ac.th", "123456")}
              disabled={loading}
              className="w-full p-3 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-left flex items-center justify-between transition group"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">👨‍🏫</span>
                <div>
                  <div className="text-xs font-bold text-emerald-300 group-hover:text-emerald-200">
                    ครูสมชาย สอนคณิต (คณิต ม.3/2)
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    somchai.math@school.ac.th
                  </div>
                </div>
              </div>
              <span className="text-xs text-emerald-400 group-hover:translate-x-1 transition font-bold">
                เข้าใช้งาน →
              </span>
            </button>
          </div>
        </div>

        {/* Standard Login Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-5 shadow-2xl">
          <div className="border-b border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-white">
              เข้าสู่ระบบด้วยอีเมลและรหัสผ่าน
            </h2>
            <p className="text-[11px] text-slate-400">
              สำหรับคุณครูและผู้ดูแลระบบโรงเรียนอุดมดรุณี
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold">
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                อีเมล (Email)
              </label>
              <input
                type="email"
                required
                placeholder="เช่น your.name@school.ac.th"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                รหัสผ่าน (Password)
              </label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-bold bg-blue-600 hover:bg-blue-500 text-white transition shadow-lg shadow-blue-600/30 disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
            >
              <span>{loading ? "กำลังตรวจสอบ..." : "เข้าสู่ระบบ"}</span>
              <span>→</span>
            </button>
          </form>

          <div className="text-center pt-2">
            <Link
              href="/"
              className="text-[11px] text-slate-500 hover:text-slate-300 transition"
            >
              ← กลับไปยังหน้าแรก (โหมดสาธิต)
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
