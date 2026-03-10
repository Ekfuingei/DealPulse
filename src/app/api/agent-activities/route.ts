import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  try {
    const supabase = supabaseAdmin;
    if (!supabase) {
      return NextResponse.json(
        { error: "Database not configured" },
        { status: 500 }
      );
    }

    const { data, error } = await supabase
      .from("agent_activities")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) throw error;

    const activities = (data || []).map((a) => ({
      id: a.id,
      dealId: a.deal_id,
      type: a.type,
      channel: a.channel,
      content: a.content,
      status: a.status,
      createdAt: a.created_at,
      metadata: a.metadata,
    }));

    return NextResponse.json(activities);
  } catch (err) {
    console.error("Agent activities fetch error:", err);
    return NextResponse.json(
      { error: "Failed to fetch activities" },
      { status: 500 }
    );
  }
}
