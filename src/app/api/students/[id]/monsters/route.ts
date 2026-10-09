import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const student = await prisma.student.findUnique({
      where: { id: params.id },
      include: {
        egg: {
          include: { hatchedMonster: true },
        },
        monsters: {
          include: { monster: true },
          orderBy: [
            { isEquipped: "desc" },
            { level: "desc" },
            { obtainedAt: "desc" },
          ],
        },
      },
    });

    if (!student) {
      return NextResponse.json({ success: false, error: "Student not found" }, { status: 404 });
    }

    // Also if the student hatched an egg in the past but hasn't had it added to StudentMonster, auto-add it!
    if (student.egg?.isHatched && student.egg.hatchedMonsterId) {
      const alreadyHasInList = student.monsters.some(
        (m) => m.monsterId === student.egg?.hatchedMonsterId
      );
      if (!alreadyHasInList) {
        await prisma.studentMonster.create({
          data: {
            studentId: student.id,
            monsterId: student.egg.hatchedMonsterId,
            level: 1,
            exp: 0,
            isEquipped: student.monsters.length === 0,
          },
        });

        // Re-fetch monsters
        const refreshed = await prisma.studentMonster.findMany({
          where: { studentId: student.id },
          include: { monster: true },
          orderBy: [{ isEquipped: "desc" }, { level: "desc" }],
        });
        student.monsters = refreshed;
      }
    }

    return NextResponse.json({
      success: true,
      student: {
        id: student.id,
        name: student.name,
        seatNumber: student.seatNumber,
        exp: student.exp,
        totalPoints: student.totalPoints,
        level: student.level,
      },
      monsters: student.monsters,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// Equip a monster as active partner
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { studentMonsterId } = body;

    if (!studentMonsterId) {
      return NextResponse.json({ success: false, error: "Missing studentMonsterId" }, { status: 400 });
    }

    // Set all to false first
    await prisma.studentMonster.updateMany({
      where: { studentId: params.id },
      data: { isEquipped: false },
    });

    // Set target to true
    const equipped = await prisma.studentMonster.update({
      where: { id: studentMonsterId },
      data: { isEquipped: true },
      include: { monster: true },
    });

    return NextResponse.json({ success: true, equipped });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
