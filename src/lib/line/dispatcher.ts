import { prisma } from "../prisma";
import { createAssignmentFlex } from "./flex/assignmentFlex";
import { createReminderFlex } from "./flex/reminderFlex";
import { createAttendanceFlex } from "./flex/attendanceFlex";
import { createEggStatusFlex } from "./flex/eggStatusFlex";
import { createWelcomeGroupFlex } from "./flex/welcomeFlex";
import { hatchEgg, addStudentExp } from "../gamification/engine";

export interface DispatchResult {
  replyMessages: any[];
  pushGroupId?: string;
  actionTaken?: string;
}

export async function dispatchLineEvent(event: any): Promise<DispatchResult> {
  const replyMessages: any[] = [];

  // 1. Join Event (บ็อตถูกเชิญเข้ากลุ่ม LINE)
  if (event.type === "join") {
    const groupId = event.source?.groupId;
    if (groupId) {
      // ค้นหาว่ากลุ่มนี้เคยผูกกับห้องเรียนใดไว้หรือไม่
      const classroom = await prisma.classroom.findUnique({
        where: { lineGroupId: groupId },
      });

      replyMessages.push(
        createWelcomeGroupFlex({
          groupId,
          classroomName: classroom?.name,
          isPaired: !!classroom,
        })
      );

      return {
        replyMessages,
        pushGroupId: groupId,
        actionTaken: "JOIN_EVENT_PROCESSED",
      };
    }
  }

  // 2. Message Event (ข้อความคำสั่งจากผู้ใช้หรือกลุ่ม)
  if (event.type === "message" && event.message?.type === "text") {
    const rawText = (event.message.text || "").trim();
    const groupId = event.source?.groupId;
    const userId = event.source?.userId;

    // คำสั่ง: #กลุ่ม
    if (rawText.startsWith("#กลุ่ม")) {
      if (!groupId) {
        replyMessages.push({
          type: "text",
          text: `ℹ️ คำสั่งนี้สำหรับกลุ่ม LINE เท่านั้นครับ\nUser ID ของคุณคือ: ${userId}`,
        });
      } else {
        const classroom = await prisma.classroom.findUnique({
          where: { lineGroupId: groupId },
          include: {
            students: true,
            teacher: true,
          },
        });

        if (classroom) {
          replyMessages.push({
            type: "text",
            text: `🏫 ข้อมูลห้องเรียนที่เชื่อมต่อ\n━━━━━━━━━━━━━━━\n• ชื่อห้อง: ${classroom.name}\n• ครูผู้สอน: ${classroom.teacher.name}\n• ปีการศึกษา: ${classroom.academicYear} เทอม ${classroom.term}\n• จำนวนนักเรียน: ${classroom.students.length} คน\n• Line Group ID: ${groupId}\n━━━━━━━━━━━━━━━\n💡 พิมพ์ #การบ้าน หรือ #ไข่ เพื่อเริ่มใช้งาน`,
          });
        } else {
          replyMessages.push(
            createWelcomeGroupFlex({
              groupId,
              isPaired: false,
            })
          );
        }
      }
      return { replyMessages };
    }

    // คำสั่ง: #ลงทะเบียน [เลขที่]
    if (rawText.startsWith("#ลงทะเบียน")) {
      const parts = rawText.split(/\s+/);
      const seatNumberStr = parts[1];

      // ค้นหาห้องเรียนจาก Group ID หรือห้องเรียนแรกสุดในระบบ
      let classroom = null;
      if (groupId) {
        classroom = await prisma.classroom.findUnique({
          where: { lineGroupId: groupId },
          include: { students: true },
        });
      }

      if (!classroom) {
        classroom = await prisma.classroom.findFirst({
          include: { students: true },
        });
      }

      if (!classroom) {
        replyMessages.push({
          type: "text",
          text: "❌ ยังไม่พบห้องเรียนในระบบ กรุณาให้คุณครูสร้างห้องเรียนในแดชบอร์ดก่อนครับ",
        });
        return { replyMessages };
      }

      if (!seatNumberStr) {
        replyMessages.push({
          type: "text",
          text: `📝 รูปแบบการลงทะเบียน:\nพิมพ์: #ลงทะเบียน [เลขที่]\nตัวอย่าง: #ลงทะเบียน 3\n\n📌 ห้องเรียนปัจจุบัน: ${classroom.name}\n(มีนักเรียนเลขที่ 1 - ${classroom.students.length})`,
        });
        return { replyMessages };
      }

      const seatNumber = parseInt(seatNumberStr, 10);
      if (isNaN(seatNumber)) {
        replyMessages.push({
          type: "text",
          text: "❌ กรุณาระบุเลขที่ให้ถูกต้อง เช่น #ลงทะเบียน 5",
        });
        return { replyMessages };
      }

      const student = await prisma.student.findFirst({
        where: {
          classroomId: classroom.id,
          seatNumber,
        },
        include: { egg: true },
      });

      if (!student) {
        replyMessages.push({
          type: "text",
          text: `❌ ไม่พบข้อมูลนักเรียนเลขที่ ${seatNumber} ในห้อง ${classroom.name}`,
        });
        return { replyMessages };
      }

      // บันทึก Line User ID ให้กับนักเรียน
      const updatedStudent = await prisma.student.update({
        where: { id: student.id },
        data: {
          lineUserId: userId || `U_${student.seatNumber}_${Date.now()}`,
        },
        include: { egg: { include: { hatchedMonster: true } } },
      });

      // แจก EXP ต้อนรับการลงทะเบียน +20 EXP
      await addStudentExp(updatedStudent.id, 20, 10);

      replyMessages.push({
        type: "text",
        text: `🎉 ลงทะเบียนสำเร็จ!\nยินดีต้อนรับ ${updatedStudent.name} (เลขที่ ${updatedStudent.seatNumber})\nผูกบัญชีกับห้อง ${classroom.name} เรียบร้อยแล้ว\n🌟 รับโบนัสต้อนรับ +20 EXP!`,
      });

      // ส่งการ์ดไข่มอนสเตอร์ตามไป
      if (updatedStudent.egg) {
        replyMessages.push(
          createEggStatusFlex({
            studentName: updatedStudent.name,
            seatNumber: updatedStudent.seatNumber,
            level: updatedStudent.level,
            totalPoints: updatedStudent.totalPoints,
            eggName: updatedStudent.egg.eggName,
            eggType: updatedStudent.egg.eggType,
            eggColor: updatedStudent.egg.eggColor,
            currentExp: updatedStudent.egg.currentExp,
            targetExp: updatedStudent.egg.targetExp,
            isHatched: updatedStudent.egg.isHatched,
            monster: updatedStudent.egg.hatchedMonster,
          })
        );
      }

      return { replyMessages };
    }

    // คำสั่ง: #การบ้าน
    if (rawText.startsWith("#การบ้าน")) {
      let classroom = null;
      if (groupId) {
        classroom = await prisma.classroom.findUnique({
          where: { lineGroupId: groupId },
        });
      }
      if (!classroom) {
        classroom = await prisma.classroom.findFirst();
      }

      if (!classroom) {
        replyMessages.push({
          type: "text",
          text: "❌ ยังไม่มีข้อมูลห้องเรียนในระบบ",
        });
        return { replyMessages };
      }

      const assignments = await prisma.assignment.findMany({
        where: { classroomId: classroom.id },
        include: {
          submissions: true,
          classroom: { include: { students: true } },
        },
        orderBy: { dueDate: "asc" },
        take: 3,
      });

      if (assignments.length === 0) {
        replyMessages.push({
          type: "text",
          text: `🎉 ยอดเยี่ยมมาก! ขณะนี้ห้อง ${classroom.name} ไม่มีการบ้านค้างส่งครับ`,
        });
        return { replyMessages };
      }

      for (const assignment of assignments) {
        replyMessages.push(
          createAssignmentFlex({
            assignmentId: assignment.id,
            title: assignment.title,
            description: assignment.description,
            dueDate: assignment.dueDate,
            expReward: assignment.expReward,
            maxScore: assignment.maxScore,
            submittedCount: assignment.submissions.length,
            totalStudents: assignment.classroom.students.length,
          })
        );
      }

      return { replyMessages };
    }

    // คำสั่ง: #ไข่ หรือ #มอนสเตอร์
    if (rawText.startsWith("#ไข่") || rawText.startsWith("#มอนสเตอร์")) {
      let student = null;
      if (userId) {
        student = await prisma.student.findFirst({
          where: { lineUserId: userId },
          include: { egg: { include: { hatchedMonster: true } } },
        });
      }

      // ถ้าไม่พบจาก userId ให้ลองสุ่มตัวอย่างนักเรียนในห้องเพื่อแสดงเป็นตัวอย่าง
      if (!student) {
        student = await prisma.student.findFirst({
          include: { egg: { include: { hatchedMonster: true } } },
        });
      }

      if (!student || !student.egg) {
        replyMessages.push({
          type: "text",
          text: "🐣 คุณยังไม่ได้ลงทะเบียนผูกบัญชี!\nกรุณาพิมพ์: #ลงทะเบียน [เลขที่]\nตัวอย่าง: #ลงทะเบียน 2",
        });
        return { replyMessages };
      }

      replyMessages.push(
        createEggStatusFlex({
          studentName: student.name,
          seatNumber: student.seatNumber,
          level: student.level,
          totalPoints: student.totalPoints,
          eggName: student.egg.eggName,
          eggType: student.egg.eggType,
          eggColor: student.egg.eggColor,
          currentExp: student.egg.currentExp,
          targetExp: student.egg.targetExp,
          isHatched: student.egg.isHatched,
          monster: student.egg.hatchedMonster,
        })
      );

      return { replyMessages };
    }

    // คำสั่ง: #สมาชิก
    if (rawText.startsWith("#สมาชิก")) {
      let classroom = null;
      if (groupId) {
        classroom = await prisma.classroom.findUnique({
          where: { lineGroupId: groupId },
          include: {
            students: {
              include: { egg: { include: { hatchedMonster: true } } },
              orderBy: { seatNumber: "asc" },
            },
          },
        });
      }
      if (!classroom) {
        classroom = await prisma.classroom.findFirst({
          include: {
            students: {
              include: { egg: { include: { hatchedMonster: true } } },
              orderBy: { seatNumber: "asc" },
            },
          },
        });
      }

      if (!classroom) {
        replyMessages.push({
          type: "text",
          text: "❌ ยังไม่มีข้อมูลห้องเรียนในระบบ",
        });
        return { replyMessages };
      }

      const rosterText = classroom.students
        .map((s) => {
          const eggStatus = s.egg?.isHatched
            ? `👾 [${s.egg.hatchedMonster?.name || "ฟักแล้ว"}]`
            : `🥚 (${s.egg?.currentExp || 0}/100 EXP)`;
          const lineIcon = s.lineUserId ? "🟢" : "⚪";
          return `${lineIcon} เลขที่ ${s.seatNumber} ${s.name} • Lv.${s.level} (${s.totalPoints}แต้ม) ${eggStatus}`;
        })
        .join("\n");

      replyMessages.push({
        type: "text",
        text: `🎒 สมาชิกห้อง: ${classroom.name}\n(🟢 ผูกไลน์แล้ว / ⚪ ยังไม่ผูกไลน์)\n━━━━━━━━━━━━━━━\n${rosterText}\n━━━━━━━━━━━━━━━\nรวมทั้งสิ้น: ${classroom.students.length} คน`,
      });

      return { replyMessages };
    }

    // คำสั่ง: #ทวงงาน
    if (rawText.startsWith("#ทวงงาน")) {
      let classroom = null;
      if (groupId) {
        classroom = await prisma.classroom.findUnique({
          where: { lineGroupId: groupId },
          include: { students: true },
        });
      }
      if (!classroom) {
        classroom = await prisma.classroom.findFirst({
          include: { students: true },
        });
      }

      if (!classroom) {
        replyMessages.push({
          type: "text",
          text: "❌ ยังไม่มีข้อมูลห้องเรียนในระบบ",
        });
        return { replyMessages };
      }

      // หาการบ้านที่ใกล้ครบกำหนดที่สุด
      const latestAssignment = await prisma.assignment.findFirst({
        where: { classroomId: classroom.id },
        include: {
          submissions: true,
        },
        orderBy: { dueDate: "asc" },
      });

      if (!latestAssignment) {
        replyMessages.push({
          type: "text",
          text: "ℹ️ ขณะนี้ยังไม่มีรายการการบ้านในห้องเรียนครับ",
        });
        return { replyMessages };
      }

      const submittedStudentIds = new Set(
        latestAssignment.submissions.map((sub) => sub.studentId)
      );
      const unsubmittedStudents = classroom.students.filter(
        (s) => !submittedStudentIds.has(s.id)
      );

      replyMessages.push(
        createReminderFlex({
          assignmentId: latestAssignment.id,
          title: latestAssignment.title,
          dueDate: latestAssignment.dueDate,
          unsubmittedStudents: unsubmittedStudents.map((s) => ({
            seatNumber: s.seatNumber,
            name: s.name,
          })),
          expReward: latestAssignment.expReward,
        })
      );

      return { replyMessages };
    }

    // คำสั่ง: #เช็คชื่อ
    if (rawText.startsWith("#เช็คชื่อ")) {
      let classroom = null;
      if (groupId) {
        classroom = await prisma.classroom.findUnique({
          where: { lineGroupId: groupId },
          include: { students: true },
        });
      }
      if (!classroom) {
        classroom = await prisma.classroom.findFirst({
          include: { students: true },
        });
      }

      if (!classroom) {
        replyMessages.push({
          type: "text",
          text: "❌ ยังไม่มีข้อมูลห้องเรียนในระบบ",
        });
        return { replyMessages };
      }

      // ดึงการเช็คชื่อล่าสุดของห้อง
      const latestAttendance = await prisma.attendance.findFirst({
        where: { classroomId: classroom.id },
        include: { records: true },
        orderBy: { date: "desc" },
      });

      if (latestAttendance) {
        const records = latestAttendance.records;
        const present = records.filter((r) => r.status === "PRESENT").length;
        const late = records.filter((r) => r.status === "LATE").length;
        const absent = records.filter((r) => r.status === "ABSENT").length;
        const leave = records.filter((r) => r.status === "LEAVE").length;

        replyMessages.push(
          createAttendanceFlex({
            classroomName: classroom.name,
            date: latestAttendance.date,
            presentCount: present,
            lateCount: late,
            absentCount: absent,
            leaveCount: leave,
            totalStudents: classroom.students.length,
          })
        );
      } else {
        replyMessages.push({
          type: "text",
          text: `📋 ห้องเรียน: ${classroom.name}\nยังไม่มีการบันทึกการเช็คชื่อสำหรับวันนี้ คุณครูสามารถเช็คชื่อได้ที่หน้า Web Dashboard ครับ`,
        });
      }

      return { replyMessages };
    }
  }

  // 3. Postback Event
  if (event.type === "postback") {
    const postbackData = event.postback?.data || "";
    const params = new URLSearchParams(postbackData);
    const action = params.get("action");

    if (action === "hatch_egg") {
      const studentIdParam = params.get("studentId");
      let student = null;
      if (studentIdParam) {
        student = await prisma.student.findFirst({
          where: {
            OR: [{ id: studentIdParam }, { name: studentIdParam }],
          },
          include: { egg: true },
        });
      }

      if (student) {
        const result = await hatchEgg(student.id);
        const updatedStudent = await prisma.student.findUnique({
          where: { id: student.id },
          include: { egg: { include: { hatchedMonster: true } } },
        });

        if (updatedStudent && updatedStudent.egg && updatedStudent.egg.hatchedMonster) {
          replyMessages.push(
            createEggStatusFlex({
              studentName: updatedStudent.name,
              seatNumber: updatedStudent.seatNumber,
              level: updatedStudent.level,
              totalPoints: updatedStudent.totalPoints,
              eggName: updatedStudent.egg.eggName,
              eggType: updatedStudent.egg.eggType,
              eggColor: updatedStudent.egg.eggColor,
              currentExp: updatedStudent.egg.currentExp,
              targetExp: updatedStudent.egg.targetExp,
              isHatched: true,
              monster: updatedStudent.egg.hatchedMonster,
            })
          );
        }
      }
      return { replyMessages };
    }

    if (action === "check_submitted") {
      const assignmentId = params.get("assignmentId");
      if (assignmentId) {
        const assignment = await prisma.assignment.findUnique({
          where: { id: assignmentId },
          include: {
            submissions: {
              include: { student: true },
              orderBy: { submittedAt: "asc" },
            },
            classroom: { include: { students: true } },
          },
        });

        if (assignment) {
          const names = assignment.submissions
            .map((sub, i) => `${i + 1}. [เลขที่ ${sub.student.seatNumber}] ${sub.student.name} (${sub.status})`)
            .join("\n");

          replyMessages.push({
            type: "text",
            text: `📊 รายชื่อผู้ส่งงาน: ${assignment.title}\n(${assignment.submissions.length}/${assignment.classroom.students.length} คน)\n━━━━━━━━━━━━━━━\n${names || "ยังไม่มีใครส่งงาน"}\n━━━━━━━━━━━━━━━`,
          });
        }
      }
      return { replyMessages };
    }
  }

  return { replyMessages };
}
