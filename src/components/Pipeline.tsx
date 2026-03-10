"use client";

import { useMemo } from "react";
import type { Deal, DealStage } from "@/types";
import { DealCard } from "./DealCard";

const STAGES: { stage: DealStage; label: string }[] = [
  { stage: "lead", label: "Lead" },
  { stage: "qualifying", label: "Qualifying" },
  { stage: "proposal", label: "Proposal" },
  { stage: "negotiation", label: "Negotiation" },
  { stage: "won", label: "Won" },
  { stage: "lost", label: "Lost" },
];

interface PipelineProps {
  deals: Deal[];
  onDealSelect?: (deal: Deal) => void;
}

export function Pipeline({ deals, onDealSelect }: PipelineProps) {
  const columns = useMemo(() => {
    return STAGES.map(({ stage, label }) => ({
      stage,
      label,
      deals: deals.filter((d) => d.stage === stage),
    }));
  }, [deals]);

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 min-h-[400px]">
      {columns.map((col) => (
        <div
          key={col.stage}
          className="flex-shrink-0 w-72 rounded-xl border border-zinc-800 bg-[var(--card)] p-3"
        >
          <h3 className="font-semibold text-zinc-300 mb-3 sticky top-0 bg-[var(--card)] py-1">
            {col.label}
            <span className="ml-2 text-xs text-zinc-500">({col.deals.length})</span>
          </h3>
          <div className="space-y-2">
            {col.deals.map((deal) => (
              <DealCard
                key={deal.id}
                deal={deal}
                onSelect={() => onDealSelect?.(deal)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
