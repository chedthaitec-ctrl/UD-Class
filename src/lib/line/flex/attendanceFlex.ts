import { FlexMessage } from "@line/bot-sdk";

export function createAttendanceFlex(params: {
  classroomName: string;
  date: Date;
  presentCount: number;
  lateCount: number;
  absentCount: number;
  sickLeaveCount?: number;
  personalLeaveCount?: number;
  leaveCount?: number;
  totalStudents: number;
}): FlexMessage {
  const {
    classroomName,
    date,
    presentCount,
    lateCount,
    absentCount,
    sickLeaveCount = 0,
    personalLeaveCount,
    leaveCount = 0,
    totalStudents,
  } = params;

  const actualPersonalLeave = personalLeaveCount !== undefined ? personalLeaveCount : leaveCount;

  const formattedDate = new Intl.DateTimeFormat("th-TH", {
    dateStyle: "full",
  }).format(date);

  const attendanceRate = totalStudents > 0 
    ? Math.round(((presentCount + lateCount) / totalStudents) * 100) 
    : 0;

  return {
    type: "flex",
    altText: `📋 สรุปการเช็คชื่อ: ${classroomName} (${formattedDate})`,
    contents: {
      type: "bubble",
      size: "giga",
      header: {
        type: "box",
        layout: "vertical",
        backgroundColor: "#0f172a",
        paddingAll: "20px",
        contents: [
          {
            type: "box",
            layout: "horizontal",
            contents: [
              {
                type: "text",
                text: "📋 บันทึกการเข้าเรียนประจำวัน",
                color: "#38bdf8",
                weight: "bold",
                size: "xs",
              },
              {
                type: "text",
                text: "✨ +15 EXP (มาเรียน)",
                color: "#facc15",
                weight: "bold",
                size: "xs",
                align: "end",
              },
            ],
          },
          {
            type: "text",
            text: classroomName,
            weight: "bold",
            color: "#ffffff",
            size: "lg",
            margin: "sm",
          },
          {
            type: "text",
            text: formattedDate,
            color: "#94a3b8",
            size: "xs",
            margin: "xs",
          },
        ],
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
                text: "อัตราการเข้าชั้นเรียน:",
                size: "sm",
                color: "#4b5563",
              },
              {
                type: "text",
                text: `${attendanceRate}% (${presentCount + lateCount}/${totalStudents} คน)`,
                size: "sm",
                weight: "bold",
                color: "#1d4ed8",
                align: "end",
              },
            ],
          },
          {
            type: "separator",
            margin: "sm",
          },
          // Row 1: มาเรียน, มาสาย, ขาด
          {
            type: "box",
            layout: "horizontal",
            spacing: "sm",
            margin: "md",
            contents: [
              {
                type: "box",
                layout: "vertical",
                backgroundColor: "#ecfdf5",
                cornerRadius: "8px",
                paddingAll: "10px",
                flex: 1,
                contents: [
                  {
                    type: "text",
                    text: "มาเรียน",
                    size: "xxs",
                    color: "#059669",
                    align: "center",
                    weight: "bold",
                  },
                  {
                    type: "text",
                    text: `${presentCount}`,
                    size: "xl",
                    weight: "bold",
                    color: "#047857",
                    align: "center",
                    margin: "xs",
                  },
                  {
                    type: "text",
                    text: "+15 EXP",
                    size: "xxxs",
                    color: "#10b981",
                    align: "center",
                  },
                ],
              },
              {
                type: "box",
                layout: "vertical",
                backgroundColor: "#fffbeb",
                cornerRadius: "8px",
                paddingAll: "10px",
                flex: 1,
                contents: [
                  {
                    type: "text",
                    text: "มาสาย",
                    size: "xxs",
                    color: "#d97706",
                    align: "center",
                    weight: "bold",
                  },
                  {
                    type: "text",
                    text: `${lateCount}`,
                    size: "xl",
                    weight: "bold",
                    color: "#b45309",
                    align: "center",
                    margin: "xs",
                  },
                  {
                    type: "text",
                    text: "+5 EXP",
                    size: "xxxs",
                    color: "#f59e0b",
                    align: "center",
                  },
                ],
              },
              {
                type: "box",
                layout: "vertical",
                backgroundColor: "#fef2f2",
                cornerRadius: "8px",
                paddingAll: "10px",
                flex: 1,
                contents: [
                  {
                    type: "text",
                    text: "ขาด",
                    size: "xxs",
                    color: "#dc2626",
                    align: "center",
                    weight: "bold",
                  },
                  {
                    type: "text",
                    text: `${absentCount}`,
                    size: "xl",
                    weight: "bold",
                    color: "#b91c1c",
                    align: "center",
                    margin: "xs",
                  },
                  {
                    type: "text",
                    text: "0 EXP",
                    size: "xxxs",
                    color: "#ef4444",
                    align: "center",
                  },
                ],
              },
            ],
          },
          // Row 2: ลาป่วย, ลากิจ
          {
            type: "box",
            layout: "horizontal",
            spacing: "sm",
            contents: [
              {
                type: "box",
                layout: "vertical",
                backgroundColor: "#eef2ff",
                cornerRadius: "8px",
                paddingAll: "10px",
                flex: 1,
                contents: [
                  {
                    type: "text",
                    text: "ลาป่วย",
                    size: "xxs",
                    color: "#4f46e5",
                    align: "center",
                    weight: "bold",
                  },
                  {
                    type: "text",
                    text: `${sickLeaveCount}`,
                    size: "xl",
                    weight: "bold",
                    color: "#4338ca",
                    align: "center",
                    margin: "xs",
                  },
                  {
                    type: "text",
                    text: "0 EXP",
                    size: "xxxs",
                    color: "#6366f1",
                    align: "center",
                  },
                ],
              },
              {
                type: "box",
                layout: "vertical",
                backgroundColor: "#f5f3ff",
                cornerRadius: "8px",
                paddingAll: "10px",
                flex: 1,
                contents: [
                  {
                    type: "text",
                    text: "ลากิจ",
                    size: "xxs",
                    color: "#7c3aed",
                    align: "center",
                    weight: "bold",
                  },
                  {
                    type: "text",
                    text: `${actualPersonalLeave}`,
                    size: "xl",
                    weight: "bold",
                    color: "#6d28d9",
                    align: "center",
                    margin: "xs",
                  },
                  {
                    type: "text",
                    text: "0 EXP",
                    size: "xxxs",
                    color: "#8b5cf6",
                    align: "center",
                  },
                ],
              },
            ],
          },
          {
            type: "box",
            layout: "horizontal",
            margin: "sm",
            contents: [
              {
                type: "text",
                text: "🌟 บันทึกผลเช็คชื่อและส่งผลสรุปเรียบร้อยแล้ว",
                size: "xxs",
                color: "#16a34a",
                align: "center",
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
            color: "#0f172a",
            action: {
              type: "message",
              label: "🥚 ตรวจสอบไข่มอนสเตอร์ของคุณ",
              text: "#ไข่",
            },
          },
        ],
      },
    },
  };
}
