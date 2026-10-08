import { FlexMessage } from "@line/bot-sdk";

export function createWelcomeGroupFlex(params: {
  groupId: string;
  classroomName?: string | null;
  isPaired: boolean;
  autoEnrolledCount?: number;
}): FlexMessage {
  const { groupId, classroomName, isPaired, autoEnrolledCount } = params;

  return {
    type: "flex",
    altText: "👋 สวัสดีครับ! บ็อตจัดการชั้นเรียน UD-Class System พร้อมให้บริการแล้ว",
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
                text: "🤖 UD-Class Bot System",
                color: "#38bdf8",
                weight: "bold",
                size: "sm",
              },
              {
                type: "text",
                text: isPaired ? "🟢 เชื่อมห้องเรียนแล้ว" : "🟡 รอผูกห้องเรียน",
                color: isPaired ? "#4ade80" : "#facc15",
                weight: "bold",
                size: "xs",
                align: "end",
              },
            ],
          },
          {
            type: "text",
            text: isPaired ? (classroomName || "ห้องเรียนออนไลน์") : "ยินดีต้อนรับสู่ระบบจัดการชั้นเรียน",
            weight: "bold",
            color: "#ffffff",
            size: "lg",
            margin: "sm",
          },
        ],
      },
      body: {
        type: "box",
        layout: "vertical",
        paddingAll: "20px",
        spacing: "md",
        contents: [
          // Auto-enroll badge callout
          {
            type: "box",
            layout: "vertical",
            backgroundColor: "#ecfdf5",
            cornerRadius: "12px",
            paddingAll: "14px",
            contents: [
              {
                type: "box",
                layout: "horizontal",
                spacing: "xs",
                contents: [
                  {
                    type: "text",
                    text: "⚡",
                    size: "sm",
                    flex: 0,
                  },
                  {
                    type: "text",
                    text: "ระบบลงทะเบียนนักเรียนอัตโนมัติ (Auto-Enroll)",
                    weight: "bold",
                    size: "xs",
                    color: "#065f46",
                  },
                ],
              },
              {
                type: "text",
                text: autoEnrolledCount && autoEnrolledCount > 0
                  ? `ระบบได้ดึงนักเรียนเข้าห้องแล้ว ${autoEnrolledCount} คน พร้อมแจกไข่มอนสเตอร์ทันที!`
                  : "นักเรียนในกลุ่มทุกคนจะถูกเพิ่มเข้าชั้นเรียนและได้รับไข่มอนสเตอร์อัตโนมัติทันทีที่พิมพ์ข้อความ โดยไม่ต้องพิมพ์ลงทะเบียนเลขที่!",
                size: "xxs",
                color: "#047857",
                wrap: true,
                margin: "xs",
              },
            ],
          },
          {
            type: "box",
            layout: "vertical",
            backgroundColor: "#f1f5f9",
            cornerRadius: "8px",
            paddingAll: "12px",
            contents: [
              {
                type: "text",
                text: "LINE Group ID ประจำกลุ่มนี้:",
                size: "xxs",
                color: "#64748b",
              },
              {
                type: "text",
                text: groupId,
                size: "xs",
                weight: "bold",
                color: "#0f172a",
                wrap: true,
              },
            ],
          },
          {
            type: "separator",
            margin: "md",
          },
          {
            type: "text",
            text: "📌 คำสั่งที่สามารถใช้งานได้ในกลุ่ม:",
            weight: "bold",
            size: "xs",
            color: "#1e293b",
          },
          {
            type: "box",
            layout: "vertical",
            spacing: "xs",
            contents: [
              {
                type: "text",
                text: "• #การบ้าน - ดูการบ้านที่มอบหมาย & ตรวจสอบการส่ง",
                size: "xxs",
                color: "#475569",
              },
              {
                type: "text",
                text: "• #ไข่ หรือ #มอนสเตอร์ - ดูสถานะไข่และเลเวลสะสม",
                size: "xxs",
                color: "#475569",
              },
              {
                type: "text",
                text: "• #สมาชิก - ดูรายชื่อเพื่อนและแต้มสะสมทั้งหมดในห้อง",
                size: "xxs",
                color: "#475569",
              },
              {
                type: "text",
                text: "• #ลงทะเบียน [เลขที่] - ปรับเปลี่ยนเลขที่ (หากต้องการแก้ไข)",
                size: "xxs",
                color: "#475569",
              },
              {
                type: "text",
                text: "• #เช็คชื่อ - ดูสรุปการมาเรียนประจำวัน",
                size: "xxs",
                color: "#475569",
              },
            ],
          },
        ],
      },
      footer: {
        type: "box",
        layout: "horizontal",
        spacing: "sm",
        contents: [
          {
            type: "button",
            style: "primary",
            color: "#06C755",
            action: {
              type: "message",
              label: "🥚 ส่องไข่ของฉัน",
              text: "#ไข่",
            },
          },
          {
            type: "button",
            style: "secondary",
            action: {
              type: "message",
              label: "📝 ดูการบ้าน",
              text: "#การบ้าน",
            },
          },
        ],
      },
    },
  };
}
