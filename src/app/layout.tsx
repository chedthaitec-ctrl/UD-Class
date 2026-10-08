import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import SidebarProfile from "@/components/SidebarProfile";

export const metadata: Metadata = {
  title: "UD-Class | Classroom Management",
  description: "ระบบจัดการชั้นเรียน บ็อตทวงงาน เช็คชื่อ และ Gamification โรงเรียนอุดมดรุณี (UD-Class)",
  icons: {
    icon: "/logo.jpg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th">
      <body className="bg-slate-50 text-slate-800 antialiased min-h-screen flex flex-col md:flex-row">
        {/* Sidebar */}
        <aside className="w-full md:w-64 bg-slate-900 text-white flex-shrink-0 flex flex-col border-r border-slate-800">
          {/* Logo & Header */}
          <div className="p-5 border-b border-slate-800 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-11 h-11 rounded-full overflow-hidden bg-white p-0.5 shadow-lg shadow-blue-500/20 flex-shrink-0 border border-slate-700">
                <img
                  src="/logo.jpg"
                  alt="UD-Class Logo"
                  className="w-full h-full object-contain rounded-full"
                />
              </div>
              <div>
                <h1 className="font-bold text-lg leading-tight tracking-tight text-white group-hover:text-emerald-400 transition">
                  UD-Class
                </h1>
                <p className="text-xs text-blue-400 font-medium">
                  Classroom Management
                </p>
              </div>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5 flex-1">
            <div className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase px-3 mb-2">
              เมนูจัดการคุณครู
            </div>

            <Link
              href="/"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium text-slate-200 hover:text-white hover:bg-slate-800 transition"
            >
              <span className="text-base">📊</span>
              <span>ภาพรวมแดชบอร์ด</span>
            </Link>

            <Link
              href="/classrooms"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium text-slate-200 hover:text-white hover:bg-slate-800 transition"
            >
              <span className="text-base">🏫</span>
              <span>ห้องเรียนทั้งหมด</span>
            </Link>

            <Link
              href="/monsters"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium text-slate-200 hover:text-white hover:bg-slate-800 transition"
            >
              <span className="text-base">👾</span>
              <span>คลังมอนสเตอร์ & กาชา</span>
            </Link>

            <div className="pt-4 text-[11px] font-semibold tracking-wider text-slate-400 uppercase px-3 mb-2">
              LINE Bot & การเชื่อมต่อ
            </div>

            <Link
              href="/simulator"
              className="flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30 transition"
            >
              <div className="flex items-center gap-3">
                <span className="text-base">💬</span>
                <span>จำลอง LINE Bot</span>
              </div>
              <span className="px-1.5 py-0.5 text-[10px] font-bold bg-emerald-500 text-slate-950 rounded">
                LIVE
              </span>
            </Link>

            <div className="pt-4 text-[11px] font-semibold tracking-wider text-slate-400 uppercase px-3 mb-2">
              พอร์ทัลนักเรียน (LIFF)
            </div>

            <Link
              href="/liff/submit"
              className="flex items-center gap-3 px-3.5 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition"
            >
              <span className="text-sm">🚀</span>
              <span>ส่งการบ้าน (LIFF Submit)</span>
            </Link>

            <Link
              href="/liff/monster"
              className="flex items-center gap-3 px-3.5 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition"
            >
              <span className="text-sm">✨</span>
              <span>ห้องฟักไข่ (LIFF Incubator)</span>
            </Link>

            <div className="pt-4 text-[11px] font-semibold tracking-wider text-slate-400 uppercase px-3 mb-2">
              ระบบ & แอดมิน
            </div>

            <Link
              href="/admin/teachers"
              className="flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 border border-amber-500/30 transition group"
            >
              <div className="flex items-center gap-3">
                <span className="text-base">🛡️</span>
                <span>จัดการคุณครู</span>
              </div>
              <span className="px-1.5 py-0.5 text-[10px] font-bold bg-amber-500 text-slate-950 rounded">
                Admin
              </span>
            </Link>

            <Link
              href="/settings"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium text-slate-200 hover:text-white hover:bg-slate-800 transition"
            >
              <span className="text-base">⚙️</span>
              <span>ตั้งค่าระบบ & LINE Token</span>
            </Link>
          </nav>

          {/* Teacher Profile Footer Component */}
          <SidebarProfile />
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
          {/* Top Banner / Breadcrumb Header */}
          <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-30 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs font-medium text-slate-500">
                LINE Bot Webhook: <span className="text-emerald-600 font-semibold">พร้อมทำงาน</span>
              </span>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/simulator"
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition"
              >
                <span>🤖</span>
                <span>เปิดห้องจำลองบ็อต</span>
              </Link>

              <Link
                href="/classrooms"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 transition shadow-sm"
              >
                <span>➕</span>
                <span>สร้างห้องเรียนใหม่</span>
              </Link>
            </div>
          </header>

          {/* Page Body */}
          <main className="flex-1 p-6 lg:p-8 max-w-7xl w-full mx-auto">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
