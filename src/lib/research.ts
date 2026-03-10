/**
 * Prospect research — news, social signals, business activity.
 * Uses web search when available; otherwise returns placeholder for Claude to use.
 */

export async function researchProspect(params: {
  prospectName: string;
  company?: string;
  contactEmail?: string;
  contactPhone?: string;
}): Promise<string> {
  const { prospectName, company, contactEmail, contactPhone } = params;

  // In production: integrate with Clearbit, LinkedIn, news APIs, etc.
  // For hackathon: use Claude to synthesize research from name/company if provided
  const parts: string[] = [];

  if (company) {
    parts.push(`Company: ${company}`);
  }
  if (contactEmail) {
    const domain = contactEmail.split("@")[1];
    if (domain) parts.push(`Email domain: ${domain} (possible company signal)`);
  }
  if (contactPhone) {
    const digits = contactPhone.replace(/\D/g, "");
    if (digits.length >= 10) parts.push(`Phone: ${contactPhone} (country/region signal)`);
  }

  if (parts.length > 0) {
    return `Prospect: ${prospectName}\n${parts.join("\n")}\n\nUse this context to personalize the message. Consider industry, company size, and cultural norms for the prospect's likely region.`;
  }

  return `Prospect: ${prospectName}. No additional research data available. Draft a warm, personalized message based on the conversation context.`;
}
