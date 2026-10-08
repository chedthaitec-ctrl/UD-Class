import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import SidebarProfile from "@/components/SidebarProfile";

export const metadata: Metadata = {
  title: "UD-Class | ระบบจัดการชั้นเรียน โรงเรียนอุดมดรุณี",
  description: "ระบบจัดการชั้นเรียน บ็อตทวงงาน เช็คชื่อ และ Gamification โรงเรียนอุดมดรุณี (UD-Class System)",
  icons: {
    icon: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th">
      <body className="bg-[#f8fafc] text-slate-800 antialiased min-h-screen flex flex-col md:flex-row selection:bg-indigo-500 selection:text-white font-sans">
        {/* Modern Sidebar */}
        <aside className="w-full md:w-64 bg-slate-950 text-white flex-shrink-0 flex flex-col border-r border-slate-800/80 shadow-2xl relative z-40">
          {/* Logo & School Header */}
          <div className="p-4 border-b border-slate-800/80 bg-gradient-to-b from-slate-900/60 to-transparent">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center p-0.5 rounded-2xl bg-white/5 border border-white/10 shadow-lg group-hover:scale-105 transition-all duration-300">
                <img
                  src="/logo.png"
                  alt="UD-Class Logo"
                  className="w-full h-full object-contain drop-shadow"
                />
              </div>
              <div className="overflow-hidden">
                <div className="flex items-center gap-1.5">
                  <h1 className="font-extrabold text-base leading-tight tracking-tight text-white group-hover:text-emerald-400 transition">
                    UD-Class
                  </h1>
                  <span className="px-1.5 py-0.2 text-[9px] font-black bg-emerald-500/20 text-emerald-300 rounded border border-emerald-500/30">
                    PRO
                  </span>
                </div>
                <p className="text-[11px] text-blue-400 font-semibold truncate">
                  โรงเรียนอุดมดรุณี
                </p>
                <p className="text-[10px] text-slate-400 truncate">
                  Classroom Management
                </p>
              </div>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="p-3.5 space-y-1 flex-1 overflow-y-auto">
            <div className="text-[10px] font-extrabold tracking-widest text-slate-400 uppercase px-3 py-1.5">
              เมนูจัดการคุณครู
            </div>

            <Link
              href="/"
              className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/5 transition-all duration-200 group"
            >
              <span className="text-base group-hover:scale-110 transition-transform">📊</span>
              <span>ภาพรวมแดชบอร์ด</span>
            </Link>

            <Link
              href="/classrooms"
              className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/5 transition-all duration-200 group"
            >
              <span className="text-base group-hover:scale-110 transition-transform">🏫</span>
              <span>ห้องเรียนทั้งหมด</span>
            </Link>

            <Link
              href="/monsters"
              className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/5 transition-all duration-200 group"
            >
              <span className="text-base group-hover:scale-110 transition-transform">👾</span>
              <span>คลังมอนสเตอร์ & กาชา</span>
            </Link>

            <div className="pt-3 text-[10px] font-extrabold tracking-widest text-slate-400 uppercase px-3 py-1.5">
              LINE Bot & การเชื่อมต่อ
            </div>

            <Link
              href="/simulator"
              className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30 transition-all duration-200 group"
            >
              <div className="flex items-center gap-2.5">
                <span className="text-base group-hover:scale-110 transition-transform">💬</span>
                <span>จำลอง LINE Bot</span>
              </div>
              <span className="px-1.5 py-0.5 text-[9px] font-black bg-emerald-500 text-slate-950 rounded shadow-sm">
                LIVE
              </span>
            </Link>

            <div className="pt-3 text-[10px] font-extrabold tracking-widest text-slate-400 uppercase px-3 py-1.5">
              พอร์ทัลนักเรียน (LIFF)
            </div>

            <Link
              href="/liff/submit"
              className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/5 transition-all duration-200 group"
            >
              <span className="text-sm group-hover:scale-110 transition-transform">🚀</span>
              <span>ส่งการบ้าน (LIFF Submit)</span>
            </Link>

            <Link
              href="/liff/monster"
              className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/5 transition-all duration-200 group"
            >
              <span className="text-sm group-hover:scale-110 transition-transform">✨</span>
              <span>ห้องฟักไข่ (LIFF Incubator)</span>
            </Link>

            <div className="pt-3 text-[10px] font-extrabold tracking-widest text-slate-400 uppercase px-3 py-1.5">
              ระบบ & แอดมิน
            </div>

            <Link
              href="/admin/teachers"
              className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 border border-amber-500/30 transition-all duration-200 group"
            >
              <div className="flex items-center gap-2.5">
                <span className="text-base group-hover:scale-110 transition-transform">🛡️</span>
                <span>จัดการคุณครู</span>
              </div>
              <span className="px-1.5 py-0.5 text-[9px] font-black bg-amber-500 text-slate-950 rounded">
                Admin
              </span>
            </Link>

            <Link
              href="/settings"
              className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/5 transition-all duration-200 group"
            >
              <span className="text-base group-hover:scale-110 transition-transform">⚙️</span>
              <span>ตั้งค่าระบบ & Token</span>
            </Link>
          </nav>

          {/* Teacher Profile Footer Component */}
          <SidebarProfile />
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
          {/* Top Glass Header */}
          <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-6 flex items-center justify-between sticky top-0 z-30 shadow-sm transition-all">
            <div className="flex items-center gap-3">
              <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                <span>🏫</span>
                <span>ร.ร.อุดมดรุณี • ภาคเรียนที่ 1/2569</span>
              </span>

              <div className="flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/70">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>LINE Bot Webhook: <strong className="text-emerald-800 font-bold">ออนไลน์</strong></span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/simulator"
                className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition shadow-sm"
              >
                <span>🤖</span>
                <span>ทดสอบบ็อต</span>
              </Link>

              <Link
                href="/classrooms"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition shadow-sm hover:shadow-md"
              >
                <span>➕</span>
                <span>สร้างห้องเรียน</span>
              </Link>
            </div>
          </header>

          {/* Page Body */}
          <main className="flex-1 p-5 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto animate-fade-in">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
