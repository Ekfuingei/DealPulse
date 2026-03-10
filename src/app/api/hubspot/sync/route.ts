import { NextResponse } from "next/server";
import { syncDealsFromHubSpot } from "@/lib/hubspot";
import { supabaseAdmin } from "@/lib/supabase";

const STAGE_MAP: Record<string, string> = {
  appointmentscheduled: "qualifying",
  qualifiedtobuy: "qualifying",
  presentationscheduled: "proposal",
  decisionmakerboughtin: "proposal",
  contractsent: "negotiation",
  closedwon: "won",
  closedlost: "lost",
};

export async function POST() {
  try {
    const { deals } = await syncDealsFromHubSpot();
    const supabase = supabaseAdmin;

    if (!supabase) {
      return NextResponse.json(
        { error: "Supabase not configured" },
        { status: 500 }
      );
    }

    let upserted = 0;
    for (const d of deals) {
      const stage =
        STAGE_MAP[d.dealstage?.toLowerCase() || ""] || "qualifying";
      const { error } = await supabase.from("deals").upsert(
        {
          source_id: d.id,
          title: d.dealname,
          stage,
          value: d.amount,
          channel: "hubspot",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "source_id" }
      );
      if (!error) upserted++;
    }

    return NextResponse.json({ synced: deals.length, upserted });
  } catch (err) {
    console.error("HubSpot sync error:", err);
    return NextResponse.json(
      { error: "Sync failed" },
      { status: 500 }
    );
  }
}
