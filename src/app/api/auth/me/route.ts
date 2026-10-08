import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, user: null }, { status: 401 });
    }

    // หากเป็น ADMIN ให้ส่งรายชื่อครูทั้งหมดไปด้วย เพื่อให้ทำ Fast Switch ได้ง่าย
    let teachers: any[] = [];
    if (user.role === "ADMIN") {
      teachers = await prisma.teacher.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          department: true,
          phone: true,
          _count: {
            select: {
              classrooms: true,
            },
          },
        },
        orderBy: { name: "asc" },
      });
    }

    return NextResponse.json({
      success: true,
      user,
      teachers,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
