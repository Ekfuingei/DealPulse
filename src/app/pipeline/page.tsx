"use client";

import { useEffect, useState } from "react";
import { Pipeline } from "@/components/Pipeline";
import type { Deal } from "@/types";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

function mapDeal(d: Record<string, unknown>): Deal {
  return {
    id: String(d.id),
    title: String(d.title || "Untitled"),
    company: d.company ? String(d.company) : undefined,
    contactName: d.contact_name ? String(d.contact_name) : undefined,
    contactEmail: d.contact_email ? String(d.contact_email) : undefined,
    contactPhone: d.contact_phone ? String(d.contact_phone) : undefined,
    stage: (d.stage as Deal["stage"]) || "lead",
    value: typeof d.value === "number" ? d.value : undefined,
    currency: d.currency ? String(d.currency) : undefined,
    channel: (d.channel as Deal["channel"]) || "whatsapp",
    lastActivityAt: d.last_activity_at ? String(d.last_activity_at) : undefined,
    createdAt: String(d.created_at),
    updatedAt: String(d.updated_at),
    sourceId: d.source_id ? String(d.source_id) : undefined,
  };
}

export default function PipelinePage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/deals")
      .then((r) => r.json())
      .then((data) => setDeals(Array.isArray(data) ? data.map(mapDeal) : []))
      .catch(() => setDeals([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <header className="sticky top-0 z-40 border-b border-zinc-800 bg-[var(--background)]/90 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link
              href="/"
              className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-white mb-6">Pipeline view</h1>
        {loading ? (
          <div className="rounded-xl border border-zinc-800 bg-[var(--card)] p-12 text-center text-zinc-500">
            Loading…
          </div>
        ) : (
          <Pipeline deals={deals} />
        )}
      </main>
    </div>
  );
}
