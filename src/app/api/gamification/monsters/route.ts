import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getPixelArtForMonster } from "@/lib/gamification/pixelMonsters";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const monsters = await prisma.monster.findMany({
      include: {
        _count: {
          select: { studentEggs: true, studentMonsters: true },
        },
      },
      orderBy: { rarity: "desc" },
    });

    return NextResponse.json({ success: true, monsters });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    // ตรวจสอบสิทธิ์: เฉพาะ Super Admin เท่านั้นที่สามารถเพิ่มมอนสเตอร์ได้
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "เฉพาะ Super Admin เท่านั้นที่มีสิทธิ์จัดการคลังมอนสเตอร์" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { name, species, rarity, element, imageUrl, attack, defense, description } = body;

    const finalImageUrl = imageUrl && imageUrl.trim()
      ? imageUrl.trim()
      : getPixelArtForMonster(name, element);

    const monster = await prisma.monster.create({
      data: {
        name: name.trim(),
        species: species.trim(),
        rarity: rarity || "RARE",
        element: element || "FIRE",
        attack: parseInt(attack, 10) || 150,
        defense: parseInt(defense, 10) || 150,
        description: description ? description.trim() : null,
        imageUrl: finalImageUrl,
      },
    });

    return NextResponse.json({ success: true, monster });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

