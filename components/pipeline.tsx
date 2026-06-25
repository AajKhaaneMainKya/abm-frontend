"use client";

import { PIPELINE_STATES, stateColors } from "@/lib/design";
import { XpProgress } from "@/components/xp";

/**
 * Account pipeline as a stack of chunky XP progress bars, one per state.
 * Each bar is scaled against the largest state count so the shape of the
 * funnel is readable at a glance.
 */
export function PipelineBars({ pipeline }: { pipeline: Record<string, number> }) {
  const max = Math.max(1, ...Object.values(pipeline ?? {}));

  return (
    <div className="space-y-2.5">
      {PIPELINE_STATES.map((state) => {
        const count = pipeline?.[state] ?? 0;
        const pct = (count / max) * 100;
        const tone =
          state === "REPLIED" || state === "ENRICHED" ? "teal" : "green";
        return (
          <div key={state} className="grid grid-cols-[120px_1fr_40px] items-center gap-2">
            <span
              className="text-[11px] font-bold uppercase tracking-wide"
              style={{ color: stateColors[state] ?? "#333" }}
            >
              {state}
            </span>
            <XpProgress value={pct} tone={tone} />
            <span className="text-right text-[13px] font-bold tabular-nums text-neutral-700">
              {count}
            </span>
          </div>
        );
      })}
    </div>
  );
}
