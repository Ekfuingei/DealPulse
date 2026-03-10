"use client";

import type { Deal } from "@/types";
import { format } from "date-fns";
import { MessageCircle, Mail, Building2 } from "lucide-react";

const CHANNEL_ICONS: Record<string, typeof MessageCircle> = {
  whatsapp: MessageCircle,
  email: Mail,
  hubspot: Building2,
};

export function DealCard({ deal, onSelect }: { deal: Deal; onSelect?: () => void }) {
  const Icon = CHANNEL_ICONS[deal.channel] || MessageCircle;
  const valueStr = deal.value
    ? new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: deal.currency || "USD",
      }).format(deal.value)
    : null;

  return (
    <div
      onClick={onSelect}
      className="rounded-xl border border-zinc-800 bg-[var(--card)] p-4 hover:bg-[var(--card-hover)] cursor-pointer transition-colors"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-white truncate">{deal.title}</h3>
          {deal.company && (
            <p className="text-sm text-zinc-400 truncate mt-0.5">{deal.company}</p>
          )}
        </div>
        <span className="flex items-center gap-1 text-xs text-zinc-500 shrink-0">
          <Icon className="w-3.5 h-3.5" />
          {deal.channel}
        </span>
      </div>
      {valueStr && (
        <p className="text-sm font-medium text-emerald-400 mt-2">{valueStr}</p>
      )}
      {deal.lastActivityAt && (
        <p className="text-xs text-zinc-500 mt-2">
          {format(new Date(deal.lastActivityAt), "MMM d, HH:mm")}
        </p>
      )}
    </div>
  );
}
