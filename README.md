# 🎯 UD-Class System
> **ระบบจัดการชั้นเรียน บ็อตทวงงาน เช็คชื่อ และ Gamification ไข่มอนสเตอร์**  
> พัฒนาด้วย Next.js (App Router), TypeScript, Tailwind CSS, Prisma ORM, และ LINE Messaging API / Flex Message

---

## 🌟 จุดเด่นและฟีเจอร์หลัก (Key Features)

### 1. 📱 Frontend & LINE Interface (3-Tier Architecture)
- **LINE Messaging API & Webhook Dispatcher**:
  - ตรวจจับอีเวนต์เมื่อดึงบ็อตเข้ากลุ่ม LINE (`join` event) เพื่ออ่าน `groupId` และแนะนำขั้นตอนการผูกห้องเรียน
  - การ์ดตอบกลับแบบ **LINE Flex Message** ดีไซน์พรีเมียม:
    - 📝 **การ์ดมอบหมายงาน (Assignment Flex)**: แสดงชื่อวิชา กำหนดส่ง หลอดความคืบหน้าคนส่ง และปุ่มกดส่งงาน
    - 🚨 **การ์ดทวงงาน (Homework Reminder Flex)**: ระบุรายชื่อนักเรียนที่ยังค้างส่งงานแบบ Real-time พร้อมปุ่มส่งด่วน
    - 📋 **ใบเช็คชื่อประจำวัน (Attendance Flex)**: สรุปยอด มาเรียน, มาสาย, ขาด, ลา พร้อมแจ้งยอด EXP ที่แจก
    - 🥚 **การ์ดสถานะไข่มอนสเตอร์ (Egg Status Flex)**: แสดงระดับรอยร้าวของไข่ และแสดงการ์ดมอนสเตอร์ที่ฟักแล้วพร้อมระดับความหายาก (Rarity)
  - **LINE Front-end Framework (LIFF)**:
    - `/liff/submit`: หน้าต่างส่งการบ้าน แนบลิงก์ Google Drive หรือข้อความ พร้อมเอฟเฟกต์เฉลิมฉลองรับ +50 EXP
    - `/liff/monster`: ห้องฟักไข่มอนสเตอร์ (Incubator) แสดงแอนิเมชันรอยร้าว และปุ่มกดสุ่มฟักมอนสเตอร์ (Gacha)

### 2. 🤖 Live LINE Bot Simulator (ห้องจำลองบ็อตบนเบราว์เซอร์)
- ทดสอบการทำงานของบ็อตได้ทันทีที่ `/simulator` โดยไม่ต้องเปิด ngrok หรือตั้งค่า LINE Token จริง
- สลับบริบทระหว่าง **"กลุ่ม LINE"** และ **"แชทเดี่ยว (DM)"**
- สลับบทบาทผู้ส่งได้ระหว่าง นักเรียนเลขที่ต่างๆ หรือ คุณครู
- รองรับการคลิกปุ่ม Action และ Postback เสมือนใช้งานบนแอปพลิเคชัน LINE จริง 100%

### 3. 🎮 Gamification & Gacha Engine
- **สูตรคำนวณ EXP**:
  - มาเรียนตรงเวลา: `+15 EXP` (+5 แต้ม)
  - มาเรียนสาย: `+5 EXP` (+2 แต้ม)
  - ส่งงานตรงเวลา: `+50 EXP` (+10 แต้ม)
  - ได้คะแนนงานยอดเยี่ยม (>=80%): โบนัส `+20 EXP` (+20 แต้ม)
- **ระบบไข่และรอยร้าว**:
  - `0 - 29%`: ไข่สมบูรณ์ (Intact Egg)
  - `30 - 69%`: เริ่มมีรอยร้าว (Slight Crack)
  - `70 - 99%`: รอยร้าวเปล่งแสงประกาย (Heavily Cracked)
  - `100%`: พร้อมฟักเป็นมอนสเตอร์ (Ready to Hatch!)
- **อัตราสุ่มตู้กาชา (Gacha Drop Rates)**:
  - ไข่ธรรมดา (NORMAL): Common (65%), Rare (25%), Epic (8%), Legendary (2%)
  - ไข่หายาก (RARE): Common (30%), Rare (45%), Epic (20%), Legendary (5%)
  - ไข่ในตำนาน (LEGENDARY): Rare (20%), Epic (50%), Legendary (30%)

