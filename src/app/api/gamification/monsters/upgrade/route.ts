import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { studentId, targetStudentMonsterId, fodderStudentMonsterIds } = body;

    if (!studentId || !targetStudentMonsterId || !Array.isArray(fodderStudentMonsterIds) || fodderStudentMonsterIds.length === 0) {
      return NextResponse.json({ success: false, error: "Missing required parameters" }, { status: 400 });
    }

    // Ensure target monster is not in fodder list
    if (fodderStudentMonsterIds.includes(targetStudentMonsterId)) {
      return NextResponse.json({ success: false, error: "ไม่สามารถนำมอนสเตอร์เป้าหมายมาใช้เป็นวัตถุดิบของตัวเองได้" }, { status: 400 });
    }

    // Fetch target monster
    const targetMonster = await prisma.studentMonster.findFirst({
      where: {
        id: targetStudentMonsterId,
        studentId,
      },
      include: { monster: true },
    });

    if (!targetMonster) {
      return NextResponse.json({ success: false, error: "Target monster not found" }, { status: 404 });
    }

    // Fetch fodder monsters
    const fodderMonsters = await prisma.studentMonster.findMany({
      where: {
        id: { in: fodderStudentMonsterIds },
        studentId,
      },
      include: { monster: true },
    });

    if (fodderMonsters.length !== fodderStudentMonsterIds.length) {
      return NextResponse.json({ success: false, error: "มอนสเตอร์วัตถุดิบบางตัวไม่ถูกต้องหรือไม่ใช่ของนักเรียน" }, { status: 400 });
    }

    // Calculate EXP gained
    let totalExpGained = 0;
    fodderMonsters.forEach((f) => {
      let expForThisFodder = 50;
      // Duplicate bonus: same monster gives 150 EXP!
      if (f.monsterId === targetMonster.monsterId) {
        expForThisFodder = 150;
      } else if (f.monster.element === targetMonster.monster.element) {
        // Same element bonus: 80 EXP
        expForThisFodder = 80;
      }
      // Fodder level bonus
      expForThisFodder += (f.level - 1) * 20;

      totalExpGained += expForThisFodder;
    });

    // Calculate new level & remaining EXP
    const currentExp = targetMonster.exp;
    const combinedExp = currentExp + totalExpGained;
    const EXP_PER_LEVEL = 100;
    const levelsGained = Math.floor(combinedExp / EXP_PER_LEVEL);
    const newLevel = Math.min(50, targetMonster.level + levelsGained);
    const remainingExp = combinedExp % EXP_PER_LEVEL;

    // Delete consumed fodder monsters
    await prisma.studentMonster.deleteMany({
      where: {
        id: { in: fodderStudentMonsterIds },
      },
    });

    // Update target monster
    const updated = await prisma.studentMonster.update({
      where: { id: targetStudentMonsterId },
      data: {
        level: newLevel,
        exp: remainingExp,
      },
      include: { monster: true },
    });

    return NextResponse.json({
      success: true,
      updatedMonster: updated,
      expGained: totalExpGained,
      oldLevel: targetMonster.level,
      newLevel,
      levelsGained,
      leveledUp: newLevel > targetMonster.level,
      consumedCount: fodderMonsters.length,
    });
  } catch (error: any) {
    console.error("Monster upgrade error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
