import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. กำหนดรายการเส้นทางที่เปิดเป็นสาธารณะ (Public Routes)
  const isPublicPath =
    pathname.startsWith("/login") ||
    pathname.startsWith("/liff") ||
    pathname.startsWith("/api/line/webhook") ||
    pathname.startsWith("/api/auth/login") ||
    pathname.startsWith("/api/auth/logout") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/logo.jpg") ||
    pathname.startsWith("/logo.png") ||
    pathname.startsWith("/api/cron");

  if (isPublicPath) {
    // หากเข้าหน้า /login แต่มี session อยู่แล้ว ให้ redirect ไปที่หน้าหลัก
    if (pathname === "/login") {
      const session = request.cookies.get("udclass_session")?.value;
      if (session) {
        try {
          const parsed = JSON.parse(decodeURIComponent(session));
          if (parsed && parsed.id) {
            const dest = parsed.role === "ADMIN" ? "/admin/teachers" : "/";
            return NextResponse.redirect(new URL(dest, request.url));
          }
        } catch {
          // ignore error
        }
      }
    }
    return NextResponse.next();
  }

  // 2. ตรวจสอบ Session Cookie สำหรับหน้าที่ต้องล็อกอิน (Protected Routes)
  const sessionCookie = request.cookies.get("udclass_session")?.value;
  let user: any = null;

  if (sessionCookie) {
    try {
      user = JSON.parse(decodeURIComponent(sessionCookie));
    } catch {
      user = null;
    }
  }

  // 3. หากยังไม่ได้ล็อกอิน ให้พาไปหน้าล็อกอินพร้อมเก็บ URL ปลายทาง
  if (!user || !user.id) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { success: false, error: "กรุณาเข้าสู่ระบบก่อนทำรายการ" },
        { status: 401 }
      );
    }

    const loginUrl = new URL("/login", request.url);
    if (pathname !== "/") {
      loginUrl.searchParams.set("redirect", pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  // 4. ตรวจสอบสิทธิ์เฉพาะแอดมิน (Super Admin Only Routes)
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    if (user.role !== "ADMIN" && !user.originalAdminId) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json(
          { success: false, error: "เฉพาะผู้ดูแลระบบใหญ่เท่านั้นที่เข้าถึงได้" },
          { status: 403 }
        );
      }
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for static files:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, logo.jpg, logo.png
     */
    "/((?!_next/static|_next/image|favicon.ico|logo.jpg|logo.png).*)",
  ],
};
