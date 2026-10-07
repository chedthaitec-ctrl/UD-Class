import { messagingApi } from "@line/bot-sdk";

export function getLineClient(): messagingApi.MessagingApiClient | null {
  const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN || "";
  if (!channelAccessToken || channelAccessToken === "YOUR_LINE_CHANNEL_ACCESS_TOKEN") {
    return null;
  }
  return new messagingApi.MessagingApiClient({
    channelAccessToken,
  });
}

/**
 * ส่งข้อความตอบกลับ Reply
 */
export async function replyLineMessage(replyToken: string, messages: any[]) {
  const client = getLineClient();
  if (!client) {
    console.log("⚠️ [LINE Client] LINE_CHANNEL_ACCESS_TOKEN is not configured. Reply suppressed:", messages);
    return false;
  }

  try {
    await client.replyMessage({
      replyToken,
      messages,
    });
    return true;
  } catch (error) {
    console.error("❌ [LINE Client] Reply error:", error);
    return false;
  }
}

/**
 * ส่งข้อความแบบ Push (เข้ากลุ่ม หรือรายบุคคล)
 */
export async function pushLineMessage(to: string, messages: any[]) {
  const client = getLineClient();
  if (!client) {
    console.log(`⚠️ [LINE Client] LINE_CHANNEL_ACCESS_TOKEN is not configured. Push to ${to} suppressed:`, messages);
    return false;
  }

  try {
    await client.pushMessage({
      to,
      messages,
    });
    return true;
  } catch (error) {
    console.error(`❌ [LINE Client] Push to ${to} error:`, error);
    return false;
  }
}
