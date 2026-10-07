import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const classroomId = req.nextUrl.searchParams.get("classroomId");
    const where = classroomId ? { classroomId } : {};

    const students = await prisma.student.findMany({
      where,
      include: {
        classroom: true,
        egg: {
          include: { hatchedMonster: true },
        },
        submissions: true,
      },
      orderBy: { seatNumber: "asc" },
    });

    return NextResponse.json({ success: true, students });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { classroomId, seatNumber, name, lineUserId, eggType = "NORMAL" } = body;

    const eggColorMap: Record<string, string> = {
      NORMAL: "amber",
      RARE: "blue",
      LEGENDARY: "red",
    };

    const student = await prisma.student.create({
      data: {
        classroomId,
        seatNumber: parseInt(seatNumber, 10),
        name: name.trim(),
        lineUserId: lineUserId ? lineUserId.trim() : null,
        avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name)}`,
        egg: {
          create: {
            eggName: `ไข่มอนสเตอร์เริ่มต้น (เกรด ${eggType})`,
            eggType,
            eggColor: eggColorMap[eggType] || "amber",
            currentExp: 0,
            targetExp: 100,
            isHatched: false,
          },
        },
      },
      include: {
        egg: true,
      },
    });

    return NextResponse.json({ success: true, student });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, seatNumber, name, lineUserId, exp, totalPoints } = body;

    const student = await prisma.student.update({
      where: { id },
      data: {
        seatNumber: seatNumber !== undefined ? parseInt(seatNumber, 10) : undefined,
        name: name !== undefined ? name.trim() : undefined,
        lineUserId: lineUserId !== undefined ? (lineUserId ? lineUserId.trim() : null) : undefined,
        exp: exp !== undefined ? parseInt(exp, 10) : undefined,
        totalPoints: totalPoints !== undefined ? parseInt(totalPoints, 10) : undefined,
      },
      include: {
        egg: { include: { hatchedMonster: true } },
      },
    });

    return NextResponse.json({ success: true, student });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing student ID" }, { status: 400 });

    await prisma.student.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
