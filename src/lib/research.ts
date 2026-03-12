/** Country code to region (for personalization) */
const PHONE_REGIONS: Record<string, string> = {
  "237": "Cameroon",
  "234": "Nigeria",
  "233": "Ghana",
  "254": "Kenya",
  "255": "Tanzania",
  "250": "Rwanda",
  "256": "Uganda",
  "27": "South Africa",
};

export async function researchProspect(params: {
  prospectName: string;
  company?: string;
  contactEmail?: string;
  contactPhone?: string;
}): Promise<string> {
  const { prospectName, company, contactEmail, contactPhone } = params;

  const parts: string[] = [];

  if (company) {
    parts.push(`Company: ${company}`);
  }
  if (contactEmail) {
    const domain = contactEmail.split("@")[1];
    if (domain) parts.push(`Email domain: ${domain}`);
  }
  if (contactPhone) {
    const digits = contactPhone.replace(/\D/g, "");
    if (digits.length >= 10) {
      const countryCode =
        digits.startsWith("237") ? "237" :
        digits.startsWith("234") ? "234" :
        digits.startsWith("233") ? "233" :
        digits.startsWith("254") ? "254" :
        digits.startsWith("255") ? "255" :
        digits.startsWith("250") ? "250" :
        digits.startsWith("256") ? "256" :
        digits.startsWith("27") ? "27" : null;
      const region = countryCode ? PHONE_REGIONS[countryCode] : null;
      parts.push(`Phone: ${contactPhone}${region ? ` — likely ${region}` : ""}`);
    }
  }

  const base = `Prospect identifier: ${prospectName}`;
  if (parts.length > 0) {
    return `${base}\n${parts.join("\n")}\n\nPersonalize using this context. Consider cultural norms and business practices for the prospect's region.`;
  }
  return `${base}. Use the conversation context to draft a warm, personalized message.`;
}
