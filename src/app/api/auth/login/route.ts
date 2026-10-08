import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeSession, SESSION_COOKIE_NAME, AuthUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email) {
      return NextResponse.json(
        { success: false, error: "กรุณาระบุอีเมล" },
        { status: 400 }
      );
    }

    const teacher = await prisma.teacher.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    if (!teacher) {
      return NextResponse.json(
        { success: false, error: "ไม่พบผู้ใช้งานนี้ในระบบ" },
        { status: 404 }
      );
    }

    // ตรวจสอบรหัสผ่าน (หากมีรหัสผ่านกำหนดไว้)
    if (teacher.password && password && teacher.password !== password) {
      return NextResponse.json(
        { success: false, error: "รหัสผ่านไม่ถูกต้อง" },
        { status: 401 }
      );
    }

    const authUser: AuthUser = {
      id: teacher.id,
      email: teacher.email,
      name: teacher.name,
      role: teacher.role as "ADMIN" | "TEACHER",
      department: teacher.department,
      phone: teacher.phone,
    };

    const serialized = serializeSession(authUser);

    const response = NextResponse.json({
      success: true,
      message: `ยินดีต้อนรับ ${authUser.name}`,
      user: authUser,
    });

    // ตั้งค่า Cookie สำหรับ Session
    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: serialized,
      path: "/",
      httpOnly: false,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 วัน
    });

    return response;
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
