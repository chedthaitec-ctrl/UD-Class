import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const monsters = await prisma.monster.findMany({
      include: {
        _count: {
          select: { studentEggs: true },
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
    const body = await req.json();
    const { name, species, rarity, element, imageUrl } = body;

    const monster = await prisma.monster.create({
      data: {
        name: name.trim(),
        species: species.trim(),
        rarity,
        element,
        imageUrl: imageUrl || "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=300&auto=format&fit=crop&q=80",
      },
    });

    return NextResponse.json({ success: true, monster });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
