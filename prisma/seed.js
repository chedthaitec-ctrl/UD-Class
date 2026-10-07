const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting seed...");

  // Clean existing data
  await prisma.attendanceRecord.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.submission.deleteMany();
  await prisma.assignment.deleteMany();
  await prisma.studentEgg.deleteMany();
  await prisma.student.deleteMany();
  await prisma.classroom.deleteMany();
  await prisma.teacher.deleteMany();
  await prisma.monster.deleteMany();

  // 1. Create Monsters Bestiary
  console.log("👾 Creating Monsters...");
  const monsters = await Promise.all([
    prisma.monster.create({
      data: {
        name: "ไพโรเดรค (Pyrodrake)",
        species: "มังกรเพลิงสุริยะ",
        rarity: "LEGENDARY",
        element: "FIRE",
        imageUrl: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=300&auto=format&fit=crop&q=80",
      },
    }),
    prisma.monster.create({
      data: {
        name: "อควาเซอร์เพนต์ (AquaSerpent)",
        species: "พญานาควารีพิสุทธิ์",
        rarity: "EPIC",
        element: "WATER",
        imageUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=300&auto=format&fit=crop&q=80",
      },
    }),
    prisma.monster.create({
      data: {
        name: "ฟลอร่าสเปราต์ (FloraSprout)",
        species: "ภูตพฤกษาสีทอง",
        rarity: "RARE",
        element: "NATURE",
        imageUrl: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=300&auto=format&fit=crop&q=80",
      },
    }),
    prisma.monster.create({
      data: {
        name: "ธันเดอร์โวลต์ (ThunderVolt)",
        species: "ฟีนิกซ์สายฟ้าอัสนี",
        rarity: "EPIC",
        element: "LIGHT",
        imageUrl: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=300&auto=format&fit=crop&q=80",
      },
    }),
    prisma.monster.create({
      data: {
        name: "ชาโดว์คิตสึเนะ (ShadowKitsune)",
        species: "จิ้งจอกรัตติกาลเก้าหาง",
        rarity: "RARE",
        element: "DARK",
        imageUrl: "https://images.unsplash.com/photo-1563089145-599997674d42?w=300&auto=format&fit=crop&q=80",
      },
    }),
    prisma.monster.create({
      data: {
        name: "เบลซลิ่ง (Blazeling)",
        species: "ลูกไฟน้อยผู้กล้า",
        rarity: "COMMON",
        element: "FIRE",
        imageUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=300&auto=format&fit=crop&q=80",
      },
    }),
    prisma.monster.create({
      data: {
        name: "บับเบิ้ลฮ็อป (BubbleHop)",
        species: "กบฟองสบู่เริงระบำ",
        rarity: "COMMON",
        element: "WATER",
        imageUrl: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=300&auto=format&fit=crop&q=80",
      },
    }),
    prisma.monster.create({
      data: {
        name: "โครโนดรากอน (ChronoDragon)",
        species: "มังกรกาลเวลาไร้ขอบเขต",
        rarity: "LEGENDARY",
        element: "LIGHT",
        imageUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=300&auto=format&fit=crop&q=80",
      },
    }),
  ]);

  // 2. Create Teacher
  console.log("👨‍🏫 Creating Teacher...");
  const teacher = await prisma.teacher.create({
    data: {
      email: "chedtha.teacher@school.ac.th",
      name: "ครูเชษฐ์ พัฒนาวิชาการ",
    },
  });

  // 3. Create Classrooms
  console.log("🏫 Creating Classrooms...");
  const classroom1 = await prisma.classroom.create({
    data: {
      teacherId: teacher.id,
      name: "วิทยาศาสตร์ ม.3/1 (ฟิสิกส์ & เทคโนโลยี)",
      lineGroupId: "C-sci301-demo-group",
      academicYear: "2569",
      term: "1",
    },
  });

  const classroom2 = await prisma.classroom.create({
    data: {
      teacherId: teacher.id,
      name: "คณิตศาสตร์ ม.3/2 (สถิติและความน่าจะเป็น)",
      lineGroupId: "C-math302-demo-group",
      academicYear: "2569",
      term: "1",
    },
  });

  // 4. Create Students for Classroom 1
  console.log("🎒 Creating Students & Eggs...");
  const studentData = [
    { seat: 1, name: "ด.ช. กิตติศักดิ์ เจริญพร", lineId: "U_student_01", exp: 120, pts: 85, eggExp: 100, hatched: true, monsterIdx: 0, eggType: "LEGENDARY", eggColor: "red" },
    { seat: 2, name: "ด.ช. ชัยวัฒน์ มั่นคง", lineId: "U_student_02", exp: 95, pts: 70, eggExp: 95, hatched: false, monsterIdx: null, eggType: "RARE", eggColor: "blue" },
    { seat: 3, name: "ด.ญ. ณัฐณิชา ศรีสุข", lineId: "U_student_03", exp: 140, pts: 95, eggExp: 100, hatched: true, monsterIdx: 1, eggType: "EPIC", eggColor: "purple" },
    { seat: 4, name: "ด.ญ. ปรียาภรณ์ แสนดี", lineId: "U_student_04", exp: 65, pts: 50, eggExp: 65, hatched: false, monsterIdx: null, eggType: "NORMAL", eggColor: "amber" },
    { seat: 5, name: "ด.ช. ภัทรพล สุวรรณโชติ", lineId: "U_student_05", exp: 80, pts: 60, eggExp: 80, hatched: false, monsterIdx: null, eggType: "RARE", eggColor: "emerald" },
    { seat: 6, name: "ด.ญ. รินรดา พงษ์ศิริ", lineId: "U_student_06", exp: 110, pts: 90, eggExp: 100, hatched: true, monsterIdx: 2, eggType: "RARE", eggColor: "amber" },
    { seat: 7, name: "ด.ช. วรเมธ แก้วมณี", lineId: null, exp: 30, pts: 20, eggExp: 30, hatched: false, monsterIdx: null, eggType: "NORMAL", eggColor: "amber" },
    { seat: 8, name: "ด.ญ. อริสา บุญส่ง", lineId: null, exp: 45, pts: 35, eggExp: 45, hatched: false, monsterIdx: null, eggType: "NORMAL", eggColor: "blue" },
  ];

  const students = [];
  for (const s of studentData) {
    const student = await prisma.student.create({
      data: {
        classroomId: classroom1.id,
        seatNumber: s.seat,
        name: s.name,
        lineUserId: s.lineId,
        avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(s.name)}`,
        totalPoints: s.pts,
        exp: s.exp,
        level: Math.floor(s.exp / 50) + 1,
        egg: {
          create: {
            eggName: s.hatched ? "ฟักเป็นมอนสเตอร์แล้ว!" : `ไข่สายฟ้าเกรด ${s.eggType}`,
            eggType: s.eggType,
            eggColor: s.eggColor,
            currentExp: s.eggExp,
            targetExp: 100,
            isHatched: s.hatched,
            hatchedMonsterId: s.hatched && s.monsterIdx !== null ? monsters[s.monsterIdx].id : null,
          },
        },
      },
    });
    students.push(student);
  }

  // 5. Create Assignments
  console.log("📝 Creating Assignments...");
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(23, 59, 0, 0);

  const in3Days = new Date();
  in3Days.setDate(in3Days.getDate() + 3);
  in3Days.setHours(17, 0, 0, 0);

  const pastDate = new Date();
  pastDate.setDate(pastDate.getDate() - 3);

  const assignment1 = await prisma.assignment.create({
    data: {
      classroomId: classroom1.id,
      title: "ใบงานที่ 1: การสำรวจแรงโน้มถ่วงและการเคลื่อนที่",
      description: "ให้นักเรียนทำการทดลองปล่อยวัตถุต่างมวล บันทึกคลิปวิดีโอสั้นหรือสรุปตารางผลการทดลองลงใน Google Drive หรือเอกสาร PDF",
      dueDate: tomorrow,
      maxScore: 100,
      expReward: 50,
    },
  });

  const assignment2 = await prisma.assignment.create({
    data: {
      classroomId: classroom1.id,
      title: "แบบจำลองระบบสุริยะและการโคจรของดาวเคราะห์",
      description: "วาดภาพหรือสร้างโมเดล 3D จำลองดาวเคราะห์ 8 ดวง พร้อมอธิบายระยะห่างและคาบการโคจร",
      dueDate: in3Days,
      maxScore: 100,
      expReward: 60,
    },
  });

  const assignment3 = await prisma.assignment.create({
    data: {
      classroomId: classroom1.id,
      title: "สรุปบทเรียน: กฎการอนุรักษ์พลังงาน",
      description: "เขียน Mind Map สรุปพลังงานจลน์และพลังงานศักย์โน้มถ่วง",
      dueDate: pastDate,
      maxScore: 50,
      expReward: 30,
    },
  });

  // 6. Submissions
  console.log("📬 Creating Submissions...");
  // Student 1, 3, 6 submitted Assignment 1
  await prisma.submission.create({
    data: {
      assignmentId: assignment1.id,
      studentId: students[0].id,
      content: "https://drive.google.com/file/d/sample-kittisak-lab1/view",
      status: "GRADED",
      score: 95,
      submittedAt: new Date(),
    },
  });

  await prisma.submission.create({
    data: {
      assignmentId: assignment1.id,
      studentId: students[2].id,
      content: "https://drive.google.com/file/d/sample-natnicha-lab1/view",
      status: "SUBMITTED",
      submittedAt: new Date(),
    },
  });

  await prisma.submission.create({
    data: {
      assignmentId: assignment1.id,
      studentId: students[5].id,
      content: "แนบรายงานสรุปการทดลอง พร้อมตารางเวลาตกของวัตถุ",
      status: "SUBMITTED",
      submittedAt: new Date(),
    },
  });

  // 7. Attendance Records
  console.log("📋 Creating Attendance Records...");
  const attendanceToday = await prisma.attendance.create({
    data: {
      classroomId: classroom1.id,
      date: new Date(),
      records: {
        create: [
          { studentId: students[0].id, status: "PRESENT" },
          { studentId: students[1].id, status: "PRESENT" },
          { studentId: students[2].id, status: "PRESENT" },
          { studentId: students[3].id, status: "LATE" },
          { studentId: students[4].id, status: "PRESENT" },
          { studentId: students[5].id, status: "PRESENT" },
          { studentId: students[6].id, status: "ABSENT" },
          { studentId: students[7].id, status: "LEAVE" },
        ],
      },
    },
  });

  console.log("✅ Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
