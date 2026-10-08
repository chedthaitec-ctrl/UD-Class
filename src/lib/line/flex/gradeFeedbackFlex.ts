import { FlexMessage } from "@line/bot-sdk";

export function createGradeFeedbackFlex(params: {
  studentName: string;
  assignmentTitle: string;
  score: number;
  maxScore: number;
  expGained: number;
  feedback?: string | null;
  aiFeedbackSummary?: string | null;
  liffUrl?: string;
}): FlexMessage {
  const {
    studentName,
    assignmentTitle,
    score,
    maxScore,
    expGained,
    feedback,
    aiFeedbackSummary,
    liffUrl,
  } = params;

  const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
  
  let gradeBadgeColor = "#10b981"; // green
  let gradeBadgeText = "🌟 ยอดเยี่ยมมาก";
  if (percentage < 50) {
    gradeBadgeColor = "#ef4444"; // red
    gradeBadgeText = "⚠️ ควรพัฒนาเพิ่มเติม";
  } else if (percentage < 70) {
    gradeBadgeColor = "#f59e0b"; // amber
    gradeBadgeText = "👍 ผ่านเกณฑ์มาตรฐาน";
  } else if (percentage < 85) {
    gradeBadgeColor = "#3b82f6"; // blue
    gradeBadgeText = "✨ ทำได้ดีมาก";
  }

  const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const monsterUrl = liffUrl || `${appBaseUrl}/liff/monster`;

  return {
    type: "flex",
    altText: `🎯 ผลการตรวจงาน: ${assignmentTitle} (${score}/${maxScore} คะแนน)`,
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
                text: "🎯 ประกาศผลการตรวจงาน",
                color: "#94a3b8",
                weight: "bold",
                size: "xs",
              },
              {
                type: "text",
                text: `+${expGained} EXP ⭐`,
                color: "#fef08a",
                weight: "bold",
                size: "xs",
                align: "end",
              },
            ],
          },
          {
            type: "text",
            text: assignmentTitle,
            weight: "bold",
            color: "#ffffff",
            size: "lg",
            margin: "md",
            wrap: true,
          },
          {
            type: "text",
            text: `นักเรียน: ${studentName}`,
            color: "#cbd5e1",
            size: "xs",
            margin: "xs",
          },
        ],
      },
      body: {
        type: "box",
        layout: "vertical",
        spacing: "md",
        paddingAll: "20px",
        contents: [
          // Score Highlight Box
          {
            type: "box",
            layout: "horizontal",
            backgroundColor: "#f8fafc",
            cornerRadius: "16px",
            paddingAll: "16px",
            contents: [
              {
                type: "box",
                layout: "vertical",
                flex: 6,
                contents: [
                  {
                    type: "text",
                    text: "คะแนนที่ได้รับ",
                    size: "xs",
                    color: "#64748b",
                    weight: "bold",
                  },
                  {
                    type: "box",
                    layout: "baseline",
                    margin: "xs",
                    contents: [
                      {
                        type: "text",
                        text: `${score}`,
                        size: "3xl",
                        weight: "bold",
                        color: "#0f172a",
                      },
                      {
                        type: "text",
                        text: ` / ${maxScore}`,
                        size: "sm",
                        color: "#94a3b8",
                        weight: "bold",
                        margin: "xs",
                      },
                    ],
                  },
                ],
              },
              {
                type: "box",
                layout: "vertical",
                flex: 4,
                justifyContent: "center",
                alignItems: "flex-end",
                contents: [
                  {
                    type: "box",
                    layout: "vertical",
                    backgroundColor: gradeBadgeColor,
                    cornerRadius: "20px",
                    paddingStart: "10px",
                    paddingEnd: "10px",
                    paddingTop: "6px",
                    paddingBottom: "6px",
                    contents: [
                      {
                        type: "text",
                        text: `${percentage}%`,
                        color: "#ffffff",
                        weight: "bold",
                        size: "sm",
                        align: "center",
                      },
                    ],
                  },
                  {
                    type: "text",
                    text: gradeBadgeText,
                    color: gradeBadgeColor,
                    weight: "bold",
                    size: "xxs",
                    margin: "xs",
                    align: "center",
                  },
                ],
              },
            ],
          },

          // Teacher Feedback Box
          {
            type: "box",
            layout: "vertical",
            backgroundColor: "#f0fdf4",
            cornerRadius: "14px",
            paddingAll: "14px",
            borderColor: "#bbf7d0",
            borderWidth: "1px",
            contents: [
              {
                type: "text",
                text: "💬 ความคิดเห็นและคำแนะนำจากคุณครู",
                size: "xs",
                color: "#166534",
                weight: "bold",
              },
              {
                type: "text",
                text: feedback && feedback.trim() ? feedback : "ยินดีด้วยกับผลงานที่ตั้งใจทำ ขอให้รักษาความมุ่งมั่นในการเรียนรู้อย่างต่อเนื่อง!",
                size: "xs",
                color: "#1e293b",
                margin: "sm",
                wrap: true,
              },
            ],
          },

          // AI Rubric Evaluation Highlight (if present)
          ...(aiFeedbackSummary
            ? [
                {
                  type: "box" as const,
                  layout: "vertical" as const,
                  backgroundColor: "#faf5ff",
                  cornerRadius: "14px",
                  paddingAll: "12px",
                  borderColor: "#f3e8ff",
                  borderWidth: "1px",
                  contents: [
                    {
                      type: "text" as const,
                      text: "✨ ข้อเสนอแนะจาก AI (Rubric Assistant)",
                      size: "xxs" as const,
                      color: "#7e22ce",
                      weight: "bold" as const,
                    },
                    {
                      type: "text" as const,
                      text: aiFeedbackSummary,
                      size: "xxs" as const,
                      color: "#475569",
                      margin: "xs" as const,
                      wrap: true,
                      maxLines: 4,
                    },
                  ],
                },
              ]
            : []),

          // EXP Gamification notice
          {
            type: "box",
            layout: "horizontal",
            backgroundColor: "#fffbeb",
            cornerRadius: "12px",
            paddingAll: "10px",
            contents: [
              {
                type: "text",
                text: "🥚",
                size: "sm",
                flex: 1,
              },
              {
                type: "text",
                text: `คะแนนความตั้งใจนี้ถูกส่งเข้าไข่มอนสเตอร์ของคุณเรียบร้อยแล้ว (+${expGained} EXP)`,
                size: "xxs",
                color: "#92400e",
                wrap: true,
                flex: 9,
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
              label: "🥚 ส่องไข่มอนสเตอร์ของฉัน",
              uri: monsterUrl,
            },
          },
        ],
      },
    },
  };
}
