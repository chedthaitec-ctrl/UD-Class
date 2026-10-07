import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { dispatchLineEvent } from "@/lib/line/dispatcher";
import { replyLineMessage } from "@/lib/line/client";

export const dynamic = "force-dynamic";

function validateSignature(body: string, channelSecret: string, signature: string): boolean {
  if (!channelSecret || channelSecret === "YOUR_LINE_CHANNEL_SECRET") {
    // โหมด Development อนุญาตให้ผ่านได้ถ้ายังไม่ได้ตั้งค่า Secret
    return true;
  }
  const hash = crypto
    .createHmac("sha256", channelSecret)
    .update(body)
    .digest("base64");
  return hash === signature;
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-line-signature") || "";
    const channelSecret = process.env.LINE_CHANNEL_SECRET || "";

    // ตรวจสอบ Signature
    const isValid = validateSignature(rawBody, channelSecret, signature);
    if (!isValid) {
      console.warn("⚠️ Invalid LINE Webhook signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
    }

    const payload = JSON.parse(rawBody);
    const events = payload.events || [];

    // ประมวลผลทุก Event
    for (const event of events) {
      const result = await dispatchLineEvent(event);
      if (result.replyMessages && result.replyMessages.length > 0 && event.replyToken) {
        await replyLineMessage(event.replyToken, result.replyMessages);
      }
    }

    return NextResponse.json({ status: "success", processedEvents: events.length });
  } catch (error: any) {
    console.error("❌ LINE Webhook Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    status: "online",
    system: "UD-Class LINE Bot Webhook",
    timestamp: new Date().toISOString(),
  });
}