### 4. ⏰ Automated Cron / Scheduler
- `/api/cron/reminders`: ระบบทวงการบ้านล่วงหน้าก่อนครบกำหนด (ภายใน 48 ชั่วโมง) พร้อมส่ง Flex Message เข้ากลุ่ม
- `/api/cron/attendance`: ระบบสรุปสถิติการมาเรียนประจำวัน ส่งเข้ากลุ่ม LINE

---

## 🗄️ โครงสร้างฐานข้อมูล (Database Schema)

จัดการผ่าน **Prisma ORM** (Default: SQLite ใช้งานได้ทันที / รองรับสลับเป็น PostgreSQL หรือ Supabase ผ่าน `.env`):
- `Teacher`: ข้อมูลคุณครูผู้ดูแล
- `Classroom`: ห้องเรียน ผูกกับ `lineGroupId`
- `Student`: ข้อมูลนักเรียน, เลขที่, EXP, เลเวล, แต้มคะแนนสะสม, และ `lineUserId`
- `Assignment`: รายการการบ้าน, กำหนดส่ง, คะแนนเต็ม, และ EXP รางวัล
- `Submission`: การส่งงาน ลิงก์แนบงาน สถานะ และคะแนนการตรวจ
- `Attendance` & `AttendanceRecord`: บันทึกการเช็คชื่อ มาเรียน, มาสาย, ขาด, ลา
- `StudentEgg`: ไข่มอนสเตอร์ประจำตัวนักเรียน ความคืบหน้า EXP และสถานะการฟัก
- `Monster`: คลังสายพันธุ์มอนสเตอร์ Rarity (COMMON, RARE, EPIC, LEGENDARY) และธาตุ (FIRE, WATER, NATURE, LIGHT, DARK)

---

## 🚀 วิธีการติดตั้งและรันระบบ (Getting Started)

### 1. ติดตั้ง Dependencies
```bash
npm install
```

### 2. ตั้งค่าฐานข้อมูล (Prisma)
```bash
# Push โครงสร้างลงฐานข้อมูล SQLite (dev.db)
npx prisma db push

# รัน Seed ข้อมูลจำลอง (ครู, ห้องเรียน, นักเรียน 8 คน, มอนสเตอร์ 8 ตัว, การบ้าน, การเช็คชื่อ)
node prisma/seed.js
```

