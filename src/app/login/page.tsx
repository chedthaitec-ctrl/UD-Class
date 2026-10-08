"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get("redirect") || "";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAccountReference, setShowAccountReference] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password: password.trim() }),
      });

      const data = await res.json();
      if (data.success) {
        if (redirectPath) {
          router.push(redirectPath);
        } else if (data.user?.role === "ADMIN") {
          router.push("/admin/teachers");
        } else {
          router.push("/");
        }
        router.refresh();
      } else {
        setError(data.error || "อีเมลหรือรหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง");
      }
    } catch (err: any) {
      setError("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const fillCredentials = (fillEmail: string, fillPass: string) => {
    setEmail(fillEmail);
    setPassword(fillPass);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden font-prompt">
      {/* Background Decorative Glows */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-indigo-600/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-emerald-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-600/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="w-full max-w-md space-y-6 relative z-10 animate-fade-in">
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="w-20 h-20 mx-auto flex items-center justify-center relative">
            <div className="absolute inset-0 bg-indigo-500/20 rounded-3xl blur-xl" />
            <img
              src="/logo.png"
              alt="UD-Class Logo"
              className="w-full h-full object-contain relative z-10 drop-shadow-2xl"
            />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-white/10 text-white/90 border border-white/10 backdrop-blur-md mb-2">
              <span>🏫 โรงเรียนอุดมดรุณี</span>
              <span>•</span>
              <span className="text-emerald-400">ระบบพร้อมใช้งาน</span>
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight">
              UD-Class System
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              ระบบบริหารจัดการชั้นเรียน & Gamification ผ่าน LINE
            </p>
          </div>
        </div>

        {/* Modern Glassmorphic Login Form Card */}
        <div className="bg-slate-900/80 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 sm:p-8 space-y-5 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="border-b border-white/10 pb-4">
            <h2 className="text-sm font-black text-white tracking-tight">
              เข้าสู่ระบบ (Sign In)
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              กรอกอีเมลและรหัสผ่านเพื่อเข้าสู่ห้องเรียนของคุณครู
            </p>
          </div>

          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-start gap-2.5 animate-shake">
              <span className="text-base leading-none">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-bold mb-1.5">
                อีเมลประจำตัว (Email)
              </label>
              <input
                type="email"
                required
                placeholder="เช่น chedtha.teacher@school.ac.th"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-slate-950/80 border border-slate-700/80 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-slate-300 font-bold">
                  รหัสผ่าน (Password)
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 transition"
                >
                  {showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                </button>
              </div>
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="กรอกรหัสผ่านของคุณ"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-slate-950/80 border border-slate-700/80 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 font-mono transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-2xl font-bold bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-700 hover:from-indigo-500 hover:via-blue-500 hover:to-indigo-600 text-white transition shadow-lg shadow-indigo-600/30 disabled:opacity-50 flex items-center justify-center gap-2 mt-4 text-xs cursor-pointer active:scale-95"
            >
              <span>{loading ? "กำลังตรวจสอบข้อมูล..." : "เข้าสู่ระบบ"}</span>
              <span>→</span>
            </button>
          </form>

          {/* School Contact Note */}
          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-white/5 text-[11px] text-slate-400 space-y-1">
            <div className="font-bold text-slate-300 flex items-center gap-1.5">
              <span>🏫</span>
              <span>ศูนย์เทคโนโลยีสารสนเทศ (IT Center)</span>
            </div>
            <p className="text-[10px] leading-relaxed text-slate-400">
              สำหรับคุณครูที่ยังไม่มีบัญชีเข้าสู่ระบบ หรือต้องการรีเซ็ตรหัสผ่าน กรุณาติดต่อผู้ดูแลระบบโรงเรียน
            </p>
          </div>
        </div>

        {/* Collapsible Initial Accounts Reference */}
        <div className="text-center">
          <button
            type="button"
            onClick={() => setShowAccountReference(!showAccountReference)}
            className="text-[11px] font-semibold text-slate-400 hover:text-slate-200 transition underline underline-offset-4"
          >
            {showAccountReference
              ? "▲ ซ่อนข้อมูลบัญชีเริ่มต้น"
              : "▼ ดูข้อมูลบัญชีเริ่มต้นของระบบ (สำหรับทดสอบ)"}
          </button>

          {showAccountReference && (
            <div className="mt-3 p-4 bg-slate-900/90 border border-white/10 rounded-3xl text-left text-xs space-y-2.5 animate-fade-in shadow-xl backdrop-blur-xl">
              <div className="text-[11px] font-bold text-slate-300 pb-1.5 border-b border-white/10 flex items-center justify-between">
                <span>บัญชีในระบบ (คลิกเพื่อกรอกอัตโนมัติ):</span>
                <span className="text-[10px] text-slate-400">คลิกที่การ์ดเพื่อใส่ข้อมูล</span>
              </div>

              {/* Admin */}
              <div
                onClick={() => fillCredentials("admin@udclass.ac.th", "admin")}
                className="p-2.5 rounded-2xl bg-slate-950/80 hover:bg-slate-800 border border-white/5 hover:border-amber-500/40 cursor-pointer transition flex items-center justify-between group"
              >
                <div>
                  <div className="font-bold text-amber-300 text-[11px]">
                    🛡️ ผู้ดูแลระบบ (Super Admin)
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    admin@udclass.ac.th
                  </div>
                </div>
                <span className="text-[10px] font-bold text-amber-400 group-hover:translate-x-0.5 transition">
                  คลิกเพื่อใส่ ⇥
                </span>
              </div>

              {/* Teacher Chedtha */}
              <div
                onClick={() => fillCredentials("chedtha.teacher@school.ac.th", "123456")}
                className="p-2.5 rounded-2xl bg-slate-950/80 hover:bg-slate-800 border border-white/5 hover:border-indigo-500/40 cursor-pointer transition flex items-center justify-between group"
              >
                <div>
                  <div className="font-bold text-blue-300 text-[11px]">
                    👨‍🏫 ครูเชษฐ์ พัฒนาวิชาการ (กลุ่มสาระฯ วิทยาศาสตร์)
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    chedtha.teacher@school.ac.th
                  </div>
                </div>
                <span className="text-[10px] font-bold text-blue-400 group-hover:translate-x-0.5 transition">
                  คลิกเพื่อใส่ ⇥
                </span>
              </div>

              {/* Teacher Somchai */}
              <div
                onClick={() => fillCredentials("somchai.math@school.ac.th", "123456")}
                className="p-2.5 rounded-2xl bg-slate-950/80 hover:bg-slate-800 border border-white/5 hover:border-emerald-500/40 cursor-pointer transition flex items-center justify-between group"
              >
                <div>
                  <div className="font-bold text-emerald-300 text-[11px]">
                    👨‍🏫 ครูสมชาย สอนคณิต (กลุ่มสาระฯ คณิตศาสตร์)
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    somchai.math@school.ac.th
                  </div>
                </div>
                <span className="text-[10px] font-bold text-emerald-400 group-hover:translate-x-0.5 transition">
                  คลิกเพื่อใส่ ⇥
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-xs">
          กำลังโหลดหน้าเข้าสู่ระบบ...
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
