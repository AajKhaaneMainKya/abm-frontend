"use client";

import { useClientList } from "@/components/client-select";
import { useActiveClient } from "@/components/active-client";
import { Loading, ErrorNote } from "@/components/xp";
import { QueueView } from "@/components/queue";

export default function QueuePage() {
  const { data: clients, isLoading, error } = useClientList();
  const { activeClientId } = useActiveClient();
  const clientId = activeClientId ?? clients?.[0]?.id ?? null;

  if (isLoading) return <Loading label="Loading clients…" />;
  if (error) return <ErrorNote error={error} />;

  if (!clients || clients.length === 0) {
    return (
      <p className="py-10 text-center text-[13px] text-[var(--text-secondary)]">
        No clients yet.
      </p>
    );
  }

  return clientId ? <QueueView clientId={clientId} /> : <Loading />;
}
