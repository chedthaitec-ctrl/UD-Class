import { FlexMessage } from "@line/bot-sdk";
import { getEggCrackStage } from "@/lib/gamification/engine";

export function createEggStatusFlex(params: {
  studentName: string;
  seatNumber: number;
  level: number;
  totalPoints: number;
  eggName: string;
  eggType: string;
  eggColor: string;
  currentExp: number;
  targetExp: number;
  isHatched: boolean;
  monster?: {
    name: string;
    species: string;
    rarity: string;
    element: string;
    imageUrl: string;
  } | null;
  liffUrl?: string;
}): FlexMessage {
  const {
    studentName,
    seatNumber,
    level,
    totalPoints,
    eggName,
    eggType,
    currentExp,
    targetExp,
    isHatched,
    monster,
    liffUrl,
  } = params;

  const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const monsterPortalUrl = liffUrl || `${appBaseUrl}/liff/monster`;

  // ถ้าฟักแล้ว ให้แสดงการ์ดมอนสเตอร์ที่ฟักออกมา
  if (isHatched && monster) {
    const rarityColor =
      monster.rarity === "LEGENDARY"
        ? "#e11d48"
        : monster.rarity === "EPIC"
        ? "#9333ea"
        : monster.rarity === "RARE"
        ? "#2563eb"
        : "#059669";

    const rarityStars =
      monster.rarity === "LEGENDARY"
        ? "⭐⭐⭐⭐⭐"
        : monster.rarity === "EPIC"
        ? "⭐⭐⭐⭐"
        : monster.rarity === "RARE"
        ? "⭐⭐⭐"
        : "⭐⭐";

    return {
      type: "flex",
      altText: `👾 มอนสเตอร์คู่หูของ ${studentName}: ${monster.name}`,
      contents: {
        type: "bubble",
        size: "giga",
        hero: {
          type: "image",
          url: monster.imageUrl,
          size: "full",
          aspectRatio: "16:9",
          aspectMode: "cover",
        },
        body: {
          type: "box",
          layout: "vertical",
          paddingAll: "20px",
          contents: [
            {
              type: "box",
              layout: "horizontal",
              contents: [
                {
                  type: "text",
                  text: `เลขที่ ${seatNumber} • Lv.${level}`,
                  size: "xs",
                  color: "#6b7280",
                  weight: "bold",
                },
                {
                  type: "text",
                  text: `${rarityStars} ${monster.rarity}`,
                  size: "xs",
                  color: rarityColor,
                  weight: "bold",
                  align: "end",
                },
              ],
            },
            {
              type: "text",
              text: monster.name,
              weight: "bold",
              size: "xl",
              color: "#111827",
              margin: "sm",
            },
            {
              type: "text",
              text: `${monster.species} • ธาตุ ${monster.element}`,
              size: "sm",
              color: "#4b5563",
              margin: "xs",
            },
            {
              type: "separator",
              margin: "lg",
            },
            {
              type: "box",
              layout: "horizontal",
              margin: "md",
              contents: [
                {
                  type: "text",
                  text: "ผู้ฝึกสอน:",
                  size: "xs",
                  color: "#9ca3af",
                },
                {
                  type: "text",
                  text: studentName,
                  size: "xs",
                  color: "#1f2937",
                  weight: "bold",
                  align: "end",
                },
              ],
            },
            {
              type: "box",
              layout: "horizontal",
              margin: "xs",
              contents: [
                {
                  type: "text",
                  text: "คะแนนสะสม:",
                  size: "xs",
                  color: "#9ca3af",
                },
                {
                  type: "text",
                  text: `${totalPoints} แต้ม 🏆`,
                  size: "xs",
                  color: "#d97706",
                  weight: "bold",
                  align: "end",
                },
              ],
            },
          ],
        },
        footer: {
          type: "box",
          layout: "vertical",
          spacing: "sm",
          contents: [
            {
              type: "button",
              style: "primary",
              color: "#7c3aed",
              action: {
                type: "uri",
                label: "🏰 ดูสมุดสะสมมอนสเตอร์ (LIFF)",
                uri: monsterPortalUrl,
              },
            },
          ],
        },
      },
    };
  }

  // หากยังไม่ฟัก แสดงการ์ดสถานะไข่
  const crackInfo = getEggCrackStage(currentExp, targetExp);
  const eggImg =
    crackInfo.stage >= 3
      ? "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=300&auto=format&fit=crop&q=80"
      : crackInfo.stage === 2
      ? "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=300&auto=format&fit=crop&q=80"
      : "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=300&auto=format&fit=crop&q=80";

  return {
    type: "flex",
    altText: `🥚 ไข่มอนสเตอร์ของ ${studentName} (${currentExp}/${targetExp} EXP)`,
    contents: {
      type: "bubble",
      size: "giga",
      header: {
        type: "box",
        layout: "vertical",
        backgroundColor: "#f59e0b",
        paddingAll: "16px",
        contents: [
          {
            type: "box",
            layout: "horizontal",
            contents: [
              {
                type: "text",
                text: `เลขที่ ${seatNumber} ${studentName}`,
                color: "#ffffff",
                weight: "bold",
                size: "sm",
              },
              {
                type: "text",
                text: `Lv.${level}`,
                color: "#fef3c7",
                weight: "bold",
                size: "sm",
                align: "end",
              },
            ],
          },
        ],
      },
      hero: {
        type: "image",
        url: eggImg,
        size: "full",
        aspectRatio: "20:9",
        aspectMode: "cover",
      },
      body: {
        type: "box",
        layout: "vertical",
        paddingAll: "20px",
        spacing: "md",
        contents: [
          {
            type: "box",
            layout: "horizontal",
            contents: [
              {
                type: "text",
                text: eggName,
                weight: "bold",
                size: "md",
                color: "#1f2937",
                flex: 8,
              },
              {
                type: "text",
                text: eggType,
                size: "xs",
                color: "#d97706",
                weight: "bold",
                align: "end",
                flex: 4,
              },
            ],
          },
          {
            type: "text",
            text: `สถานะ: ${crackInfo.label}`,
            size: "sm",
            color: crackInfo.statusColor,
            weight: "bold",
          },
          {
            type: "box",
            layout: "vertical",
            margin: "sm",
            spacing: "xs",
            contents: [
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  {
                    type: "text",
                    text: "ความคืบหน้า EXP:",
                    size: "xs",
                    color: "#6b7280",
                  },
                  {
                    type: "text",
                    text: `${currentExp} / ${targetExp} EXP (${crackInfo.percentage}%)`,
                    size: "xs",
                    color: "#1f2937",
                    weight: "bold",
                    align: "end",
                  },
                ],
              },
              {
                type: "box",
                layout: "vertical",
                backgroundColor: "#e5e7eb",
                height: "8px",
                cornerRadius: "4px",
                contents: [
                  {
                    type: "box",
                    layout: "vertical",
                    backgroundColor: crackInfo.statusColor,
                    width: `${Math.max(5, crackInfo.percentage)}%`,
                    height: "8px",
                    cornerRadius: "4px",
                    contents: [],
                  },
                ],
              },
            ],
          },
          {
            type: "text",
            text: "💡 ทิป: ส่งการบ้านตรงเวลาได้ +50 EXP, เช็คชื่อมาเรียนได้ +15 EXP!",
            size: "xxs",
            color: "#6b7280",
            wrap: true,
          },
        ],
      },
      footer: {
        type: "box",
        layout: "vertical",
        spacing: "sm",
        contents: [
          crackInfo.stage >= 3
            ? {
                type: "button",
                style: "primary",
                color: "#10b981",
                action: {
                  type: "postback",
                  label: "🎉 สุ่มฟักมอนสเตอร์ทันที (Gacha)",
                  data: `action=hatch_egg&studentId=${params.studentName}`,
                  displayText: "🥚 กะเทาะเปลือกไข่ สุ่มมอนสเตอร์!",
                },
              }
            : {
                type: "button",
                style: "primary",
                color: "#f59e0b",
                action: {
                  type: "uri",
                  label: "✨ ดูห้องฟักไข่ (LIFF)",
                  uri: monsterPortalUrl,
                },
              },
        ],
      },
    },
  };
}
