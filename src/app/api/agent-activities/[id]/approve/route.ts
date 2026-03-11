import { NextRequest, NextResponse } from "next/server";
import { sendWhatsAppMessage } from "@/lib/whatsapp";
import { logActivityToHubSpot } from "@/lib/hubspot";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { message: editedMessage } = body;

    const supabase = supabaseAdmin;
    if (!supabase) {
      return NextResponse.json(
        { error: "Database not configured" },
        { status: 500 }
      );
    }

    const { data: activity, error: fetchError } = await supabase
      .from("agent_activities")
      .select("id, deal_id, channel, content, status, metadata")
      .eq("id", id)
      .single();

    if (fetchError || !activity) {
      return NextResponse.json({ error: "Activity not found" }, { status: 404 });
    }

    if (activity.status !== "pending") {
      return NextResponse.json(
        { error: "Activity already processed" },
        { status: 400 }
      );
    }

    const messageToSend = editedMessage ?? activity.content;
    if (!messageToSend) {
      return NextResponse.json(
        { error: "No message to send" },
        { status: 400 }
      );
    }

    if (activity.channel === "whatsapp") {
      const meta = (activity.metadata ?? {}) as Record<string, string>;
      let recipient = meta.recipientPhone;
      if (!recipient && activity.deal_id) {
        const { data: deal } = await supabase
          .from("deals")
          .select("contact_phone")
          .eq("id", activity.deal_id)
          .single();
        recipient = deal?.contact_phone ?? undefined;
      }
      if (!recipient) {
        return NextResponse.json(
          { error: "Missing recipient for WhatsApp" },
          { status: 400 }
        );
      }
      try {
        await sendWhatsAppMessage(recipient, messageToSend);
      } catch (twilioErr) {
        const msg = twilioErr instanceof Error ? twilioErr.message : "Twilio send failed";
        console.error("WhatsApp send failed:", twilioErr);
        return NextResponse.json(
          { error: "Failed to send via WhatsApp", details: msg },
          { status: 500 }
        );
      }
    }
    // Messenger/Instagram: approve marks as sent but actual send requires Meta Graph API integration

    await supabase
      .from("agent_activities")
      .update({ status: "sent", type: "message_sent", content: messageToSend })
      .eq("id", id);

    if (activity.deal_id) {
      const { data: deal } = await supabase
        .from("deals")
        .select("source_id, channel")
        .eq("id", activity.deal_id)
        .single();

      if (deal?.source_id && deal.channel === "hubspot") {
        try {
          await logActivityToHubSpot({
            hubspotDealId: deal.source_id,
            body: messageToSend,
            channel: "whatsapp",
          });
        } catch (err) {
          console.warn("HubSpot log failed:", err);
        }
      }
    }

    return NextResponse.json({ ok: true, sent: true });
  } catch (err) {
    console.error("Approve error:", err);
    const msg = err instanceof Error ? err.message : "Approval failed";
    return NextResponse.json(
      { error: "Approval failed", details: msg },
      { status: 500 }
    );
  }
}
