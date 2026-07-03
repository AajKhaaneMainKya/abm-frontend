"use client";

import { useQuery } from "@tanstack/react-query";
import { getCosts } from "@/lib/api";
import { useClientList } from "@/components/client-select";
import { useActiveClient } from "@/components/active-client";

function Bar({ pct }: { pct: number }) {
  const filled = Math.max(0, Math.min(10, Math.round((pct / 100) * 10)));
  return (
    <span className="inline-flex gap-[1px]">
      {Array.from({ length: 10 }).map((_, i) => (
        <span
          key={i}
          className={`h-3 w-2 rounded-[1px] ${i < filled ? "bg-[var(--accent)]" : "bg-[var(--surface-hover)]"}`}
        />
      ))}
    </span>
  );
}

function fmt(n: number | undefined): string {
  return `$${(n ?? 0).toFixed(4)}`;
}

/** Per-client real-time LLM cost panel. Backed by GET /api/costs?client_id= (Phase H). */
export function CostMonitor() {
  const { data: clients } = useClientList();
  const { activeClientId } = useActiveClient();
  const clientId = activeClientId ?? clients?.[0]?.id ?? null;
  const clientName = clients?.find((c) => c.id === clientId)?.name;

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["costs", clientId],
    queryFn: () => getCosts(clientId),
    refetchInterval: 10_000, // live: refresh as agents run
  });

  const agents = data?.by_agent ?? [];
  const max = Math.max(...agents.map((a) => a.cost_usd), 0.0001);

  return (
    <div className="card-flush">
      <div className="card-header">
        {/* Live indicator — steady green dot, pulses while a refresh is in flight */}
        <span className="relative inline-flex h-2.5 w-2.5" title="Live — refreshes every 10s">
          {isFetching && (
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
          )}
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500" />
        </span>
        Cost Monitor{clientName ? ` — ${clientName}` : ""}
      </div>
      <div className="space-y-1 p-3 font-mono text-[12px] text-[var(--foreground)]">
        {isLoading ? (
          <div className="py-2 text-center text-[var(--text-secondary)]">Loading costs…</div>
        ) : agents.length === 0 ? (
          <div className="py-2 text-center text-[var(--text-secondary)]">No cost data yet for this client.</div>
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

        <div className="mt-2 space-y-0.5 border-t border-[var(--border)] pt-2">
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
