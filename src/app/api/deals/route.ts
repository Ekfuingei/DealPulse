import { NextRequest, NextResponse } from "next/server";
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
      .from("deals")
      .select("*")
      .order("updated_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json(data || []);
  } catch (err) {
    console.error("Deals fetch error:", err);
    return NextResponse.json(
      { error: "Failed to fetch deals" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const supabase = supabaseAdmin;
    if (!supabase) {
      return NextResponse.json(
        { error: "Database not configured" },
        { status: 500 }
      );
    }

    const { data, error } = await supabase.from("deals").insert({
      title: body.title,
      company: body.company,
      contact_name: body.contactName,
      contact_email: body.contactEmail,
      contact_phone: body.contactPhone,
      stage: body.stage || "lead",
      value: body.value,
      currency: body.currency || "USD",
      channel: body.channel || "whatsapp",
      source_id: body.sourceId,
    }).select().single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err) {
    console.error("Deal create error:", err);
    return NextResponse.json(
      { error: "Failed to create deal" },
      { status: 500 }
    );
  }
}
