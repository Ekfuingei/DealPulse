"use client";

import type { AgentActivity as AgentActivityType } from "@/types";
import { Sparkles, FileText, CheckCircle, Send } from "lucide-react";
import { format } from "date-fns";

export type AgentActivityWithMeta = AgentActivityType & { metadata?: Record<string, unknown> };

const TYPE_CONFIG: Record<
  string,
  { icon: typeof Sparkles; label: string; color: string }
> = {
  research: { icon: Sparkles, label: "Research", color: "text-violet-400" },
  draft: { icon: FileText, label: "Draft", color: "text-amber-400" },
  approval_sent: { icon: CheckCircle, label: "Awaiting approval", color: "text-blue-400" },
  message_sent: { icon: Send, label: "Sent", color: "text-emerald-400" },
  logged: { icon: CheckCircle, label: "Logged", color: "text-zinc-400" },
};

interface AgentActivityProps {
  activities: AgentActivityWithMeta[];
  onApproveRequest?: (activity: AgentActivityWithMeta) => void;
}

export function AgentActivity({ activities, onApproveRequest }: AgentActivityProps) {
  if (!activities.length) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-[var(--card)] p-6 text-center text-zinc-500">
        No agent activity yet
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {activities.map((activity) => {
        const config = TYPE_CONFIG[activity.type] || {
          icon: Sparkles,
          label: activity.type,
          color: "text-zinc-400",
        };
        const Icon = config.icon;
        const isPending = activity.type === "approval_sent" && activity.status === "pending";

        return (
          <div
            key={activity.id}
            className="flex gap-3 rounded-xl border border-zinc-800 bg-[var(--card)] p-3"
          >
            <div className={`shrink-0 ${config.color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <p className="font-medium text-white">{config.label}</p>
                {isPending && onApproveRequest && (
                  <button
                    onClick={() => onApproveRequest(activity)}
                    className="shrink-0 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-500 transition-colors"
                  >
                    Approve & send
                  </button>
                )}
              </div>
              {activity.content && (
                <p className="text-sm text-zinc-400 mt-1 line-clamp-2">
                  {activity.content}
                </p>
              )}
              <p className="text-xs text-zinc-500 mt-2">
                {format(new Date(activity.createdAt), "MMM d, HH:mm")} · {activity.channel}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
