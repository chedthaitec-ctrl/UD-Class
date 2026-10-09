import { prisma } from "../prisma";

export const EXP_RULES = {
  ATTENDANCE_PRESENT: 0, // ยกเลิกการแจก EXP จากการเช็คชื่อ
  ATTENDANCE_LATE: 0,    // ยกเลิกการแจก EXP จากการเช็คชื่อ
  SUBMISSION_DEFAULT: 50,
  HIGH_SCORE_BONUS: 20,
};

export interface HatchResult {
  hatched: boolean;
  monster?: {
    id: string;
    name: string;
    species: string;
    rarity: string;
    element: string;
    imageUrl: string;
  };
  eggName: string;
  expGained?: number;
}

/**
 * คำนวณเลเวลจากค่า EXP สะสม (ทุกๆ 50 EXP ขึ้น 1 เลเวล)
 */
export function calculateLevel(exp: number): number {
  return Math.floor(exp / 50) + 1;
}

/**
 * คำนวณระดับรอยร้าวของไข่ (0 = ไม่มีรอย, 1 = รอยเล็กน้อย, 2 = รอยร้าวเปล่งแสง, 3 = พร้อมฟัก)
 */
export function getEggCrackStage(currentExp: number, targetExp: number): {
  stage: number;
  percentage: number;
  label: string;
  statusColor: string;
} {
  const percentage = Math.min(100, Math.round((currentExp / targetExp) * 100));
  if (percentage >= 100) {
    return { stage: 3, percentage, label: "พร้อมฟักแล้ว! 🎉", statusColor: "#10b981" };
  } else if (percentage >= 70) {
    return { stage: 2, percentage, label: "รอยร้าวเปล่งแสงจัด ✨", statusColor: "#f59e0b" };
  } else if (percentage >= 30) {
    return { stage: 1, percentage, label: "เริ่มมีรอยร้าว 🐣", statusColor: "#3b82f6" };
  } else {
    return { stage: 0, percentage, label: "ไข่อบอุ่นกำลังโต 🥚", statusColor: "#6b7280" };
  }
}

/**
 * เพิ่ม EXP ให้นักเรียนและไข่มอนสเตอร์
 */
export async function addStudentExp(
  studentId: string,
  amount: number,
  pointsBonus: number = 0
) {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: { egg: true },
  });

  if (!student) throw new Error("Student not found");

  const newTotalExp = student.exp + amount;
  const newLevel = calculateLevel(newTotalExp);
  const newPoints = student.totalPoints + pointsBonus;

  // อัปเดตข้อมูลนักเรียน
  await prisma.student.update({
    where: { id: studentId },
    data: {
      exp: newTotalExp,
      level: newLevel,
      totalPoints: newPoints,
    },
  });

  // อัปเดตไข่ (ถ้ายังไม่ฟัก)
  if (student.egg && !student.egg.isHatched) {
    const newEggExp = student.egg.currentExp + amount;
    await prisma.studentEgg.update({
      where: { id: student.egg.id },
      data: {
        currentExp: newEggExp,
      },
    });
  }

  return { newTotalExp, newLevel, newPoints };
}

/**
 * สุ่มสายพันธุ์มอนสเตอร์เมื่อฟักไข่ (Gacha Engine)
 */
export async function hatchEgg(studentId: string): Promise<HatchResult> {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: { egg: true },
  });

  if (!student || !student.egg) {
    throw new Error("Student or Egg not found");
  }

  const egg = student.egg;

  // ตรวจสอบว่า EXP ถึงเกณฑ์หรือยัง
  if (egg.currentExp < egg.targetExp && !egg.isHatched) {
    return {
      hatched: false,
      eggName: egg.eggName,
    };
  }

  // หากฟักไปแล้วและมีมอนสเตอร์อยู่แล้ว ให้ดึงข้อมูลเดิม
  if (egg.isHatched && egg.hatchedMonsterId) {
    const existingMonster = await prisma.monster.findUnique({
      where: { id: egg.hatchedMonsterId },
    });
    return {
      hatched: true,
      monster: existingMonster || undefined,
      eggName: egg.eggName,
    };
  }

  // ระบบสุ่มอัตรากาชาตามประเภทไข่
  const rarity = rollRarity(egg.eggType);

  // สุ่มเลือกมอนสเตอร์ตามระดับ Rarity
  let candidateMonsters = await prisma.monster.findMany({
    where: { rarity },
  });

  if (candidateMonsters.length === 0) {
    candidateMonsters = await prisma.monster.findMany();
  }

  const selectedMonster =
    candidateMonsters[Math.floor(Math.random() * candidateMonsters.length)];

  // บันทึกผลการฟัก
  await prisma.studentEgg.update({
    where: { id: egg.id },
    data: {
      isHatched: true,
      hatchedMonsterId: selectedMonster.id,
      eggName: `มอนสเตอร์: ${selectedMonster.name}`,
    },
  });

  // บันทึกเข้าสู่กระเป๋ามอนสเตอร์ของนักเรียน (StudentMonster)
  const existingInBag = await prisma.studentMonster.findFirst({
    where: {
      studentId,
      monsterId: selectedMonster.id,
    },
  });

  if (!existingInBag) {
    await prisma.studentMonster.create({
      data: {
        studentId,
        monsterId: selectedMonster.id,
        level: 1,
        exp: 0,
        isEquipped: true,
      },
    });
  }

  // โบนัสแต้มพิเศษจากการฟักมอนสเตอร์
  const bonusPoints = rarity === "LEGENDARY" ? 100 : rarity === "EPIC" ? 50 : 25;
  await prisma.student.update({
    where: { id: studentId },
    data: {
      totalPoints: { increment: bonusPoints },
    },
  });

  return {
    hatched: true,
    monster: selectedMonster,
    eggName: egg.eggName,
  };
}

/**
 * สุ่ม Rarity ตามความน่าจะเป็น
 */
function rollRarity(eggType: string): string {
  const roll = Math.random() * 100;

  if (eggType === "LEGENDARY") {
    if (roll < 35) return "LEGENDARY";
    if (roll < 80) return "EPIC";
    return "RARE";
  }

  if (eggType === "RARE") {
    if (roll < 8) return "LEGENDARY";
    if (roll < 30) return "EPIC";
    if (roll < 75) return "RARE";
    return "COMMON";
  }

  // NORMAL Egg
  if (roll < 2) return "LEGENDARY";
  if (roll < 12) return "EPIC";
  if (roll < 40) return "RARE";
  return "COMMON";
}
