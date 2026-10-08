import { prisma } from "../prisma";
import { createAssignmentFlex } from "./flex/assignmentFlex";
import { createReminderFlex } from "./flex/reminderFlex";
import { createAttendanceFlex } from "./flex/attendanceFlex";
import { createEggStatusFlex } from "./flex/eggStatusFlex";
import { createWelcomeGroupFlex } from "./flex/welcomeFlex";
import { hatchEgg, addStudentExp } from "../gamification/engine";
import {
  getGroupMemberProfile,
  getGroupSummary,
  getGroupMembersIds,
} from "./client";

export interface DispatchResult {
  replyMessages: any[];
  pushGroupId?: string;
  actionTaken?: string;
}

/**
 * ค้นหาหรือสร้างห้องเรียนรองรับกลุ่ม LINE โดยอัตโนมัติ
 */
export async function getOrCreateClassroomForGroup(groupId: string) {
  // 1. ค้นหาห้องเรียนที่ผูกกับ Group ID นี้อยู่แล้ว
  let classroom = await prisma.classroom.findUnique({
    where: { lineGroupId: groupId },
    include: {
      teacher: true,
      students: true,
    },
  });

  if (classroom) {
    return classroom;
  }

  // 2. ดึงข้อมูลชื่อกลุ่มจาก LINE Messaging API (ถ้ามี)
  const summary = await getGroupSummary(groupId);
  const groupName = summary?.groupName;

  // 3. ตรวจสอบว่ามีห้องเรียนที่สร้างไว้แล้วแต่ยังไม่ได้ผูก LINE Group ID หรือไม่
  const unlinkedClassroom = await prisma.classroom.findFirst({
    where: { lineGroupId: null },
    orderBy: { createdAt: "desc" },
    include: { teacher: true, students: true },
  });

  if (unlinkedClassroom) {
    classroom = await prisma.classroom.update({
      where: { id: unlinkedClassroom.id },
      data: {
        lineGroupId: groupId,
        name: groupName ? `${unlinkedClassroom.name} (${groupName})` : unlinkedClassroom.name,
      },
      include: {
        teacher: true,
        students: true,
      },
    });
    return classroom;
  }

  // 4. หากไม่มีห้องเรียนใดเลย ให้สร้างห้องเรียนใหม่ขึ้นมารองรับกลุ่มนี้อัตโนมัติ
  const defaultTeacher = await prisma.teacher.findFirst({
    orderBy: { createdAt: "asc" },
  });

  let teacherId = defaultTeacher?.id;
  if (!teacherId) {
    const newTeacher = await prisma.teacher.create({
      data: {
        name: "ครูประจำชั้น",
        email: `teacher_${Date.now()}@udclass.ac.th`,
        role: "TEACHER",
      },
    });
    teacherId = newTeacher.id;
  }

  classroom = await prisma.classroom.create({
    data: {
      teacherId,
      name: groupName || "ห้องเรียน LINE ใหม่",
      lineGroupId: groupId,
      academicYear: "2569",
      term: "1",
    },
    include: {
      teacher: true,
      students: true,
    },
  });

  return classroom;
}

/**
 * ลงทะเบียนนักเรียนเข้าห้องเรียนโดยอัตโนมัติ (Auto-Enroll)
 * ดึงชื่อและรูปจาก LINE API, กำหนดเลขที่ให้อัตโนมัติ และสร้างไข่มอนสเตอร์ทันที
 */
