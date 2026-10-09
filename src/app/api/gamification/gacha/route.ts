import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { studentId, count = 1 } = body;

    if (!studentId) {
      return NextResponse.json({ success: false, error: "Missing studentId" }, { status: 400 });
    }

    const pullCount = count === 11 ? 11 : 1;
    const costExp = pullCount === 11 ? 50 : 5;

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        monsters: true,
      },
    });

    if (!student) {
      return NextResponse.json({ success: false, error: "Student not found" }, { status: 404 });
    }

    if (student.exp < costExp) {
      return NextResponse.json(
        {
          success: false,
          error: `EXP ไม่เพียงพอสำหรับการหมุนกาชา (ต้องการ ${costExp} EXP แต่คุณมีเพียง ${student.exp} EXP)`,
          currentExp: student.exp,
          requiredExp: costExp,
        },
        { status: 400 }
      );
    }

    // Deduct student EXP
    await prisma.student.update({
      where: { id: studentId },
      data: {
        exp: { decrement: costExp },
      },
    });

    // Fetch all monsters grouped by rarity
    const allMonsters = await prisma.monster.findMany();
    if (allMonsters.length === 0) {
      return NextResponse.json({ success: false, error: "No monsters found in database" }, { status: 500 });
    }

    const commonMonsters = allMonsters.filter((m) => m.rarity === "COMMON");
    const rareMonsters = allMonsters.filter((m) => m.rarity === "RARE");
    const epicMonsters = allMonsters.filter((m) => m.rarity === "EPIC");
    const legMonsters = allMonsters.filter((m) => m.rarity === "LEGENDARY");

    const pulledList = [];
    const hasEquipped = student.monsters.some((m) => m.isEquipped);

    for (let i = 0; i < pullCount; i++) {
      let pool = commonMonsters;
      const roll = Math.random() * 100;

      // 11th pull guarantee (at least RARE or higher)
      if (pullCount === 11 && i === 10) {
        if (roll < 12 && legMonsters.length > 0) pool = legMonsters;
        else if (roll < 45 && epicMonsters.length > 0) pool = epicMonsters;
        else pool = rareMonsters.length > 0 ? rareMonsters : allMonsters;
      } else {
        if (roll < 4 && legMonsters.length > 0) pool = legMonsters;
        else if (roll < 18 && epicMonsters.length > 0) pool = epicMonsters;
        else if (roll < 48 && rareMonsters.length > 0) pool = rareMonsters;
        else pool = commonMonsters.length > 0 ? commonMonsters : allMonsters;
      }

      if (pool.length === 0) pool = allMonsters;
      const chosen = pool[Math.floor(Math.random() * pool.length)];

      const isFirstEver = !hasEquipped && i === 0;

      const createdStudentMonster = await prisma.studentMonster.create({
        data: {
          studentId,
          monsterId: chosen.id,
          level: 1,
          exp: 0,
          isEquipped: isFirstEver,
        },
        include: {
          monster: true,
        },
      });

      pulledList.push(createdStudentMonster);
    }

    const updatedStudent = await prisma.student.findUnique({
      where: { id: studentId },
      select: { exp: true, totalPoints: true, level: true },
    });

    return NextResponse.json({
      success: true,
      pullCount,
      costExp,
      remainingExp: updatedStudent?.exp || 0,
      pulledMonsters: pulledList,
    });
  } catch (error: any) {
    console.error("Gacha roll error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
