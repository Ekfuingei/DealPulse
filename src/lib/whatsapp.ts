import twilio from "twilio";

function getTwilioClient() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_NUMBER;

  if (!accountSid || !authToken || !from) {
    throw new Error(
      "Twilio WhatsApp not configured: set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_NUMBER"
    );
  }

  return { client: twilio(accountSid, authToken), from };
}

/** Normalize phone to Twilio WhatsApp format (whatsapp:+1234567890) */
function toWhatsAppAddress(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  const normalized = digits.startsWith("+") ? phone : `+${digits}`;
  return normalized.startsWith("whatsapp:") ? normalized : `whatsapp:${normalized}`;
}

export async function sendWhatsAppMessage(
  to: string,
  message: string,
  _type?: "text" | "template"
): Promise<void> {
  const { client, from } = getTwilioClient();
  const toAddr = toWhatsAppAddress(to);

  await client.messages.create({
    from,
    to: toAddr,
    body: message,
  });
}

/**
 * Send a business-initiated WhatsApp template message (requires pre-approved template).
 * Use for first contact outside the 24-hour customer service window.
 * @param to - Recipient (e.g. whatsapp:+237655536083)
 * @param contentSid - Template SID from Twilio (e.g. HX...)
 * @param variables - Placeholder values for {{1}}, {{2}}, etc. e.g. { "1": "12/1", "2": "3pm" }
 */
export async function sendWhatsAppTemplateMessage(
  to: string,
  contentSid: string,
  variables: Record<string, string>
): Promise<void> {
  const { client, from } = getTwilioClient();
  const toAddr = toWhatsAppAddress(to);

  await client.messages.create({
    from,
    to: toAddr,
    contentSid,
    ...(Object.keys(variables).length > 0 && { contentVariables: JSON.stringify(variables) }),
  } as { from: string; to: string; contentSid: string; contentVariables?: string });
}

export async function markAsRead(_messageId: string): Promise<void> {
  // Twilio doesn't have a separate "mark as read" API for WhatsApp
  // Messages are implicitly delivered when we receive the webhook
}
