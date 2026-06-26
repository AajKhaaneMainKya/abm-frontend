"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Users, Mail, Flame } from "lucide-react";
import { getHandoffs, type Handoff } from "@/lib/api";
import { useClientList } from "@/components/client-select";
import { Loading, ErrorNote, XpBadge, XpProgress } from "@/components/xp";
import { AppToolbar } from "@/components/apps/app-toolbar";

function HandoffCard({ h }: { h: Handoff }) {
  const score = h.intent_score ?? 0;
  return (
    <div className="xp-window !rounded-md">
      <div className="flex items-center gap-2 bg-[#d4d0c8] px-3 py-1.5">
        <Users size={14} className="text-[#0a246a]" />
        <span className="text-[12px] font-bold text-[#0a246a]">{h.company ?? "—"}</span>
        <XpBadge color={h.urgency === "high" ? "#a02020" : "#316ac5"} className="ml-auto uppercase">
          <Flame size={11} /> {h.urgency}
        </XpBadge>
        <XpBadge color="#2d7a2d">{h.status}</XpBadge>
      </div>
      <div className="space-y-3 bg-white px-4 py-3 text-[12px]">
        <div className="flex items-center gap-3 text-neutral-600">
          <span className="font-semibold text-neutral-800">{h.dm_name ?? "—"}</span>
          {h.dm_email && (
            <span className="inline-flex items-center gap-1 text-neutral-500">
              <Mail size={12} /> {h.dm_email}
            </span>
          )}
        </div>
        <div>
          <div className="mb-1 flex justify-between text-[11px] uppercase tracking-wide text-neutral-400">
            <span>Intent score</span>
            <span className="font-bold text-neutral-600">{Math.round(score)}</span>
          </div>
          <XpProgress value={score} tone={score >= 85 ? "green" : "teal"} />
        </div>
        {h.trigger_reason && (
          <div className="text-[11px] text-neutral-500">
            <span className="font-bold text-neutral-600">Why: </span>
            {h.trigger_reason}
          </div>
        )}
        {h.recommended_talk_track && (
          <div className="xp-inset px-3 py-2 text-[12px] leading-relaxed text-neutral-700">
            <div className="mb-1 text-[11px] font-bold uppercase tracking-wide text-[#0a246a]">
              Recommended talk track
            </div>
            {h.recommended_talk_track}
          </div>
        )}
      </div>
    </div>
  );
}

export default function HandoffsApp() {
  const { data: clients, isLoading, error } = useClientList();
  const [clientId, setClientId] = useState<string | null>(null);

  useEffect(() => {
    if (!clientId && clients && clients.length > 0) setClientId(clients[0].id);
  }, [clients, clientId]);

  const handoffs = useQuery({
    queryKey: ["handoffs", clientId],
    queryFn: () => getHandoffs(clientId!),
    enabled: !!clientId,
    refetchInterval: 30_000,
  });

  if (isLoading) return <Loading label="Loading clients…" />;
  if (error) return <ErrorNote error={error} />;
  if (!clients || clients.length === 0)
    return <p className="py-6 text-center text-[13px] text-neutral-500">No clients yet.</p>;

  const items = handoffs.data ?? [];

  return (
    <div className="space-y-3 p-4">
      <AppToolbar clients={clients} value={clientId} onChange={setClientId} />
      {handoffs.isLoading ? (
        <Loading label="Loading handoffs…" />
      ) : handoffs.error ? (
        <ErrorNote error={handoffs.error} />
      ) : items.length === 0 ? (
        <div className="xp-inset px-4 py-8 text-center text-[13px] text-neutral-500">
          No sales-ready handoffs yet. Accounts appear here when they hit a meeting,
          a positive reply, or intent score &gt; 85.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {items.map((h) => (
            <HandoffCard key={h.id} h={h} />
          ))}
        </div>
      )}
    </div>
  );
}
