import { FlexMessage } from "@line/bot-sdk";

export function createWelcomeGroupFlex(params: {
  groupId: string;
  classroomName?: string | null;
  isPaired: boolean;
}): FlexMessage {
  const { groupId, classroomName, isPaired } = params;

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
                text: isPaired ? "🟢 เชื่อมโยงแล้ว" : "🟡 รอผูกห้องเรียน",
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
          {
            type: "text",
            text: isPaired
              ? "กลุ่ม LINE นี้เชื่อมโยงกับระบบห้องเรียนเรียบร้อยแล้ว นักเรียนสามารถพิมพ์คำสั่งใช้งานได้ทันที!"
              : "บ็อตได้เข้าร่วมกลุ่มแล้ว! นำ Group ID ด้านล่างไปกรอกในแดชบอร์ดคุณครู เพื่อผูกกับห้องเรียน:",
            size: "xs",
            color: "#4b5563",
            wrap: true,
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
                text: "• #การบ้าน - ดูการบ้านที่มอบหมาย & ลิงก์ส่งงาน",
                size: "xxs",
                color: "#475569",
              },
              {
                type: "text",
                text: "• #ไข่ - ตรวจสอบความคืบหน้าไข่มอนสเตอร์ของคุณ",
                size: "xxs",
                color: "#475569",
              },
              {
                type: "text",
                text: "• #ลงทะเบียน [เลขที่] - ผูกบัญชีไลน์กับเลขที่นักเรียน",
                size: "xxs",
                color: "#475569",
              },
              {
                type: "text",
                text: "• #สมาชิก - ดูรายชื่อเพื่อนและแต้มสะสมในห้อง",
                size: "xxs",
                color: "#475569",
              },
              {
                type: "text",
                text: "• #ทวงงาน - (สำหรับครู) สรุปรายชื่อคนที่ยังค้างส่งงาน",
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
              label: "📝 ดูการบ้าน",
              text: "#การบ้าน",
            },
          },
          {
            type: "button",
            style: "secondary",
            action: {
              type: "message",
              label: "🥚 ส่องไข่",
              text: "#ไข่",
            },
          },
        ],
      },
    },
  };
}
