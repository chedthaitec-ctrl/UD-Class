import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, serializeSession, SESSION_COOKIE_NAME, AuthUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: "กรุณาเข้าสู่ระบบก่อนทำรายการ" },
        { status: 401 }
      );
    }

    // ในโหมดใช้งานจริง: เฉพาะแอดมิน หรือผู้ที่สลับมาจากบัญชีแอดมินเท่านั้น ที่สามารถใช้ฟังก์ชันสลับบัญชีได้
    const isAllowed = currentUser.role === "ADMIN" || !!currentUser.originalAdminId;
    if (!isAllowed) {
      return NextResponse.json(
        { success: false, error: "เฉพาะผู้ดูแลระบบใหญ่เท่านั้นที่ได้รับอนุญาตให้สลับบัญชี" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { teacherId } = body;

    if (!teacherId) {
      return NextResponse.json(
        { success: false, error: "กรุณาระบุ teacherId" },
        { status: 400 }
      );
    }

    const targetTeacher = await prisma.teacher.findUnique({
      where: { id: teacherId },
    });

    if (!targetTeacher) {
      return NextResponse.json(
        { success: false, error: "ไม่พบข้อมูลครูท่านนี้ในระบบ" },
        { status: 404 }
      );
    }

    // กำหนด originalAdminId เพื่อให้สามารถสลับกลับสู่บัญชีแอดมินได้
    let originalAdminId = currentUser.originalAdminId || null;
    if (currentUser.role === "ADMIN" && targetTeacher.role !== "ADMIN") {
      originalAdminId = currentUser.id;
    } else if (targetTeacher.role === "ADMIN") {
      // หากสลับกลับมาเป็นแอดมินแล้ว ให้เคลียร์ originalAdminId
      originalAdminId = null;
    }

    const authUser: AuthUser = {
      id: targetTeacher.id,
      email: targetTeacher.email,
      name: targetTeacher.name,
      role: targetTeacher.role as "ADMIN" | "TEACHER",
      department: targetTeacher.department,
      phone: targetTeacher.phone,
      originalAdminId,
    };

    const serialized = serializeSession(authUser, originalAdminId);

    const response = NextResponse.json({
      success: true,
      message: `สลับบัญชีเป็น ${targetTeacher.name} เรียบร้อยแล้ว`,
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
