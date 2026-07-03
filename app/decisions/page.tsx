"use client";

import { useQuery } from "@tanstack/react-query";
import { getDecisions } from "@/lib/api";
import { useClientList } from "@/components/client-select";
import { useActiveClient } from "@/components/active-client";
import { Loading, ErrorNote } from "@/components/xp";
import { DecisionsTable } from "@/components/decisions";

export default function DecisionsPage() {
  const { data: clients, isLoading, error } = useClientList();
  const { activeClientId } = useActiveClient();
  const clientId = activeClientId ?? clients?.[0]?.id ?? null;

  const decisions = useQuery({
    queryKey: ["decisions", clientId],
    queryFn: () => getDecisions(clientId!),
    enabled: !!clientId,
    refetchInterval: 30_000,
  });

  if (isLoading) return <Loading label="Loading clients…" />;
  if (error) return <ErrorNote error={error} />;

  if (!clients || clients.length === 0) {
    return (
      <p className="py-10 text-center text-[13px] text-[var(--text-secondary)]">No clients yet.</p>
    );
  }

  if (decisions.isLoading) return <Loading label="Loading decisions…" />;
  if (decisions.error) return <ErrorNote error={decisions.error} />;

  return <DecisionsTable decisions={decisions.data ?? []} />;
}
