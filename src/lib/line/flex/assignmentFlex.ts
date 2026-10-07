import { FlexMessage } from "@line/bot-sdk";

export function createAssignmentFlex(params: {
  assignmentId: string;
  title: string;
  description?: string | null;
  dueDate: Date;
  expReward: number;
  maxScore: number;
  submittedCount: number;
  totalStudents: number;
  liffUrl?: string;
}): FlexMessage {
  const {
    assignmentId,
    title,
    description,
    dueDate,
    expReward,
    maxScore,
    submittedCount,
    totalStudents,
    liffUrl,
  } = params;

  const formattedDate = new Intl.DateTimeFormat("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(dueDate);

  const percentSubmitted = totalStudents > 0 
    ? Math.round((submittedCount / totalStudents) * 100) 
    : 0;

  const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const submitUrl = liffUrl || `${appBaseUrl}/liff/submit?assignmentId=${assignmentId}`;

  return {
    type: "flex",
    altText: `📢 มอบหมายการบ้านใหม่: ${title}`,
    contents: {
      type: "bubble",
      size: "giga",
      header: {
        type: "box",
        layout: "vertical",
        backgroundColor: "#06C755",
        paddingAll: "20px",
        contents: [
          {
            type: "box",
            layout: "horizontal",
            contents: [
              {
                type: "text",
                text: "📝 การบ้านใหม่",
                color: "#ffffff",
                weight: "bold",
                size: "sm",
              },
              {
                type: "text",
                text: `+${expReward} EXP 🌟`,
                color: "#fef08a",
                weight: "bold",
                size: "sm",
                align: "end",
              },
            ],
          },
          {
            type: "text",
            text: title,
            weight: "bold",
            color: "#ffffff",
            size: "xl",
            margin: "md",
            wrap: true,
          },
        ],
      },
      body: {
        type: "box",
        layout: "vertical",
        spacing: "md",
        paddingAll: "20px",
        contents: [
          {
            type: "text",
            text: description || "ไม่มีรายละเอียดเพิ่มเติม กรุณาศึกษาเอกสารตามที่ครูผู้สอนกำหนด",
            size: "sm",
            color: "#4b5563",
            wrap: true,
            maxLines: 4,
          },
          {
            type: "separator",
            margin: "lg",
          },
          {
            type: "box",
            layout: "vertical",
            margin: "lg",
            spacing: "sm",
            contents: [
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  {
                    type: "text",
                    text: "⏰ กำหนดส่ง:",
                    size: "xs",
                    color: "#9ca3af",
                    flex: 3,
                  },
                  {
                    type: "text",
                    text: formattedDate,
                    size: "xs",
                    color: "#ef4444",
                    weight: "bold",
                    flex: 7,
                    align: "end",
                  },
                ],
              },
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  {
                    type: "text",
                    text: "💯 คะแนนเต็ม:",
                    size: "xs",
                    color: "#9ca3af",
                    flex: 4,
                  },
                  {
                    type: "text",
                    text: `${maxScore} คะแนน`,
                    size: "xs",
                    color: "#1f2937",
                    weight: "bold",
                    flex: 6,
                    align: "end",
                  },
                ],
              },
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  {
                    type: "text",
                    text: "📊 สถานะการส่ง:",
                    size: "xs",
                    color: "#9ca3af",
                    flex: 4,
                  },
                  {
                    type: "text",
                    text: `ส่งแล้ว ${submittedCount}/${totalStudents} คน (${percentSubmitted}%)`,
                    size: "xs",
                    color: "#059669",
                    weight: "bold",
                    flex: 6,
                    align: "end",
                  },
                ],
              },
            ],
          },
          {
            type: "box",
            layout: "vertical",
            margin: "md",
            contents: [
              {
                type: "box",
                layout: "vertical",
                backgroundColor: "#e5e7eb",
                height: "6px",
                cornerRadius: "3px",
                contents: [
                  {
                    type: "box",
                    layout: "vertical",
                    backgroundColor: "#10b981",
                    width: `${Math.max(5, percentSubmitted)}%`,
                    height: "6px",
                    cornerRadius: "3px",
                    contents: [],
                  },
                ],
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
            color: "#06C755",
            action: {
              type: "uri",
              label: "🚀 ส่งงานทันที (LIFF)",
              uri: submitUrl,
            },
          },
          {
            type: "button",
            style: "secondary",
            action: {
              type: "postback",
              label: "🔍 ตรวจสอบผู้ที่ส่งแล้ว",
              data: `action=check_submitted&assignmentId=${assignmentId}`,
              displayText: `ตรวจสอบคนส่งงาน: ${title}`,
            },
          },
        ],
      },
    },
  };
}
