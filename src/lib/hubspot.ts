import axios from "axios";

const HUBSPOT_API = "https://api.hubapi.com";

function getHeaders() {
  const token = process.env.HUBSPOT_ACCESS_TOKEN;
  if (!token) throw new Error("HubSpot access token not configured");
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

export async function syncDealsFromHubSpot(): Promise<{
  synced: number;
  deals: Array<{
    id: string;
    dealname: string;
    amount?: number;
    dealstage?: string;
    closedate?: string;
  }>;
}> {
  const res = await axios.get(
    `${HUBSPOT_API}/crm/v3/objects/deals?limit=100`,
    { headers: getHeaders() }
  );

  const deals = res.data.results || [];
  return {
    synced: deals.length,
    deals: deals.map((d: { id: string; properties: Record<string, string> }) => ({
      id: d.id,
      dealname: d.properties?.dealname || "Untitled",
      amount: d.properties?.amount ? parseFloat(d.properties.amount) : undefined,
      dealstage: d.properties?.dealstage,
      closedate: d.properties?.closedate,
    })),
  };
}

export async function getHubSpotContact(email: string) {
  const res = await axios.post(
    `${HUBSPOT_API}/crm/v3/objects/contacts/search`,
    {
      filterGroups: [{ filters: [{ propertyName: "email", operator: "EQ", value: email }] }],
    },
    { headers: getHeaders() }
  );
  return res.data.results?.[0] || null;
}

/** Log agent activity (note) back to HubSpot as source of truth. Call only when deal has HubSpot source_id. */
export async function logActivityToHubSpot(params: {
  hubspotDealId: string;
  body: string;
  channel?: string;
}): Promise<void> {
  const { hubspotDealId, body, channel } = params;

  try {
    await axios.post(
      `${HUBSPOT_API}/crm/v3/objects/notes`,
      {
        properties: {
          hs_timestamp: new Date().toISOString(),
          hs_note_body: `[DealPulse ${channel || "agent"}] ${body}`,
        },
        associations: [
          {
            to: { id: hubspotDealId },
            types: [{ associationCategory: "HUBSPOT_DEFINED", associationTypeId: 214 }],
          },
        ],
      },
      { headers: getHeaders() }
    );
  } catch (err) {
    console.error("HubSpot log activity error:", err);
    throw err;
  }
}
