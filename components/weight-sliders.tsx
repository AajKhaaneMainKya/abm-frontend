"use client";

/**
 * Ten scoring dimensions the Matching Agent traverses candidate context
 * graphs against (abm-system agents/matching_agent.py — WEIGHT_DIMENSIONS /
 * DEFAULT_WEIGHTS). Keys and default weights are mirrored here exactly so a
 * brief's `weights` payload lines up with what the backend expects.
 */
export const WEIGHT_DIMENSIONS: { key: string; label: string }[] = [
  { key: "zero_to_one", label: "Built something from 0 to 1" },
  { key: "scale_experience", label: "Scaled from 1 to 10+" },
  { key: "technical_depth", label: "Hands-on technical builder" },
  { key: "gtm_ownership", label: "Owns revenue and GTM" },
  { key: "ai_native", label: "Built with AI natively" },
  { key: "founding_team", label: "Founding team experience" },
  { key: "pedigree", label: "Brand name companies or institutions" },
  { key: "cultural_fit", label: "Writing voice and founder energy" },
  { key: "domain_depth", label: "Deep domain expertise" },
  { key: "location", label: "Physical location match" },
];

export const DEFAULT_WEIGHTS: Record<string, number> = {
  zero_to_one: 0.25,
  technical_depth: 0.2,
  gtm_ownership: 0.15,
  cultural_fit: 0.15,
  location: 0.1,
  ai_native: 0.05,
  founding_team: 0.05,
  pedigree: 0.03,
  scale_experience: 0.01,
  domain_depth: 0.01,
};

interface WeightSlidersProps {
  value: Record<string, number>;
  onChange: (next: Record<string, number>) => void;
}

export default function WeightSliders({ value, onChange }: WeightSlidersProps) {
  const totalPct = Math.round(Object.values(value).reduce((sum, v) => sum + v, 0) * 100);

  const setPct = (key: string, pct: number) => {
    onChange({ ...value, [key]: pct / 100 });
  };

  return (
    <div>
      <div className="space-y-3">
        {WEIGHT_DIMENSIONS.map(({ key, label }) => {
          const pct = Math.round((value[key] ?? 0) * 100);
          return (
            <div key={key} className="flex items-center gap-3">
              <span className="w-56 shrink-0 text-[13px] text-[var(--foreground)]">{label}</span>
              <input
                type="range"
                min={0}
                max={100}
                value={pct}
                onChange={(e) => setPct(key, Number(e.target.value))}
                className="h-1.5 flex-1 accent-[var(--accent)]"
                aria-label={label}
              />
              <span className="w-10 shrink-0 text-right text-[12px] font-semibold tabular-nums text-[var(--text-secondary)]">
                {pct}%
              </span>
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-[11px] text-[var(--text-secondary)]">
        Total: {totalPct}%
        {Math.abs(totalPct - 100) > 5 ? " — will be normalized to 100% when you post." : ""}
      </p>
    </div>
  );
}
