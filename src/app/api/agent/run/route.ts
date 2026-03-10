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
  const { metadata, ...rest } = params;
  const { data } = await supabase.from("agent_activities").insert({
    ...rest,
    metadata: metadata ?? null,
  }).select("id").single();
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
      const prospectName = String(from);
      const research = await researchProspect({
        prospectName,
        contactPhone: prospectName,
      });

      let dealId = providedDealId;
      if (!dealId) {
        dealId = await createOrGetDealFromConversation(channel, prospectName);
      }

      const draftChannel = channel === "instagram" ? "messenger" : channel;
      let draft: string;
      if (isAiriaConfigured()) {
        try {
          draft = await runAiriaAgent({
            prospectName,
            channel,
            research,
            previousMessages: text ? [text] : undefined,
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
