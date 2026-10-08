import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeSession, SESSION_COOKIE_NAME, AuthUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { teacherId } = body;

    if (!teacherId) {
      return NextResponse.json(
        { success: false, error: "กรุณาระบุ teacherId" },
        { status: 400 }
      );
    }

    const teacher = await prisma.teacher.findUnique({
      where: { id: teacherId },
    });

    if (!teacher) {
      return NextResponse.json(
        { success: false, error: "ไม่พบข้อมูลครูท่านนี้ในระบบ" },
        { status: 404 }
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
      message: `สลับบัญชีเป็น ${teacher.name} (${teacher.role}) เรียบร้อยแล้ว`,
      user: authUser,
    });

    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: serialized,
      path: "/",
      httpOnly: false,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
    });

    return response;
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
