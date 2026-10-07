import { FlexMessage } from "@line/bot-sdk";

export function createAttendanceFlex(params: {
  classroomName: string;
  date: Date;
  presentCount: number;
  lateCount: number;
  absentCount: number;
  leaveCount: number;
  totalStudents: number;
}): FlexMessage {
  const {
    classroomName,
    date,
    presentCount,
    lateCount,
    absentCount,
    leaveCount,
    totalStudents,
  } = params;

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
        backgroundColor: "#2563eb",
        paddingAll: "20px",
        contents: [
          {
            type: "box",
            layout: "horizontal",
            contents: [
              {
                type: "text",
                text: "📋 บันทึกการเข้าเรียนประจำวัน",
                color: "#dbeafe",
                weight: "bold",
                size: "xs",
              },
              {
                type: "text",
                text: "✨ +15 EXP / คน",
                color: "#fef08a",
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
            color: "#bfdbfe",
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
          {
            type: "box",
            layout: "horizontal",
            spacing: "md",
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
                    text: "ขาดเรียน",
                    size: "xxs",
                    color: "#dc2626",
                    align: "center",
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
                ],
              },
              {
                type: "box",
                layout: "vertical",
                backgroundColor: "#f3f4f6",
                cornerRadius: "8px",
                paddingAll: "10px",
                flex: 1,
                contents: [
                  {
                    type: "text",
                    text: "ลา",
                    size: "xxs",
                    color: "#4b5563",
                    align: "center",
                  },
                  {
                    type: "text",
                    text: `${leaveCount}`,
                    size: "xl",
                    weight: "bold",
                    color: "#374151",
                    align: "center",
                    margin: "xs",
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
                text: "🌟 แจก +15 EXP ให้กับนักเรียนที่เข้าเรียนเรียบร้อย!",
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
            color: "#2563eb",
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