### 3. รันโปรเจกต์ในโหมด Development
```bash
npm run dev
```
เปิดเบราว์เซอร์ไปที่: [http://localhost:3000](http://localhost:3000)

---

## 💬 รายการคำสั่งของ LINE Bot (Bot Commands)

| คำสั่ง | คำอธิบาย |
|---|---|
| `#การบ้าน` | แสดงรายการการบ้านทั้งหมดที่มอบหมาย พร้อมเปอร์เซ็นต์คนส่งและปุ่มส่งงาน (LIFF) |
| `#ไข่` หรือ `#มอนสเตอร์` | ตรวจสอบสถานะไข่ หลอด EXP และการ์ดมอนสเตอร์ที่ฟักแล้ว |
| `#ลงทะเบียน [เลขที่]` | ผูกบัญชี LINE กับเลขที่นักเรียน (เช่น `#ลงทะเบียน 3`) รับโบนัสต้อนรับ `+20 EXP` |
| `#สมาชิก` | แสดงรายชื่อเพื่อนในห้อง เลเวล แต้มสะสม และสถานะการผูกไลน์ |
| `#ทวงงาน` | (สำหรับครู) สรุปรายชื่อนักเรียนที่ยังไม่ส่งการบ้านเข้ากลุ่ม LINE |
| `#เช็คชื่อ` | แสดงสรุปการเช็คชื่อเข้าชั้นเรียนประจำวัน |
| `#กลุ่ม` | ตรวจสอบข้อมูลห้องเรียนและดู LINE Group ID ประจำกลุ่ม |

---

## 📁 โครงสร้างโปรเจกต์ (Project Structure)

```
ud-class-system/
├── prisma/
│   ├── schema.prisma               # Prisma Schema ครอบคลุม 9 Data Models
│   └── seed.js                     # Mock data: ครู, ห้อง ม.3/1, นักเรียน, มอนสเตอร์
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── line/
│   │   │   │   ├── webhook/route.ts        # LINE Webhook (Signature verification & Dispatcher)
│   │   │   │   └── test-simulate/route.ts  # LINE Bot Simulator API
│   │   │   ├── classrooms/route.ts         # Classrooms CRUD
│   │   │   ├── classrooms/[id]/route.ts    # Single Classroom API
│   │   │   ├── classrooms/[id]/broadcast/route.ts # Broadcast เข้ากลุ่ม LINE
│   │   │   ├── students/route.ts           # Students API & Egg creator
│   │   │   ├── assignments/route.ts        # Assignments & LINE broadcast
│   │   │   ├── assignments/[id]/route.ts   # Submissions & Grading
│   │   │   ├── attendance/route.ts         # Roll-call & +15 EXP auto-award
│   │   │   ├── cron/reminders/route.ts     # Homework Chaser Cron
│   │   │   ├── cron/attendance/route.ts    # Daily Attendance Summary Cron
│   │   │   └── gamification/
│   │   │       ├── hatch/route.ts          # Gacha Hatching API
│   │   │       ├── add-exp/route.ts        # Bonus EXP API
│   │   │       └── monsters/route.ts       # Monster Catalog API
│   │   ├── classrooms/page.tsx             # หน้าจัดการห้องเรียนทั้งหมด
│   │   ├── classrooms/[id]/
│   │   │   ├── page.tsx                    # หน้าภาพรวมห้องเรียน
│   │   │   ├── students/page.tsx           # หน้ารายชื่อนักเรียน & สถานะไข่
│   │   │   ├── assignments/page.tsx        # หน้าการบ้าน & ตรวจงาน & ทวงงาน
│   │   │   ├── attendance/page.tsx         # หน้าเช็คชื่อ & แจก EXP
│   │   │   └── monsters/page.tsx           # หน้าห้องฟักไข่ & Gacha สุ่มมอนสเตอร์
│   │   ├── monsters/page.tsx               # หน้าสารานุกรมมอนสเตอร์ (Bestiary)
│   │   ├── simulator/page.tsx              # หน้าจำลอง LINE Bot Live Simulator
│   │   ├── liff/
│   │   │   ├── submit/page.tsx             # LIFF: พอร์ทัลส่งการบ้านของนักเรียน
│   │   │   └── monster/page.tsx            # LIFF: พอร์ทัลส่องไข่ & ฟักมอนสเตอร์
│   │   ├── settings/page.tsx               # หน้าตั้งค่า LINE Token & Cron
│   │   ├── layout.tsx                      # Root Layout & Sidebar Menu
│   │   └── page.tsx                        # แดชบอร์ดภาพรวมคุณครู
│   └── lib/
│       ├── prisma.ts                       # Prisma Singleton Client
│       ├── gamification/
│       │   └── engine.ts                   # กฎคำนวณ EXP, ระดับรอยร้าว และระบบสุ่มกาชา
│       └── line/
│           ├── client.ts                   # LINE Messaging API Client (Reply / Push)
│           ├── dispatcher.ts               # Webhook Event Dispatcher
│           └── flex/
│               ├── assignmentFlex.ts       # การ์ดมอบหมายงาน Flex
│               ├── reminderFlex.ts         # การ์ดทวงงานคนค้างส่ง Flex
│               ├── attendanceFlex.ts       # ใบเช็คชื่อประจำวัน Flex
│               ├── eggStatusFlex.ts        # การ์ดสถานะไข่ & มอนสเตอร์ Flex
│               └── welcomeFlex.ts          # การ์ดต้อนรับเข้ากลุ่ม LINE Flex
```

---

## 🔒 การเชื่อมต่อกับ LINE Developers จริง
1. สร้าง Provider และ **Messaging API Channel** บน [LINE Developers Console](https://developers.line.biz/)
2. คัดลอก **Channel Access Token (Long-lived)** และ **Channel Secret** มาใส่ในไฟล์ `.env`
3. รัน ngrok เพื่อส่งต่อ Webhook: `ngrok http 3000`
4. นำ Webhook URL (เช่น `https://xxxx.ngrok-free.app/api/line/webhook`) ไปบันทึกใน LINE Developers Console พร้อมเปิดใช้ **Use Webhook**
5. ดึงบ็อตเข้ากลุ่ม LINE แล้วพิมพ์ `#กลุ่ม` เพื่อเชื่อมต่อห้องเรียน
