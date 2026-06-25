"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getDecisions } from "@/lib/api";
import { useClientList, ClientSelect } from "@/components/client-select";
import { XpWindow, Loading, ErrorNote } from "@/components/xp";
import { DecisionsTable } from "@/components/decisions";

export default function DecisionsPage() {
  const { data: clients, isLoading, error } = useClientList();
  const [clientId, setClientId] = useState<string | null>(null);

  useEffect(() => {
    if (!clientId && clients && clients.length > 0) setClientId(clients[0].id);
  }, [clients, clientId]);

  const decisions = useQuery({
    queryKey: ["decisions", clientId],
    queryFn: () => getDecisions(clientId!),
    enabled: !!clientId,
    refetchInterval: 30_000,
  });

  if (isLoading) return <Loading label="Loading clients…" />;
  if (error) return <ErrorNote error={error} />;

  const selector =
    clients && clients.length > 0 ? (
      <div className="mr-2">
        <ClientSelect clients={clients} value={clientId} onChange={setClientId} />
      </div>
    ) : null;

  return (
    <XpWindow title="Orchestrator Log" headerRight={selector}>
      {!clients || clients.length === 0 ? (
        <p className="py-6 text-center text-[13px] text-neutral-500">No clients yet.</p>
      ) : decisions.isLoading ? (
        <Loading label="Loading decisions…" />
      ) : decisions.error ? (
        <ErrorNote error={decisions.error} />
      ) : (
        <DecisionsTable decisions={decisions.data ?? []} />
      )}
    </XpWindow>
  );
}
