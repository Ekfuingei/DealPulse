import { NextRequest, NextResponse } from "next/server";
import { sendWhatsAppTemplateMessage } from "@/lib/whatsapp";

/**
 * POST /api/whatsapp/send-template
 * Send a business-initiated WhatsApp template message.
 * Body: { to: "whatsapp:+237655536083", contentSid: "HX...", variables: { "1": "12/1", "2": "3pm" } }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { to, contentSid, variables } = body;

    if (!to || !contentSid) {
      return NextResponse.json(
        { error: "Missing required fields: to, contentSid" },
        { status: 400 }
      );
    }

    await sendWhatsAppTemplateMessage(to, contentSid, variables ?? {});

    return NextResponse.json({ ok: true, sent: true });
  } catch (err) {
    console.error("Send template error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to send template" },
      { status: 500 }
    );
  }
}
