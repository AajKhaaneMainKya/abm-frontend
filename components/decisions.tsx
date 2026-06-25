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
      <div className="xp-inset px-4 py-6 text-center text-[13px] text-neutral-500">
        No decisions yet — run the orchestrator to generate reasoning.
      </div>
    );
  }

  return (
    <div className="xp-inset overflow-hidden">
      <table className="w-full border-collapse text-[12px]">
        <thead>
          <tr className="bg-[#d4d0c8] text-left text-[11px] uppercase tracking-wide text-neutral-600">
            <th className="px-2 py-1.5 font-bold">Time</th>
            <th className="px-2 py-1.5 font-bold">Trigger</th>
            {!compact && <th className="px-2 py-1.5 font-bold">Reasoning</th>}
            <th className="px-2 py-1.5 font-bold">Action</th>
            <th className="w-[150px] px-2 py-1.5 font-bold">Confidence</th>
          </tr>
        </thead>
        <tbody>
          {decisions.map((d) => {
            const conf = confidenceOf(d);
            const isOpen = open[d.id];
            return (
              <tr key={d.id} className="border-t border-[#e2dfd4] align-top">
                <td className="whitespace-nowrap px-2 py-2 text-neutral-500">
                  {fmtTime(d.created_at)}
                </td>
                <td className="px-2 py-2">
                  <XpBadge color="#316ac5">{d.trigger}</XpBadge>
                </td>
                {!compact && (
                  <td className="px-2 py-2">
                    <button
                      onClick={() => setOpen((o) => ({ ...o, [d.id]: !o[d.id] }))}
                      className="flex w-full items-start gap-1 text-left text-neutral-700 hover:text-[#0a246a]"
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
                <td className="px-2 py-2">
                  <span className="font-bold text-[#0a246a]">{d.action_taken}</span>
                </td>
                <td className="px-2 py-2">
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
