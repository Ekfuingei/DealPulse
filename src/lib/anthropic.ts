import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export type DraftContext = {
  prospectName: string;
  company?: string;
  channel: "email" | "whatsapp" | "messenger";
  research?: string;
  previousMessages?: string[];
};

export async function draftMessage(context: DraftContext): Promise<string> {
  const channelTone =
    context.channel === "email"
      ? "formal, professional"
      : "casual, warm, culturally-aware";

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `Draft a ${context.channel} follow-up message for this prospect. 
Channel: ${context.channel}. 
Tone: ${channelTone}.

Prospect: ${context.prospectName}${context.company ? ` at ${context.company}` : ""}
${context.research ? `Research notes:\n${context.research}` : ""}
${context.previousMessages?.length ? `Previous exchange:\n${context.previousMessages.join("\n---\n")}` : ""}

Write only the message body, no subject line or preamble.`,
      },
    ],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  return textBlock && "text" in textBlock ? textBlock.text : "";
}

export { anthropic };
