import { NextRequest, NextResponse } from "next/server";
import { dispatchLineEvent } from "@/lib/line/dispatcher";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { text, type = "message", groupId, userId, postbackData } = await req.json();

    const mockEvent: any = {
      type,
      source: {
        type: groupId ? "group" : "user",
        groupId: groupId || undefined,
        userId: userId || "U_mock_student_01",
      },
      timestamp: Date.now(),
      replyToken: "mock-reply-token",
    };

    if (type === "message") {
      mockEvent.message = {
        type: "text",
        id: `mock-msg-${Date.now()}`,
        text,
      };
    } else if (type === "postback") {
      mockEvent.postback = {
        data: postbackData,
      };
    } else if (type === "join") {
      mockEvent.type = "join";
    }

    const result = await dispatchLineEvent(mockEvent);

    return NextResponse.json({
      success: true,
      event: mockEvent,
      replyMessages: result.replyMessages,
      actionTaken: result.actionTaken,
    });
  } catch (error: any) {
    console.error("Simulation error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
