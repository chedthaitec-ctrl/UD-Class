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
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decorative Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-20 h-20 mx-auto flex items-center justify-center">
            <img
              src="/logo.png"
              alt="UD-Class Logo"
              className="w-full h-full object-contain drop-shadow-2xl"
            />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            UD-Class System
          </h1>
          <p className="text-xs text-slate-400">
            ระบบบริหารจัดการชั้นเรียน โรงเรียนอุดมดรุณี
          </p>
        </div>

        {/* Production Login Form Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-5 shadow-2xl">
          <div className="border-b border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-white">
              เข้าสู่ระบบ (Sign In)
            </h2>
            <p className="text-[11px] text-slate-400">
              กรอกอีเมลและรหัสผ่านเพื่อเข้าใช้งานห้องเรียนของคุณครู
            </p>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-start gap-2.5">
              <span className="text-base leading-none">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                อีเมลประจำตัว (Email)
              </label>
              <input
                type="email"
                required
                placeholder="เช่น chedtha.teacher@school.ac.th"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-slate-300 font-semibold">
                  รหัสผ่าน (Password)
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[11px] text-blue-400 hover:text-blue-300 transition"
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
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-bold bg-blue-600 hover:bg-blue-500 text-white transition shadow-lg shadow-blue-600/30 disabled:opacity-50 flex items-center justify-center gap-2 mt-3 text-xs"
            >
              <span>{loading ? "กำลังตรวจสอบข้อมูล..." : "เข้าสู่ระบบ"}</span>
              <span>→</span>
            </button>
          </form>

          {/* School Contact Note */}
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-[11px] text-slate-400 space-y-1">
            <div className="font-semibold text-slate-300 flex items-center gap-1.5">
              <span>🏫</span>
              <span>ศูนย์เทคโนโลยีสารสนเทศ (IT Center)</span>
            </div>
            <p className="text-[10px] leading-relaxed">
              สำหรับคุณครูที่ยังไม่มีบัญชีเข้าสู่ระบบ หรือต้องการรีเซ็ตรหัสผ่าน กรุณาติดต่อผู้ดูแลระบบโรงเรียน
            </p>
          </div>
        </div>

        {/* Collapsible Initial Accounts Reference */}
        <div className="text-center">
          <button
            type="button"
            onClick={() => setShowAccountReference(!showAccountReference)}
            className="text-[11px] text-slate-500 hover:text-slate-400 transition underline underline-offset-4"
          >
            {showAccountReference
              ? "▲ ซ่อนข้อมูลบัญชีเริ่มต้น"
              : "▼ ดูข้อมูลบัญชีเริ่มต้นของระบบ (สำหรับคุณครูและแอดมิน)"}
          </button>

          {showAccountReference && (
            <div className="mt-3 p-4 bg-slate-900/90 border border-slate-800 rounded-2xl text-left text-xs space-y-2.5 animate-fade-in shadow-xl">
              <div className="text-[11px] font-bold text-slate-300 pb-1 border-b border-slate-800">
                บัญชีเริ่มต้นในระบบ:
              </div>

              {/* Admin */}
              <div
                onClick={() => fillCredentials("admin@udclass.ac.th", "admin")}
                className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 cursor-pointer transition flex items-center justify-between"
              >
                <div>
                  <div className="font-bold text-amber-300 text-[11px]">
                    🛡️ ผู้ดูแลระบบ (Super Admin)
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    admin@udclass.ac.th
                  </div>
                </div>
                <span className="text-[10px] text-slate-400 hover:text-white">
                  ใส่ข้อมูลนี้ ⇥
                </span>
              </div>

              {/* Teacher Chedtha */}
              <div
                onClick={() => fillCredentials("chedtha.teacher@school.ac.th", "123456")}
                className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 cursor-pointer transition flex items-center justify-between"
              >
                <div>
                  <div className="font-bold text-blue-300 text-[11px]">
                    👨‍🏫 ครูเชษฐ์ พัฒนาวิชาการ (กลุ่มสาระฯ วิทยาศาสตร์)
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    chedtha.teacher@school.ac.th
                  </div>
                </div>
                <span className="text-[10px] text-slate-400 hover:text-white">
                  ใส่ข้อมูลนี้ ⇥
                </span>
              </div>

              {/* Teacher Somchai */}
              <div
                onClick={() => fillCredentials("somchai.math@school.ac.th", "123456")}
                className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 cursor-pointer transition flex items-center justify-between"
              >
                <div>
                  <div className="font-bold text-emerald-300 text-[11px]">
                    👨‍🏫 ครูสมชาย สอนคณิต (กลุ่มสาระฯ คณิตศาสตร์)
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    somchai.math@school.ac.th
                  </div>
                </div>
                <span className="text-[10px] text-slate-400 hover:text-white">
                  ใส่ข้อมูลนี้ ⇥
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
