import { cookies } from "next/headers";
import { prisma } from "./prisma";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: "ADMIN" | "TEACHER";
  department: string | null;
  phone?: string | null;
  originalAdminId?: string | null;
}

const SESSION_COOKIE_NAME = "udclass_session";

/**
 * ดึงข้อมูลผู้ใช้งานที่กำลังล็อกอินอยู่ปัจจุบันจาก Cookie (Server Component / Route Handler)
 * โหมดใช้งานจริง (Production): หากไม่มี Session หรือ Session หมดอายุ จะคืนค่าเป็น null
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);

    if (sessionCookie && sessionCookie.value) {
      try {
        const parsed = JSON.parse(decodeURIComponent(sessionCookie.value));
        if (parsed && parsed.id) {
          // ตรวจสอบกับฐานข้อมูลว่ายังมีผู้ใช้นี้อยู่จริง
          const teacher = await prisma.teacher.findUnique({
            where: { id: parsed.id },
            select: {
              id: true,
              email: true,
              name: true,
              role: true,
              department: true,
              phone: true,
            },
          });

          if (teacher) {
            return {
              ...teacher,
              originalAdminId: parsed.originalAdminId || null,
            } as AuthUser;
          }
        }
      } catch (err) {
        console.warn("Invalid session cookie JSON");
      }
    }

    // พร้อมใช้งานจริง: ไม่คืนค่าจำลอง คืนค่า null เพื่อให้ระบบพาไปหน้าล็อกอิน
    return null;
  } catch (error) {
    console.error("getCurrentUser error:", error);
    return null;
  }
}

/**
 * เข้ารหัสข้อมูลผู้ใช้สำหรับบันทึกลงใน Cookie
 */
export function serializeSession(user: AuthUser, originalAdminId?: string | null): string {
  return encodeURIComponent(
    JSON.stringify({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      department: user.department,
      originalAdminId: originalAdminId || user.originalAdminId || null,
    })
  );
}

export { SESSION_COOKIE_NAME };
