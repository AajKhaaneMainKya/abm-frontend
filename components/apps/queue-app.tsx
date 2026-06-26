"use client";

import { useEffect, useState } from "react";
import { useClientList } from "@/components/client-select";
import { Loading, ErrorNote } from "@/components/xp";
import { QueueView } from "@/components/queue";
import { AppToolbar } from "@/components/apps/app-toolbar";

export default function QueueApp() {
  const { data: clients, isLoading, error } = useClientList();
  const [clientId, setClientId] = useState<string | null>(null);

  useEffect(() => {
    if (!clientId && clients && clients.length > 0) setClientId(clients[0].id);
  }, [clients, clientId]);

  if (isLoading) return <Loading label="Loading clients…" />;
  if (error) return <ErrorNote error={error} />;
  if (!clients || clients.length === 0)
    return <p className="py-6 text-center text-[13px] text-neutral-500">No clients yet.</p>;

  return (
    <div className="space-y-3 p-4">
      <AppToolbar clients={clients} value={clientId} onChange={setClientId} />
      {clientId ? <QueueView clientId={clientId} /> : <Loading />}
    </div>
  );
}