export async function autoEnrollStudent(
  classroomId: string,
  groupId: string,
  userId: string,
  fallbackName?: string
) {
  if (!userId) return null;

  // 1. ตรวจสอบว่ามีนักเรียนคนนี้ในห้องเรียนนี้แล้วหรือไม่
  let student = await prisma.student.findFirst({
    where: {
      classroomId,
      lineUserId: userId,
    },
    include: {
      egg: { include: { hatchedMonster: true } },
    },
  });

  if (student) {
    return { student, isNew: false };
  }

  // 2. ดึงโปรไฟล์ (ชื่อและรูป) จาก LINE API
  let displayName = fallbackName;
  let avatarUrl: string | null = null;

  const profile = await getGroupMemberProfile(groupId, userId);
  if (profile) {
    displayName = profile.displayName;
    avatarUrl = profile.pictureUrl || null;
  }

  const mockNamesMap: Record<string, string> = {
    U_student_new_somying: "ด.ญ. สมหญิง จริงใจ",
    U_student_new_nattawut: "นาย ณัฐวุฒิ ว่องไว",
    U_student_01: "ด.ช. กิตติศักดิ์ เจริญพร",
    U_student_02: "ด.ช. ชัยวัฒน์ มั่นคง",
    U_student_03: "ด.ญ. ณัฐณิชา ศรีสุข",
    U_teacher_chedtha: "ครูเชษฐ์ พัฒนาวิชาการ",
  };

  if (!displayName || displayName.trim() === "" || displayName === "นักเรียน LINE") {
    if (mockNamesMap[userId]) {
      displayName = mockNamesMap[userId];
    } else {
      displayName = fallbackName || "นักเรียน LINE";
    }
  }

  // 3. ตรวจสอบว่ามีรายชื่อนักเรียนเดิมที่ยังไม่ได้ผูกไลน์ที่มีชื่อตรงกันหรือไม่
  const preExistingStudent = await prisma.student.findFirst({
    where: {
      classroomId,
      lineUserId: null,
      name: displayName.trim(),
    },
    include: {
      egg: { include: { hatchedMonster: true } },
    },
  });

  if (preExistingStudent) {
    student = await prisma.student.update({
      where: { id: preExistingStudent.id },
      data: {
        lineUserId: userId,
        avatarUrl: avatarUrl || preExistingStudent.avatarUrl,
      },
      include: {
        egg: { include: { hatchedMonster: true } },
      },
    });

    return { student, isNew: true };
  }

  // 4. หาเลขที่ถัดไป (Auto Seat Number: 1, 2, 3...)
  const lastStudent = await prisma.student.findFirst({
    where: { classroomId },
    orderBy: { seatNumber: "desc" },
  });
  const nextSeatNumber = (lastStudent?.seatNumber || 0) + 1;

  // สุ่มประเภทไข่และสีเริ่มต้น
  const eggTypes = ["NORMAL", "NORMAL", "NORMAL", "RARE"];
  const randomEggType = eggTypes[Math.floor(Math.random() * eggTypes.length)];
  const eggColors = ["amber", "emerald", "blue", "purple"];
  const randomColor = eggColors[Math.floor(Math.random() * eggColors.length)];

  // 5. บันทึกนักเรียนเข้าห้องเรียนและสร้างไข่มอนสเตอร์พร้อมโบนัสเริ่มต้น +20 EXP
  student = await prisma.student.create({
    data: {
      classroomId,
      lineUserId: userId,
      seatNumber: nextSeatNumber,
      name: displayName.trim(),
      avatarUrl:
        avatarUrl ||
        `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(userId)}`,
      totalPoints: 20,
      exp: 20,
      level: 1,
      egg: {
        create: {
          eggName: `ไข่มอนสเตอร์เริ่มต้น (เกรด ${randomEggType})`,
          eggType: randomEggType,
          eggColor: randomColor,
          currentExp: 20,
          targetExp: 100,
          isHatched: false,
        },
      },
    },
    include: {
      egg: { include: { hatchedMonster: true } },
    },
  });

  return { student, isNew: true };
}

