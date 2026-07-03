"use client";

import { useState } from "react";
import { ChevronRight, ChevronDown } from "lucide-react";
import type { Decision } from "@/lib/api";
import { XpProgress, XpBadge } from "@/components/xp";

function confidenceOf(d: Decision): number {
  const c = d.confidence_snapshot?.confidence;
  return typeof c === "number" ? c : 0;
}

function fmtTime(ts: string): string {
  const d = new Date(ts);
  if (isNaN(d.getTime())) return ts;
  return d.toLocaleString([], {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Orchestrator decisions table with expandable reasoning + confidence bars. */
export function DecisionsTable({
  decisions,
  compact = false,
}: {
  decisions: Decision[];
  compact?: boolean;
}) {
  const [open, setOpen] = useState<Record<string, boolean>>({});

  if (decisions.length === 0) {
    return (
      <div className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-4 py-6 text-center text-[13px] text-[var(--text-secondary)]">
        No decisions yet — run the orchestrator to generate reasoning.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-[var(--border)]">
      <table className="sk-table">
        <thead>
          <tr>
            <th>Time</th>
            <th>Trigger</th>
            {!compact && <th>Reasoning</th>}
            <th>Action</th>
            <th className="w-[150px]">Confidence</th>
          </tr>
        </thead>
        <tbody>
          {decisions.map((d) => {
            const conf = confidenceOf(d);
            const isOpen = open[d.id];
            return (
              <tr key={d.id}>
                <td className="whitespace-nowrap text-[var(--text-secondary)]">
                  {fmtTime(d.created_at)}
                </td>
                <td>
                  <XpBadge color="#2563eb">{d.trigger}</XpBadge>
                </td>
                {!compact && (
                  <td>
                    <button
                      onClick={() => setOpen((o) => ({ ...o, [d.id]: !o[d.id] }))}
                      className="flex w-full items-start gap-1 text-left text-[var(--foreground)] hover:text-[var(--accent)]"
                    >
                      {isOpen ? (
                        <ChevronDown size={14} className="mt-0.5 shrink-0" />
                      ) : (
                        <ChevronRight size={14} className="mt-0.5 shrink-0" />
                      )}
                      <span className={isOpen ? "" : "line-clamp-2 max-w-[420px]"}>
                        {d.reasoning}
                      </span>
                    </button>
                  </td>
                )}
                <td>
                  <span className="font-semibold text-[var(--foreground)]">{d.action_taken}</span>
                </td>
                <td>
                  <XpProgress
                    value={conf * 100}
                    tone={conf >= 0.7 ? "green" : conf >= 0.4 ? "amber" : "teal"}
                    showValue
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
