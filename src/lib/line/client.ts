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

/**
 * ดึงโปรไฟล์ของสมาชิกในกลุ่ม (ชื่อที่แสดง, รูปภาพ)
 */
export async function getGroupMemberProfile(
  groupId: string,
  userId: string
): Promise<{ displayName: string; pictureUrl?: string } | null> {
  const client = getLineClient();
  if (!client) return null;

  try {
    const profile = await client.getGroupMemberProfile(groupId, userId);
    return {
      displayName: profile.displayName || "นักเรียน LINE",
      pictureUrl: profile.pictureUrl,
    };
  } catch (error) {
    console.warn(`⚠️ [LINE Client] Could not fetch profile for user ${userId} in group ${groupId}`);
    return null;
  }
}

/**
 * ดึงข้อมูลกลุ่ม LINE (ชื่อกลุ่ม, รูปกลุ่ม)
 */
export async function getGroupSummary(
  groupId: string
): Promise<{ groupName?: string; pictureUrl?: string } | null> {
  const client = getLineClient();
  if (!client) return null;

  try {
    const summary = await client.getGroupSummary(groupId);
    return {
      groupName: summary.groupName,
      pictureUrl: summary.pictureUrl,
    };
  } catch (error) {
    console.warn(`⚠️ [LINE Client] Could not fetch group summary for ${groupId}`);
    return null;
  }
}

/**
 * ดึงรายชื่อ User ID ทั้งหมดในกลุ่ม (สำหรับ LINE Official Account ที่ได้รับสิทธิ์)
 */
export async function getGroupMembersIds(groupId: string): Promise<string[]> {
  const client = getLineClient();
  if (!client) return [];

  try {
    const memberIds: string[] = [];
    let start: string | undefined = undefined;

    do {
      const res: any = await client.getGroupMembersIds(groupId, start);
      if (res && res.memberIds && Array.isArray(res.memberIds)) {
        memberIds.push(...res.memberIds);
      }
      start = res?.next;
    } while (start);

    return memberIds;
  } catch (error) {
    // บัญชีแบบฟรี/ทั่วไปของ LINE อาจไม่ได้รับอนุญาตให้ใช้ API นี้ (จะ fallback ไปใช้วิธี auto-enroll ตอนสมาชิกแชทหรือเข้าร่วม)
    console.log(`ℹ️ [LINE Client] getGroupMembersIds not accessible for group ${groupId} (using event-based auto-enroll)`);
    return [];
  }
}
