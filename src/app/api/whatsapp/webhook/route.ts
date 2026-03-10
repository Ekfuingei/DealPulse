import { NextRequest, NextResponse } from "next/server";

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || "dealpulse_webhook_secret";

export async function GET(req: NextRequest) {
  // Meta/Facebook webhook verification
  const searchParams = req.nextUrl.searchParams;
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    return new NextResponse(challenge ?? "", { status: 200 });
  }

  return new NextResponse("Forbidden", { status: 403 });
}

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";
    let from: string | undefined;
    let text: string;
    let messageId: string | undefined;

    if (contentType.includes("application/x-www-form-urlencoded")) {
      // Twilio webhook format
      const body = await req.text();
      const params = new URLSearchParams(body);
      from = params.get("From") || params.get("WaId") || undefined;
      text = params.get("Body") || "";
      messageId = params.get("MessageSid") || undefined;
      if (from && !from.startsWith("whatsapp:")) {
        const digits = from.replace(/\D/g, "");
        from = digits ? `whatsapp:+${digits}` : from;
      }
    } else {
      // Meta/Facebook webhook format
      const body = await req.json();
      const entry = body.entry?.[0];
      const changes = entry?.changes?.[0];
      const value = changes?.value;

      if (changes?.field !== "messages") {
        return NextResponse.json({ ok: true });
      }

      const message = value?.messages?.[0];
      from = message?.from;
      text = message?.text?.body || "";
      messageId = message?.id;
    }

    if (!from || !text.trim()) {
      return NextResponse.json({ ok: true });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    await fetch(`${appUrl}/api/agent/run`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        channel: "whatsapp",
        from,
        text,
        messageId,
      }),
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
