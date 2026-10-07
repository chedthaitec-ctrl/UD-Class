import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      classroomId,
      mode = "append", // "append" หรือ "replace"
      defaultEggType = "NORMAL",
      students,
    } = body;

    if (!classroomId || !Array.isArray(students) || students.length === 0) {
      return NextResponse.json(
        { success: false, error: "ข้อมูลนักเรียนไม่ถูกต้องหรือไม่พบ classroomId" },
        { status: 400 }
      );
    }

    const classroom = await prisma.classroom.findUnique({
      where: { id: classroomId },
    });

    if (!classroom) {
      return NextResponse.json(
        { success: false, error: "ไม่พบห้องเรียนที่ระบุ" },
        { status: 404 }
      );
    }

    const eggColorMap: Record<string, string> = {
      NORMAL: "amber",
      RARE: "blue",
      LEGENDARY: "red",
    };

    // ดำเนินการใน Transaction
    const result = await prisma.$transaction(async (tx) => {
      // หากเลือกโหมด "แทนที่ทั้งหมด" (Replace) ให้ลบนักเรียนเดิมในห้องนี้ก่อน
      if (mode === "replace") {
        const existingStudents = await tx.student.findMany({
          where: { classroomId },
          select: { id: true },
        });
        const existingIds = existingStudents.map((s) => s.id);

        if (existingIds.length > 0) {
          await tx.studentEgg.deleteMany({
            where: { studentId: { in: existingIds } },
          });
          await tx.submission.deleteMany({
            where: { studentId: { in: existingIds } },
          });
          await tx.attendanceRecord.deleteMany({
            where: { studentId: { in: existingIds } },
          });
          await tx.student.deleteMany({
            where: { classroomId },
          });
        }
      }

      let importedCount = 0;

      for (const item of students) {
        const seatNumber = parseInt(item.seatNumber, 10);
        const name = (item.name || "").trim();
        const lineUserId = item.lineUserId ? item.lineUserId.trim() : null;

        if (isNaN(seatNumber) || !name) continue;

        // ในโหมด append ตรวจสอบว่ามีเลขที่นี้อยู่แล้วหรือไม่
        if (mode === "append") {
          const existing = await tx.student.findFirst({
            where: { classroomId, seatNumber },
          });

          if (existing) {
            // อัปเดตชื่อ
            await tx.student.update({
              where: { id: existing.id },
              data: {
                name,
                lineUserId: lineUserId || existing.lineUserId,
              },
            });
            importedCount++;
            continue;
          }
        }

        // สร้างนักเรียนใหม่พร้อมไข่มอนสเตอร์
        await tx.student.create({
          data: {
            classroomId,
            seatNumber,
            name,
            lineUserId,
            avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name)}`,
            egg: {
              create: {
                eggName: `ไข่มอนสเตอร์เริ่มต้น (เกรด ${defaultEggType})`,
                eggType: defaultEggType,
                eggColor: eggColorMap[defaultEggType] || "amber",
                currentExp: 0,
                targetExp: 100,
                isHatched: false,
              },
            },
          },
        });

        importedCount++;
      }

      return importedCount;
    });

    return NextResponse.json({
      success: true,
      importedCount: result,
      message: `นำเข้าข้อมูลนักเรียนสำเร็จ ${result} คน`,
    });
  } catch (error: any) {
    console.error("Student Import Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
