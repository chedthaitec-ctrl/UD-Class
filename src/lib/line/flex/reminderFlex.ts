import { FlexMessage } from "@line/bot-sdk";

export function createReminderFlex(params: {
  assignmentId: string;
  title: string;
  dueDate: Date;
  unsubmittedStudents: Array<{ seatNumber: number; name: string }>;
  expReward: number;
  liffUrl?: string;
}): FlexMessage {
  const {
    assignmentId,
    title,
    dueDate,
    unsubmittedStudents,
    expReward,
    liffUrl,
  } = params;

  const formattedDate = new Intl.DateTimeFormat("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(dueDate);

  // สร้างรายการนักเรียนที่ยังไม่ส่ง (แสดงสูงสุด 10 คนแรก และแสดงสรุป)
  const previewStudents = unsubmittedStudents.slice(0, 8);
  const remainingCount = unsubmittedStudents.length - previewStudents.length;

  const studentRows = previewStudents.map((s) => ({
    type: "box" as const,
    layout: "horizontal" as const,
    contents: [
      {
        type: "text" as const,
        text: `• เลขที่ ${s.seatNumber}`,
        size: "xs" as const,
        color: "#dc2626",
        weight: "bold" as const,
        flex: 3,
      },
      {
        type: "text" as const,
        text: s.name,
        size: "xs" as const,
        color: "#374151",
        flex: 7,
      },
    ],
  }));

  const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const submitUrl = liffUrl || `${appBaseUrl}/liff/submit?assignmentId=${assignmentId}`;

  return {
    type: "flex",
    altText: `⏰ แจ้งเตือนทวงงาน: ${title} (ค้างส่ง ${unsubmittedStudents.length} คน)`,
    contents: {
      type: "bubble",
      size: "giga",
      header: {
        type: "box",
        layout: "vertical",
        backgroundColor: "#dc2626",
        paddingAll: "20px",
        contents: [
          {
            type: "box",
            layout: "horizontal",
            contents: [
              {
                type: "text",
                text: "🚨 แจ้งเตือนการบ้านใกล้ครบกำหนด!",
                color: "#fee2e2",
                weight: "bold",
                size: "xs",
              },
              {
                type: "text",
                text: `รับทันที +${expReward} EXP`,
                color: "#fef08a",
                weight: "bold",
                size: "xs",
                align: "end",
              },
            ],
          },
          {
            type: "text",
            text: title,
            weight: "bold",
            color: "#ffffff",
            size: "lg",
            margin: "sm",
            wrap: true,
          },
          {
            type: "text",
            text: `⏳ สิ้นสุดเวลา: ${formattedDate}`,
            size: "xs",
            color: "#fecaca",
            margin: "xs",
          },
        ],
      },
      body: {
        type: "box",
        layout: "vertical",
        spacing: "sm",
        paddingAll: "20px",
        contents: [
          {
            type: "box",
            layout: "horizontal",
            contents: [
              {
                type: "text",
                text: "📌 รายชื่อนักเรียนที่ยังไม่ส่งงาน:",
                size: "sm",
                weight: "bold",
                color: "#1f2937",
                flex: 8,
              },
              {
                type: "text",
                text: `${unsubmittedStudents.length} คน`,
                size: "sm",
                weight: "bold",
                color: "#dc2626",
                align: "end",
                flex: 4,
              },
            ],
          },
          {
            type: "separator",
            margin: "md",
          },
          {
            type: "box",
            layout: "vertical",
            margin: "md",
            spacing: "xs",
            contents:
              studentRows.length > 0
                ? studentRows
                : [
                    {
                      type: "text",
                      text: "🎉 ยินดีด้วย! นักเรียนทุกคนส่งงานครบหมดแล้ว",
                      size: "xs",
                      color: "#059669",
                      weight: "bold",
                    },
                  ],
          },
          ...(remainingCount > 0
            ? [
                {
                  type: "text" as const,
                  text: `...และเพื่อนๆ อีก ${remainingCount} คน`,
                  size: "xxs" as const,
                  color: "#9ca3af",
                  align: "center" as const,
                  margin: "xs" as const,
                },
              ]
            : []),
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
            color: "#dc2626",
            action: {
              type: "uri",
              label: "⚡ รีบส่งงานรับคะแนน (LIFF)",
              uri: submitUrl,
            },
          },
          {
            type: "button",
            style: "secondary",
            action: {
              type: "message",
              label: "🥚 เช็คคะแนน & ไข่มอนสเตอร์",
              text: "#ไข่",
            },
          },
        ],
      },
    },
  };
}
