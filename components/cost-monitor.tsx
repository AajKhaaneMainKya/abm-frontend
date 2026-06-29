"use client";

import { useQuery } from "@tanstack/react-query";
import { getCosts } from "@/lib/api";

function Bar({ pct }: { pct: number }) {
  const filled = Math.max(0, Math.min(10, Math.round((pct / 100) * 10)));
  return (
    <span className="inline-flex gap-[1px]">
      {Array.from({ length: 10 }).map((_, i) => (
        <span
          key={i}
          className={`h-3 w-2 ${i < filled ? "bg-[#1b5dbf]" : "bg-neutral-200"}`}
        />
      ))}
    </span>
  );
}

function fmt(n: number | undefined): string {
  return `$${(n ?? 0).toFixed(4)}`;
}

/** Real-time per-agent LLM cost panel. Backed by GET /api/costs (Phase H). */
export function CostMonitor() {
  const { data, isLoading } = useQuery({
    queryKey: ["costs"],
    queryFn: getCosts,
    refetchInterval: 60_000,
  });

  const agents = data?.by_agent ?? [];
  const max = Math.max(...agents.map((a) => a.cost_usd), 0.0001);

  return (
    <div className="xp-window !rounded-md">
      <div className="bg-[#d4d0c8] px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-[#0a246a]">
        💰 Cost Monitor
      </div>
      <div className="space-y-1 bg-white p-3 font-mono text-[12px] text-neutral-700">
        {isLoading ? (
          <div className="py-2 text-center text-neutral-400">Loading costs…</div>
        ) : agents.length === 0 ? (
          <div className="py-2 text-center text-neutral-400">No cost data yet.</div>
        ) : (
          agents.map((a) => (
            <div key={a.agent} className="flex items-center gap-2">
              <span className="w-32 truncate" title={a.agent}>{a.agent}</span>
              <span className="w-20 text-right tabular-nums">{fmt(a.cost_usd)}</span>
              <Bar pct={(a.cost_usd / max) * 100} />
              <span className="ml-auto text-[10px] text-neutral-400">{a.calls} calls</span>
            </div>
          ))
        )}

        <div className="mt-2 space-y-0.5 border-t border-[#d8d4c8] pt-2">
          <div className="flex justify-between">
            <span className="text-neutral-500">Today:</span>
            <span className="tabular-nums font-bold">{fmt(data?.today_usd)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-500">Per email avg:</span>
            <span className="tabular-nums font-bold">{fmt(data?.per_email_avg_usd)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-500">All-time:</span>
            <span className="tabular-nums font-bold">{fmt(data?.all_time_usd)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
