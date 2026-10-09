import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getPixelArtForMonster } from "@/lib/gamification/pixelMonsters";

export const dynamic = "force-dynamic";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "เฉพาะ Super Admin เท่านั้นที่มีสิทธิ์แก้ไขคลังมอนสเตอร์" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { name, species, rarity, element, imageUrl, attack, defense, description } = body;

    const existing = await prisma.monster.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: "Monster not found" }, { status: 404 });
    }

    const updated = await prisma.monster.update({
      where: { id: params.id },
      data: {
        name: name ? name.trim() : existing.name,
        species: species ? species.trim() : existing.species,
        rarity: rarity || existing.rarity,
        element: element || existing.element,
        attack: attack !== undefined ? parseInt(attack, 10) : existing.attack,
        defense: defense !== undefined ? parseInt(defense, 10) : existing.defense,
        description: description !== undefined ? description : existing.description,
        imageUrl: imageUrl && imageUrl.trim() ? imageUrl.trim() : existing.imageUrl || getPixelArtForMonster(name || existing.name, element || existing.element),
      },
    });

    return NextResponse.json({ success: true, monster: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "เฉพาะ Super Admin เท่านั้นที่มีสิทธิ์ลบมอนสเตอร์ในคลัง" },
        { status: 403 }
      );
    }

    await prisma.monster.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
