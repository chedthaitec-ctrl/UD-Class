const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

function makePixelSvg(primaryColor, secondaryColor, eyeColor, bodyType, hornsOrWings) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="128" height="128" shape-rendering="crispEdges">
    <rect width="32" height="32" fill="#0f172a" rx="4"/>
    <g fill="${secondaryColor}">
      ${hornsOrWings === "wings" ? `
        <rect x="3" y="8" width="5" height="2"/>
        <rect x="2" y="10" width="7" height="3"/>
        <rect x="24" y="8" width="5" height="2"/>
        <rect x="23" y="10" width="7" height="3"/>
      ` : hornsOrWings === "horns" ? `
        <rect x="8" y="4" width="3" height="4"/>
        <rect x="21" y="4" width="3" height="4"/>
      ` : ""}
      <rect x="8" y="27" width="16" height="2" opacity="0.3"/>
    </g>
    <g fill="${primaryColor}">
      ${bodyType === "dragon" ? `
        <rect x="12" y="6" width="8" height="5"/>
        <rect x="11" y="11" width="10" height="9"/>
        <rect x="10" y="20" width="12" height="6"/>
        <rect x="8" y="26" width="5" height="3"/>
        <rect x="19" y="26" width="5" height="3"/>
        <rect x="6" y="14" width="5" height="4"/>
        <rect x="21" y="14" width="5" height="4"/>
      ` : bodyType === "wolf" ? `
        <rect x="10" y="5" width="4" height="4"/>
        <rect x="18" y="5" width="4" height="4"/>
        <rect x="9" y="9" width="14" height="7"/>
        <rect x="8" y="16" width="16" height="8"/>
        <rect x="9" y="24" width="4" height="5"/>
        <rect x="19" y="24" width="4" height="5"/>
      ` : bodyType === "bird" ? `
        <rect x="13" y="6" width="6" height="6"/>
        <rect x="11" y="12" width="10" height="9"/>
        <rect x="4" y="10" width="7" height="5"/>
        <rect x="21" y="10" width="7" height="5"/>
        <rect x="12" y="21" width="8" height="5"/>
      ` : bodyType === "serpent" ? `
        <rect x="12" y="5" width="8" height="6"/>
        <rect x="14" y="11" width="6" height="5"/>
        <rect x="10" y="16" width="12" height="4"/>
        <rect x="8" y="20" width="6" height="5"/>
      ` : bodyType === "horse" ? `
        <rect x="8" y="7" width="6" height="6"/>
        <rect x="12" y="11" width="12" height="8"/>
        <rect x="11" y="19" width="13" height="5"/>
        <rect x="11" y="24" width="3" height="5"/>
        <rect x="15" y="24" width="3" height="5"/>
        <rect x="21" y="24" width="3" height="5"/>
      ` : bodyType === "golem" ? `
        <rect x="10" y="6" width="12" height="7"/>
        <rect x="7" y="13" width="18" height="11"/>
        <rect x="9" y="24" width="6" height="5"/>
        <rect x="17" y="24" width="6" height="5"/>
      ` : `
        <rect x="11" y="7" width="10" height="8"/>
        <rect x="9" y="15" width="14" height="9"/>
        <rect x="10" y="24" width="4" height="5"/>
        <rect x="18" y="24" width="4" height="5"/>
      `}
    </g>
    <g fill="${secondaryColor}">
      <rect x="13" y="13" width="6" height="5"/>
    </g>
    <g fill="${eyeColor}">
      <rect x="12" y="8" width="2" height="2"/>
      <rect x="18" y="8" width="2" height="2"/>
    </g>
    <g fill="#ffffff">
      <rect x="12" y="8" width="1" height="1"/>
      <rect x="18" y="8" width="1" height="1"/>
    </g>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const MONSTERS = [
  {
    name: "กริฟฟิน (Griffin)",
    species: "อสูรปักษาสิงโตเวหา",
    rarity: "EPIC",
    element: "WIND",
    attack: 230,
    defense: 190,
    description: "ครึ่งอินทรีครึ่งสิงโต มีปีกสีทองขนาดใหญ่และกรงเล็บคมกริบ ควบคุมกระแสลมเวหา",
    imageUrl: makePixelSvg("#f59e0b", "#d97706", "#38bdf8", "bird", "wings"),
  },
  {
    name: "คิเมรา (Chimera)",
    species: "อสูรสามเศียรเพลิงบรรลัยกัลป์",
    rarity: "EPIC",
    element: "FIRE",
    attack: 250,
    defense: 170,
    description: "สัตว์ร้ายสามเศียรในตำนาน หัวสิงโต ตัวแพะ และหางอสรพิษ พ่นเพลิงนรกแผดเผา",
    imageUrl: makePixelSvg("#dc2626", "#ea580c", "#fde047", "dragon", "horns"),
  },
  {
    name: "บาซิลิสก์ (Basilisk)",
    species: "พญางูอสรพิษเนตรศิลา",
    rarity: "RARE",
    element: "DARK",
    attack: 195,
    defense: 160,
    description: "ราชันแห่งอสรพิษ เกล็ดสีมรกตและดวงตาสีเลือดที่มีพลังสาปศัตรูให้กลายเป็นหิน",
    imageUrl: makePixelSvg("#059669", "#10b981", "#ef4444", "serpent"),
  },
  {
    name: "คิริน (Qilin)",
    species: "กิเลนสายฟ้าศักดิ์สิทธิ์",
    rarity: "LEGENDARY",
    element: "THUNDER",
    attack: 290,
    defense: 270,
    description: "สัตว์เทพศักดิ์สิทธิ์ในตำนาน ร่างกายเปล่งประกายอัสนีสีคราม วิ่งบนเมฆสายฟ้า",
    imageUrl: makePixelSvg("#06b6d4", "#3b82f6", "#fef08a", "horse", "horns"),
  },
  {
    name: "เซนทอร์ (Centaur)",
    species: "นักรบครึ่งคนครึ่งม้าพิทักษ์ไพร",
    rarity: "RARE",
    element: "NATURE",
    attack: 185,
    defense: 175,
    description: "นักรบครึ่งคนครึ่งม้าผู้ชำนาญการยิงธนูและพิทักษ์พงไพรโบราณด้วยความว่องไว",
    imageUrl: makePixelSvg("#15803d", "#84cc16", "#ffffff", "horse"),
  },
  {
    name: "ซีรีน (Siren)",
    species: "ภูตพรายมัจฉาเสียงสะกด",
    rarity: "RARE",
    element: "WATER",
    attack: 175,
    defense: 165,
    description: "ภูตพรายแห่งท้องทะเลลึก เสียงร้องเพลงสะกดจิตสามารถควบคุมคลื่นน้ำ",
    imageUrl: makePixelSvg("#0284c7", "#38bdf8", "#e0e7ff", "serpent"),
  },
  {
    name: "เปกาซัส (Pegasus)",
    species: "อาชาสวรรค์ปีกขาวพิสุทธิ์",
    rarity: "EPIC",
    element: "LIGHT",
    attack: 220,
    defense: 240,
    description: "อาชาสวรรค์ติดปีกขนนกสีขาวบริสุทธิ์ บินท่องนภาเหนือมวลเมฆอย่างสง่างาม",
    imageUrl: makePixelSvg("#f8fafc", "#cbd5e1", "#38bdf8", "horse", "wings"),
  },
  {
    name: "เฟนรีร์ (Fenris Fenrir)",
    species: "พญาหมาป่ารัตติกาลกลืนตะวัน",
    rarity: "LEGENDARY",
    element: "DARK",
    attack: 320,
    defense: 230,
    description: "พญาหมาป่ายักษ์แห่งกลียุค ขนสีเงินประกายน้ำเงินเข้ม ดวงตาสีม่วงอำมหิต",
    imageUrl: makePixelSvg("#475569", "#334155", "#c084fc", "wolf"),
  },
  {
    name: "ราธาลอส (Rathalos)",
    species: "ราชันมังกรเวหาเพลิงกาฬ",
    rarity: "LEGENDARY",
    element: "FIRE",
    attack: 330,
    defense: 260,
    description: "ราชันแห่งท้องนภา มังกรเพลิงเกล็ดสีชาด พ่นลูกไฟมหาประลัย",
    imageUrl: makePixelSvg("#b91c1c", "#ef4444", "#fef08a", "dragon", "wings"),
  },
  {
    name: "เบเฮมอธ (Behemoth)",
    species: "มหาอสูรบรรพกาลพิทักษ์ปฐพี",
    rarity: "LEGENDARY",
    element: "EARTH",
    attack: 300,
    defense: 350,
    description: "ไททันยักษ์โบราณผู้มีพละกำลังดุจขุนเขา ร่างกายเป็นหินผา ควบคุมพลังแผ่นดินไหว",
    imageUrl: makePixelSvg("#78350f", "#b45309", "#f59e0b", "golem", "horns"),
  },
  // Existing 8 updated to Pixel 2D
  {
    name: "ไพโรเดรค (Pyrodrake)",
    species: "มังกรเพลิงสุริยะ",
    rarity: "LEGENDARY",
    element: "FIRE",
    attack: 310,
    defense: 250,
    description: "มังกรเพลิงโบราณ ร่างกายแผ่ความร้อนดั่งดวงอาทิตย์",
    imageUrl: makePixelSvg("#ea580c", "#f97316", "#fef08a", "dragon", "horns"),
  },
  {
    name: "อควาเซอร์เพนต์ (AquaSerpent)",
    species: "พญานาควารีพิสุทธิ์",
    rarity: "EPIC",
    element: "WATER",
    attack: 230,
    defense: 210,
    description: "พญานาควารีแห่งสายธารศักดิ์สิทธิ์ ควบคุมคลื่นน้ำบริสุทธิ์",
    imageUrl: makePixelSvg("#0284c7", "#0ea5e9", "#67e8f9", "serpent"),
  },
  {
    name: "ฟลอร่าสเปราต์ (FloraSprout)",
    species: "ภูตพฤกษาสีทอง",
    rarity: "RARE",
    element: "NATURE",
    attack: 170,
    defense: 180,
    description: "ภูตน้อยแห่งพงไพร ช่วยให้พืชพรรณเจริญเติบโต",
    imageUrl: makePixelSvg("#16a34a", "#22c55e", "#fef08a", "humanoid"),
  },
  {
    name: "ธันเดอร์โวลต์ (ThunderVolt)",
    species: "ฟีนิกซ์สายฟ้าอัสนี",
    rarity: "EPIC",
    element: "LIGHT",
    attack: 260,
    defense: 190,
    description: "นกฟีนิกซ์สายฟ้า สยายปีกประกายแสงอัสนี",
    imageUrl: makePixelSvg("#eab308", "#facc15", "#60a5fa", "bird", "wings"),
  },
  {
    name: "ชาโดว์คิตสึเนะ (ShadowKitsune)",
    species: "จิ้งจอกรัตติกาลเก้าหาง",
    rarity: "RARE",
    element: "DARK",
    attack: 210,
    defense: 160,
    description: "จิ้งจอกเก้าหางแห่งเงามายา รวดเร็วและลึกลับ",
    imageUrl: makePixelSvg("#6b21a8", "#a855f7", "#38bdf8", "wolf"),
  },
  {
    name: "เบลซลิ่ง (Blazeling)",
    species: "ลูกไฟน้อยผู้กล้า",
    rarity: "COMMON",
    element: "FIRE",
    attack: 120,
    defense: 110,
    description: "เปลวไฟจิ๋วผู้ร่าเริง มีความมุ่งมั่นเกินร้อย",
    imageUrl: makePixelSvg("#f97316", "#fb923c", "#fef08a", "humanoid"),
  },
  {
    name: "บับเบิ้ลฮ็อป (BubbleHop)",
    species: "กบฟองสบู่เริงระบำ",
    rarity: "COMMON",
    element: "WATER",
    attack: 110,
    defense: 125,
    description: "กบฟองสบู่ตัวเล็ก กระโดดร่าเริงไปตามลำธาร",
    imageUrl: makePixelSvg("#3b82f6", "#60a5fa", "#ffffff", "beast"),
  },
  {
    name: "โครโนดรากอน (ChronoDragon)",
    species: "มังกรกาลเวลาไร้ขอบเขต",
    rarity: "LEGENDARY",
    element: "LIGHT",
    attack: 340,
    defense: 290,
    description: "มังกรผู้ควบคุมกระแสแห่งกาลเวลาและมิติจักรวาล",
    imageUrl: makePixelSvg("#8b5cf6", "#c084fc", "#fef08a", "dragon", "wings"),
  },
];

async function seed() {
  console.log("👾 Seeding Pixel 2D Monsters...");
  for (const m of MONSTERS) {
    const existing = await prisma.monster.findFirst({
      where: { name: m.name },
    });
    if (existing) {
      await prisma.monster.update({
        where: { id: existing.id },
        data: {
          species: m.species,
          rarity: m.rarity,
          element: m.element,
          attack: m.attack,
          defense: m.defense,
          description: m.description,
          imageUrl: m.imageUrl,
        },
      });
      console.log(`Updated: ${m.name}`);
    } else {
      await prisma.monster.create({
        data: m,
      });
      console.log(`Created: ${m.name}`);
    }
  }
  console.log("✅ Pixel Monsters seeded successfully!");
}

seed()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