export async function dispatchLineEvent(event: any): Promise<DispatchResult> {
  const replyMessages: any[] = [];

  // ==========================================
  // 1. Join Event (บ็อตถูกเชิญเข้ากลุ่ม LINE)
  // ==========================================
  if (event.type === "join") {
    const groupId = event.source?.groupId;
    if (groupId) {
      // ค้นหาหรือสร้างห้องเรียนรองรับกลุ่มนี้
      const classroom = await getOrCreateClassroomForGroup(groupId);

      // พยายามดึงรายชื่อสมาชิกทั้งหมดผ่าน LINE API ทันที (หากสิทธิ์บัญชีรองรับ)
      let autoEnrolledCount = 0;
      const memberIds = await getGroupMembersIds(groupId);
      if (memberIds && memberIds.length > 0) {
        for (const mId of memberIds) {
          const res = await autoEnrollStudent(classroom.id, groupId, mId);
          if (res?.isNew) autoEnrolledCount++;
        }
      }

      // ถ้าในอีเวนต์ join มีการส่ง userId ของผู้เชิญมา ให้ลงทะเบียนด้วย
      if (event.source?.userId) {
        const res = await autoEnrollStudent(classroom.id, groupId, event.source.userId);
        if (res?.isNew) autoEnrolledCount++;
      }

      replyMessages.push(
        createWelcomeGroupFlex({
          groupId,
          classroomName: classroom.name,
          isPaired: true,
          autoEnrolledCount,
        })
      );

      return {
        replyMessages,
        pushGroupId: groupId,
        actionTaken: "JOIN_AUTO_ENROLL_PROCESSED",
      };
    }
  }

  // ========================================================
  // 2. Member Joined Event (มีสมาชิกใหม่กดเข้ากลุ่ม LINE)
  // ========================================================
  if (event.type === "memberJoined") {
    const groupId = event.source?.groupId;
    const members = event.joined?.members || [];

    if (groupId && members.length > 0) {
      const classroom = await getOrCreateClassroomForGroup(groupId);

      for (const member of members) {
        if (member.userId) {
          const res = await autoEnrollStudent(classroom.id, groupId, member.userId);
          if (res?.isNew) {
            replyMessages.push({
              type: "text",
              text: `🐣 ยินดีต้อนรับ ${res.student.name} (เลขที่ ${res.student.seatNumber}) เข้าสู่ห้อง ${classroom.name}!\n✨ ระบบลงทะเบียนเข้าชั้นเรียนให้อัตโนมัติ พร้อมมอบไข่มอนสเตอร์และโบนัสต้อนรับ +20 EXP ให้ทันที! 🌟\n(พิมพ์ #ไข่ เพื่อดูมอนสเตอร์ของคุณ)`,
            });
          }
        }
      }

      return { replyMessages, actionTaken: "MEMBER_JOINED_AUTO_ENROLL" };
    }
  }

  // ==========================================================
  // 3. Message Event (ข้อความคำสั่งหรือการแชทของสมาชิกในกลุ่ม)
  // ==========================================================
  if (event.type === "message") {
    const groupId = event.source?.groupId;
    const userId = event.source?.userId;
    const rawText = (event.message?.text || "").trim();

    let classroom: any = null;
    let enrolledStudent: any = null;

    // ถ้าข้อความมาจากกลุ่ม LINE ให้ดำเนินการ Auto-Enroll ทันที
    if (groupId) {
      classroom = await getOrCreateClassroomForGroup(groupId);

      if (userId) {
        const enrollResult = await autoEnrollStudent(classroom.id, groupId, userId);
        if (enrollResult) {
          enrolledStudent = enrollResult.student;

          // หากเป็นสมาชิกที่เพิ่งถูกเพิ่มเข้ามาใหม่ และไม่ได้พิมพ์คำสั่งขึ้นต้นด้วย #
          // ให้ส่งข้อความต้อนรับและแจ้งเลขที่ + ไข่มอนสเตอร์อัตโนมัติ
          if (enrollResult.isNew && !rawText.startsWith("#")) {
            replyMessages.push({
              type: "text",
              text: `🎉 ยินดีต้อนรับ ${enrolledStudent.name} (เลขที่ ${enrolledStudent.seatNumber}) เข้าสู่ห้อง ${classroom.name}!\n🐣 ระบบลงทะเบียนเข้าชั้นเรียนให้อัตโนมัติเรียบร้อย ได้รับไข่มอนสเตอร์และ +20 EXP ทันที ✨\n(พิมพ์ #ไข่ เพื่อดูมอนสเตอร์ หรือ #การบ้าน เพื่อดูงาน)`,
            });
          }
        }
      }
    } else if (userId) {
      // กรณีคุยแบบ 1-on-1 (Private Chat)
      enrolledStudent = await prisma.student.findFirst({
        where: { lineUserId: userId },
        include: {
          classroom: true,
          egg: { include: { hatchedMonster: true } },
        },
      });
      if (enrolledStudent) {
        classroom = enrolledStudent.classroom;
      }
    }

    // ---------------------------------------------------------
    // คำสั่ง: #กลุ่ม
    // ---------------------------------------------------------
    if (rawText.startsWith("#กลุ่ม")) {
      if (!groupId) {
        replyMessages.push({
          type: "text",
          text: `ℹ️ คำสั่งนี้สำหรับกลุ่ม LINE เท่านั้นครับ\nUser ID ของคุณคือ: ${userId}`,
        });
      } else {
        if (!classroom) {
          classroom = await getOrCreateClassroomForGroup(groupId);
        }

        const studentCount = await prisma.student.count({
          where: { classroomId: classroom.id },
        });

        replyMessages.push({
          type: "text",
          text: `🏫 ข้อมูลห้องเรียนที่เชื่อมต่อ\n━━━━━━━━━━━━━━━\n• ชื่อห้อง: ${classroom.name}\n• ครูผู้สอน: ${classroom.teacher?.name || "ครูประจำวิชา"}\n• ปีการศึกษา: ${classroom.academicYear} เทอม ${classroom.term}\n• สมาชิกในห้อง: ${studentCount} คน (ระบบ Auto-Enroll เปิดอยู่ 🟢)\n• LINE Group ID: ${groupId}\n━━━━━━━━━━━━━━━\n💡 ทุกคนในกลุ่มจะถูกเพิ่มเข้าห้องเรียนอัตโนมัติเมื่อส่งข้อความ\nพิมพ์ #การบ้าน หรือ #ไข่ เพื่อเริ่มใช้งาน`,
        });
      }
      return { replyMessages };
    }

    // ---------------------------------------------------------
    // คำสั่ง: #ลงทะเบียน [เลขที่] (รองรับการแก้ไข/ปรับเลขที่ตามต้องการ)
    // ---------------------------------------------------------
    if (rawText.startsWith("#ลงทะเบียน")) {
      const parts = rawText.split(/\s+/);
      const seatNumberStr = parts[1];

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
        const studentInfo = enrolledStudent
          ? `\n📌 คุณอยู่ในระบบแล้ว: ${enrolledStudent.name} (เลขที่ ${enrolledStudent.seatNumber})`
          : "";
        replyMessages.push({
          type: "text",
          text: `📝 ขณะนี้ระบบเปิดโหมด Auto-Enroll นักเรียนจะได้รับเลขที่และไข่อัตโนมัติทันทีโดยไม่ต้องลงทะเบียน${studentInfo}\n\nหากต้องการเปลี่ยนเลขที่ด้วยตนเอง ให้พิมพ์:\n#ลงทะเบียน [เลขที่ใหม่]\nตัวอย่าง: #ลงทะเบียน 5`,
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

      // ตรวจสอบว่ามีนักเรียนที่กำลังใช้ lineUserId นี้อยู่แล้วหรือไม่
      if (enrolledStudent) {
        // อัปเดตเลขที่ให้กับนักเรียนคนนี้
        const updatedStudent = await prisma.student.update({
          where: { id: enrolledStudent.id },
          data: { seatNumber },
          include: { egg: { include: { hatchedMonster: true } } },
        });

        replyMessages.push({
          type: "text",
          text: `🎉 อัปเดตเลขที่สำเร็จ!\n${updatedStudent.name} ได้รับเลขที่ใหม่เป็น ${updatedStudent.seatNumber} ในห้อง ${classroom.name} เรียบร้อยแล้ว ✨`,
        });

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
      } else if (userId && groupId) {
        // ถ้ายังไม่มี ให้ auto enroll โดยใช้เลขที่ที่ระบุ
        const newStudent = await autoEnrollStudent(classroom.id, groupId, userId);
        if (newStudent) {
          const updated = await prisma.student.update({
            where: { id: newStudent.student.id },
            data: { seatNumber },
            include: { egg: { include: { hatchedMonster: true } } },
          });

          replyMessages.push({
            type: "text",
            text: `🎉 ลงทะเบียนสำเร็จ!\nยินดีต้อนรับ ${updated.name} (เลขที่ ${updated.seatNumber})\nเข้าสู่ห้อง ${classroom.name} เรียบร้อยแล้ว\n🌟 รับโบนัสต้อนรับ +20 EXP!`,
          });

          if (updated.egg) {
            replyMessages.push(
              createEggStatusFlex({
                studentName: updated.name,
                seatNumber: updated.seatNumber,
                level: updated.level,
                totalPoints: updated.totalPoints,
                eggName: updated.egg.eggName,
                eggType: updated.egg.eggType,
                eggColor: updated.egg.eggColor,
                currentExp: updated.egg.currentExp,
                targetExp: updated.egg.targetExp,
                isHatched: updated.egg.isHatched,
                monster: updated.egg.hatchedMonster,
              })
            );
          }
        }
        return { replyMessages };
      }
    }

    // ---------------------------------------------------------
    // คำสั่ง: #การบ้าน
    // ---------------------------------------------------------
    if (rawText.startsWith("#การบ้าน")) {
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

    // ---------------------------------------------------------
    // คำสั่ง: #ไข่ หรือ #มอนสเตอร์ (ใช้งานได้ทันทีไม่ต้องลงทะเบียนเลขที่)
    // ---------------------------------------------------------
    if (rawText.startsWith("#ไข่") || rawText.startsWith("#มอนสเตอร์")) {
      let student = enrolledStudent;

      if (!student && userId) {
        student = await prisma.student.findFirst({
          where: { lineUserId: userId },
          include: { egg: { include: { hatchedMonster: true } } },
        });
      }

      // ถ้ายังไม่พบ และอยู่ในกลุ่ม ให้ auto-enroll ทันที!
      if (!student && groupId && userId) {
        if (!classroom) classroom = await getOrCreateClassroomForGroup(groupId);
        const res = await autoEnrollStudent(classroom.id, groupId, userId);
        student = res?.student;
      }

      // Fallback สำหรับกรณีทดสอบที่ไม่มี userId
      if (!student) {
        student = await prisma.student.findFirst({
          include: { egg: { include: { hatchedMonster: true } } },
        });
      }

      if (!student || !student.egg) {
        replyMessages.push({
          type: "text",
          text: "🐣 ยินดีต้อนรับ! กำลังเตรียมไข่มอนสเตอร์ของคุณ กรุณาส่งข้อความอีกครั้งได้เลยครับ",
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

    // ---------------------------------------------------------
    // คำสั่ง: #สมาชิก
    // ---------------------------------------------------------
    if (rawText.startsWith("#สมาชิก")) {
      if (!classroom && groupId) {
        classroom = await getOrCreateClassroomForGroup(groupId);
      } else if (!classroom) {
        classroom = await prisma.classroom.findFirst();
      }

      if (!classroom) {
        replyMessages.push({
          type: "text",
          text: "❌ ยังไม่มีข้อมูลห้องเรียนในระบบ",
        });
        return { replyMessages };
      }

      const students = await prisma.student.findMany({
        where: { classroomId: classroom.id },
        include: { egg: { include: { hatchedMonster: true } } },
        orderBy: { seatNumber: "asc" },
      });

      if (students.length === 0) {
        replyMessages.push({
          type: "text",
          text: `🎒 ห้อง ${classroom.name}\nยังไม่มีสมาชิกในห้อง สมาชิกกลุ่มจะถูกเพิ่มเข้าห้องเรียนอัตโนมัติเมื่อส่งข้อความในกลุ่มครับ!`,
        });
        return { replyMessages };
      }

      const rosterText = students
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
        text: `🎒 สมาชิกห้อง: ${classroom.name}\n(🟢 ผูก LINE แล้ว • รวม ${students.length} คน)\n━━━━━━━━━━━━━━━\n${rosterText}\n━━━━━━━━━━━━━━━\n💡 ทุกคนในกลุ่มพิมพ์ #ไข่ เพื่อดูมอนสเตอร์ของตัวเองได้ทันที`,
      });

      return { replyMessages };
    }

    // ---------------------------------------------------------
    // คำสั่ง: #ทวงงาน
    // ---------------------------------------------------------
    if (rawText.startsWith("#ทวงงาน")) {
      if (!classroom && groupId) {
        classroom = await getOrCreateClassroomForGroup(groupId);
      } else if (!classroom) {
        classroom = await prisma.classroom.findFirst();
      }

      if (!classroom) {
        replyMessages.push({
          type: "text",
          text: "❌ ยังไม่มีข้อมูลห้องเรียนในระบบ",
        });
        return { replyMessages };
      }

      const latestAssignment = await prisma.assignment.findFirst({
        where: { classroomId: classroom.id },
        include: {
          submissions: true,
          classroom: { include: { students: true } },
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
      const allStudents = await prisma.student.findMany({
        where: { classroomId: classroom.id },
        orderBy: { seatNumber: "asc" },
      });
      const unsubmittedStudents = allStudents.filter(
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

    // ---------------------------------------------------------
    // คำสั่ง: #เช็คชื่อ
    // ---------------------------------------------------------
    if (rawText.startsWith("#เช็คชื่อ")) {
      if (!classroom && groupId) {
        classroom = await getOrCreateClassroomForGroup(groupId);
      } else if (!classroom) {
        classroom = await prisma.classroom.findFirst();
      }

      if (!classroom) {
        replyMessages.push({
          type: "text",
          text: "❌ ยังไม่มีข้อมูลห้องเรียนในระบบ",
        });
        return { replyMessages };
      }

      const totalStudentsCount = await prisma.student.count({
        where: { classroomId: classroom.id },
      });

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
            totalStudents: totalStudentsCount,
          })
        );
      } else {
        replyMessages.push({
          type: "text",
          text: `📋 ห้องเรียน: ${classroom.name}\n(จำนวนนักเรียนในห้อง: ${totalStudentsCount} คน)\nยังไม่มีการบันทึกการเช็คชื่อสำหรับวันนี้ คุณครูสามารถเช็คชื่อได้ที่หน้า Web Dashboard ครับ`,
        });
      }

      return { replyMessages };
    }
  }

  // ==========================================
  // 4. Postback Event
  // ==========================================
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
        await hatchEgg(student.id);
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
