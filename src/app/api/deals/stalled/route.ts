import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

const STALLED_DAYS = 7;
const COLD_DAYS = 14;

function daysSince(dateStr: string | null): number {
  if (!dateStr) return 999;
  const d = new Date(dateStr);
  const now = new Date();
  return (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24);
}

export async function GET() {
  try {
    const supabase = supabaseAdmin;
    if (!supabase) {
      return NextResponse.json(
        { error: "Database not configured" },
        { status: 500 }
      );
    }

    const { data: allDeals, error } = await supabase
      .from("deals")
      .select("*")
      .order("updated_at", { ascending: false });

    if (error) throw error;

    const closedStages = ["won", "lost"];
    const deals = (allDeals || []).filter((d) => !closedStages.includes(d.stage));

    const stalled: Array<Record<string, unknown>> = [];
    const cold: Array<Record<string, unknown>> = [];

    for (const d of deals) {
      const lastActivity = d.last_activity_at ?? d.updated_at;
      const days = daysSince(lastActivity);

      const deal = {
        id: d.id,
        title: d.title,
        company: d.company,
        contact_name: d.contact_name,
        stage: d.stage,
        channel: d.channel,
        value: d.value,
        last_activity_at: d.last_activity_at,
        daysSinceActivity: Math.floor(days),
      };

      if (days >= COLD_DAYS) cold.push(deal);
      else if (days >= STALLED_DAYS) stalled.push(deal);
    }

    return NextResponse.json({
      stalled,
      cold,
      stalledDays: STALLED_DAYS,
      coldDays: COLD_DAYS,
    });
  } catch (err) {
    console.error("Stalled deals error:", err);
    return NextResponse.json(
      { error: "Failed to fetch stalled deals" },
      { status: 500 }
    );
  }
}
