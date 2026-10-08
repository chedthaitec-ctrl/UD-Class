import { cookies } from "next/headers";
import { prisma } from "./prisma";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: "ADMIN" | "TEACHER";
  department: string | null;
  phone?: string | null;
}

const SESSION_COOKIE_NAME = "udclass_session";

/**
 * ดึงข้อมูลผู้ใช้งานที่กำลังล็อกอินอยู่ปัจจุบันจาก Cookie (Server Component / Route Handler)
 * หากยังไม่มี Session จะคืนค่าเป็นคุณครูคนแรก หรือ Super Admin เป็นค่าเริ่มต้น (เพื่อความสะดวก)
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
            return teacher as AuthUser;
          }
        }
      } catch (err) {
        console.warn("Invalid session cookie JSON, falling back");
      }
    }

    // หากไม่มี Cookie ให้ดึงคุณครูคนแรกของระบบเป็น Default
    const defaultTeacher = await prisma.teacher.findFirst({
      where: { role: "TEACHER" },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        department: true,
        phone: true,
      },
    });

    if (defaultTeacher) {
      return defaultTeacher as AuthUser;
    }

    // หากยังไม่มีครู ให้ดึงคนแรกสุดในตาราง
    const anyUser = await prisma.teacher.findFirst({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        department: true,
        phone: true,
      },
    });

    return (anyUser as AuthUser) || null;
  } catch (error) {
    console.error("getCurrentUser error:", error);
    return null;
  }
}

/**
 * เข้ารหัสข้อมูลผู้ใช้สำหรับบันทึกลงใน Cookie
 */
export function serializeSession(user: AuthUser): string {
  return encodeURIComponent(
    JSON.stringify({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      department: user.department,
    })
  );
}

export { SESSION_COOKIE_NAME };
