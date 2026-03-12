import { NextRequest, NextResponse } from "next/server";
import { draftMessage } from "@/lib/anthropic";
import { runAiriaAgent, isAiriaConfigured } from "@/lib/airia";
import { researchProspect } from "@/lib/research";
import { sendWhatsAppMessage } from "@/lib/whatsapp";
import { logActivityToHubSpot } from "@/lib/hubspot";
import { supabaseAdmin } from "@/lib/supabase";

async function logActivity(params: {
  dealId?: string;
  type: "research" | "draft" | "approval_sent" | "message_sent" | "logged";
  channel: string;
  content?: string;
  status: "pending" | "approved" | "rejected" | "sent";
  metadata?: Record<string, unknown>;
}) {
  const supabase = supabaseAdmin;
  if (!supabase) return;
  const { dealId, metadata, ...rest } = params;
  const { data, error } = await supabase
    .from("agent_activities")
    .insert({
      deal_id: dealId ?? null,
      type: rest.type,
      channel: rest.channel,
      content: rest.content ?? null,
      status: rest.status,
      metadata: metadata ?? null,
    })
    .select("id")
    .single();
  if (error) {
    console.error("Agent activity insert failed:", error);
    return;
  }
  return data?.id;
}

function normalizePhoneForSourceId(addr: string): string {
  return addr.replace(/\D/g, "") || addr;
}

async function createOrGetDealFromConversation(
  channel: string,
  senderId: string,
  contactName?: string
): Promise<string | undefined> {
  const supabase = supabaseAdmin;
  if (!supabase) return undefined;

  const prefix = channel === "whatsapp" ? "wa_" : channel === "messenger" ? "fb_" : "ig_";
  const normalized = channel === "whatsapp" ? normalizePhoneForSourceId(senderId) : senderId;
  const sourceId = `${prefix}${normalized}`;

  const { data: existing } = await supabase
    .from("deals")
    .select("id")
    .eq("source_id", sourceId)
    .single();

  const now = new Date().toISOString();
  if (existing) {
    await supabase
      .from("deals")
      .update({
        last_activity_at: now,
        updated_at: now,
        contact_name: contactName || undefined,
        contact_phone: channel === "whatsapp" ? (senderId.startsWith("+") ? senderId : `+${normalizePhoneForSourceId(senderId)}`) : undefined,
      })
      .eq("id", existing.id);
    return existing.id;
  }

  const title =
    contactName ||
    (channel === "whatsapp" ? `WhatsApp ${senderId}` : channel === "messenger" ? `Messenger ${senderId}` : `Instagram ${senderId}`);

  const { data: inserted } = await supabase
    .from("deals")
    .insert({
      title,
      channel,
      stage: "lead",
      source_id: sourceId,
      contact_phone: channel === "whatsapp" ? senderId : undefined,
      contact_name: contactName,
      last_activity_at: now,
    })
    .select("id")
    .single();

  return inserted?.id;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { channel, from, text, messageId, dealId: providedDealId } = body;

    const supportedChannels = ["whatsapp", "messenger", "instagram", "email"];
    if (supportedChannels.includes(channel)) {
      const senderId = String(from);
      const research = await researchProspect({
        prospectName: senderId,
        contactPhone: senderId,
      });

      let dealId = providedDealId;
      if (!dealId) {
        dealId = await createOrGetDealFromConversation(channel, senderId);
      }

      // Use contact_name from deal when available, else sender ID (e.g. whatsapp:+237...)
      let prospectName = senderId;
      if (dealId && supabaseAdmin) {
        const { data: deal } = await supabaseAdmin
          .from("deals")
          .select("contact_name")
          .eq("id", dealId)
          .single();
        if (deal?.contact_name) prospectName = deal.contact_name;
      }

      const draftChannel = channel === "instagram" ? "messenger" : channel;
      let draft: string;
      if (isAiriaConfigured()) {
        try {
          draft = await runAiriaAgent({
            prospectName,
            channel,
            research,
            previousMessages: text?.trim() ? [text.trim()] : undefined,
          });
        } catch (err) {
          console.warn("Airia failed, falling back to Claude:", err);
          draft = await draftMessage({
            prospectName,
            channel: draftChannel as "email" | "whatsapp" | "messenger",
            research,
            previousMessages: text ? [text] : undefined,
          });
        }
      } else {
        draft = await draftMessage({
          prospectName,
          channel: draftChannel as "email" | "whatsapp" | "messenger",
          research,
          previousMessages: text ? [text] : undefined,
        });
      }

      const sendDirectly = process.env.AGENT_SEND_DIRECTLY === "true";
      const canSendDirectly = channel === "whatsapp";

      if (sendDirectly && draft && canSendDirectly) {
        await sendWhatsAppMessage(from, draft);
        await logActivity({
          dealId,
          type: "message_sent",
          channel,
          content: draft,
          status: "sent",
        });
      } else if (draft) {
        await logActivity({
          dealId,
          type: "approval_sent",
          channel,
          content: draft,
          status: "pending",
          metadata: canSendDirectly ? { recipientPhone: from } : { recipientId: from },
        });
      } else {
        await logActivity({
          dealId,
          type: "logged",
          channel,
          content: "Agent processed incoming message",
          status: "sent",
        });
      }

      return NextResponse.json({
        drafted: !!draft,
        message: draft,
        approvalRequired: !sendDirectly || !canSendDirectly,
        dealId,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Agent run error:", err);
    return NextResponse.json(
      { error: "Agent failed" },
      { status: 500 }
    );
  }
}
