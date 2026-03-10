"use client";

import { useEffect, useState, useCallback } from "react";
import { Pipeline } from "@/components/Pipeline";
import { AgentActivity, type AgentActivityWithMeta } from "@/components/AgentActivity";
import { ApprovalModal } from "@/components/ApprovalModal";
import type { Deal, AgentActivity as AgentActivityType } from "@/types";
import { BarChart3, Sparkles, RefreshCw, ExternalLink, AlertTriangle, Snowflake } from "lucide-react";
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

export default function DashboardPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [activities, setActivities] = useState<AgentActivityWithMeta[]>([]);
  const [stalled, setStalled] = useState<Array<Record<string, unknown>>>([]);
  const [cold, setCold] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [pendingApproval, setPendingApproval] = useState<AgentActivityWithMeta | null>(null);
  const [approving, setApproving] = useState(false);

  const refreshDeals = useCallback(() => {
    return fetch("/api/deals")
      .then((r) => r.json())
      .then((data) => setDeals(Array.isArray(data) ? data.map(mapDeal) : []));
  }, []);

  const refreshActivities = useCallback(() => {
    return fetch("/api/agent-activities")
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setActivities(
          list.map((a: Record<string, unknown>) => ({
            id: String(a.id),
            dealId: a.dealId ? String(a.dealId) : "",
            type: (a.type as AgentActivityType["type"]) || "draft",
            channel: (a.channel as AgentActivityType["channel"]) || "whatsapp",
            content: a.content ? String(a.content) : undefined,
            status: (a.status as AgentActivityType["status"]) || "pending",
            createdAt: String(a.createdAt),
            metadata: (a.metadata as Record<string, unknown>) ?? undefined,
          }))
        );
      });
  }, []);

  useEffect(() => {
    refreshDeals().catch(() => setDeals([])).finally(() => setLoading(false));
  }, [refreshDeals]);

  useEffect(() => {
    refreshActivities().catch(() => setActivities([]));
  }, [refreshActivities]);

  useEffect(() => {
    fetch("/api/deals/stalled")
      .then((r) => r.json())
      .then((data) => {
        setStalled(data.stalled || []);
        setCold(data.cold || []);
      })
      .catch(() => {});
  }, [deals]);

  const handleSyncHubSpot = async () => {
    setSyncing(true);
    try {
      const res = await fetch("/api/hubspot/sync", { method: "POST" });
      const data = await res.json();
      if (data.upserted !== undefined) {
        await refreshDeals();
      }
    } finally {
      setSyncing(false);
    }
  };

  const handleApproveRequest = (activity: AgentActivityWithMeta) => {
    setPendingApproval(activity);
  };

  const handleApprove = async (editedMessage?: string) => {
    if (!pendingApproval) return;
    setApproving(true);
    try {
      const res = await fetch(`/api/agent-activities/${pendingApproval.id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: editedMessage ?? pendingApproval.content }),
      });
      if (res.ok) {
        setPendingApproval(null);
        await refreshActivities();
        await refreshDeals();
      }
    } finally {
      setApproving(false);
    }
  };

  const prospectLabel = pendingApproval?.metadata
    ? (pendingApproval.metadata.recipientPhone as string) || (pendingApproval.metadata.recipientId as string)
    : undefined;

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <header className="sticky top-0 z-40 border-b border-zinc-800 bg-[var(--background)]/90 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-8 h-8 text-indigo-400" />
              <div>
                <h1 className="text-xl font-bold text-white">DealPulse</h1>
                <p className="text-xs text-zinc-500">Universal Sales Intelligence</p>
              </div>
            </div>
            <nav className="flex items-center gap-2">
              <Link
                href="/pipeline"
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Pipeline
              </Link>
              <button
                onClick={handleSyncHubSpot}
                disabled={syncing}
                className="flex items-center gap-2 rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} />
                Sync HubSpot
              </button>
            </nav>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {(stalled.length > 0 || cold.length > 0) && (
          <section className="mb-8">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-white mb-4">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              Stalled & cold deals
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {stalled.length > 0 && (
                <div className="rounded-xl border border-amber-800/50 bg-amber-950/20 p-4">
                  <p className="text-sm font-medium text-amber-400 mb-2">
                    Stalled ({stalled.length}) — no activity 7+ days
                  </p>
                  <ul className="space-y-1 text-sm text-zinc-400">
                    {stalled.slice(0, 5).map((d) => (
                      <li key={String(d.id)}>
                        {String(d.title)} · {d.daysSinceActivity as number}d
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {cold.length > 0 && (
                <div className="rounded-xl border border-zinc-700 bg-zinc-900/50 p-4">
                  <p className="flex items-center gap-2 text-sm font-medium text-zinc-400 mb-2">
                    <Snowflake className="w-4 h-4" />
                    Cold ({cold.length}) — no activity 14+ days
                  </p>
                  <ul className="space-y-1 text-sm text-zinc-500">
                    {cold.slice(0, 5).map((d) => (
                      <li key={String(d.id)}>
                        {String(d.title)} · {d.daysSinceActivity as number}d
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </section>
        )}

        <section className="mb-8">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-white mb-4">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            Deal pipeline
          </h2>
          {loading ? (
            <div className="rounded-xl border border-zinc-800 bg-[var(--card)] p-12 text-center text-zinc-500">
              Loading deals…
            </div>
          ) : (
            <Pipeline deals={deals} />
          )}
        </section>

        <section>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-white mb-4">
            Agent activity
          </h2>
          <AgentActivity
            activities={activities}
            onApproveRequest={handleApproveRequest}
          />
        </section>
      </main>

      <ApprovalModal
        isOpen={!!pendingApproval}
        onClose={() => setPendingApproval(null)}
        message={pendingApproval?.content ?? ""}
        prospect={prospectLabel}
        channel={pendingApproval?.channel}
        onApprove={(edited) => handleApprove(edited)}
        isLoading={approving}
      />
    </div>
  );
}
