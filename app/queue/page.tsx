"use client";

import { useEffect, useState } from "react";
import { useClientList, ClientSelect } from "@/components/client-select";
import { XpWindow, Loading, ErrorNote } from "@/components/xp";
import { QueueView } from "@/components/queue";

export default function QueuePage() {
  const { data: clients, isLoading, error } = useClientList();
  const [clientId, setClientId] = useState<string | null>(null);

  useEffect(() => {
    if (!clientId && clients && clients.length > 0) setClientId(clients[0].id);
  }, [clients, clientId]);

  if (isLoading) return <Loading label="Loading clients…" />;
  if (error) return <ErrorNote error={error} />;

  const selector =
    clients && clients.length > 0 ? (
      <div className="mr-2">
        <ClientSelect clients={clients} value={clientId} onChange={setClientId} />
      </div>
    ) : null;

  return (
    <XpWindow title="Review Queue" headerRight={selector}>
      {!clients || clients.length === 0 ? (
        <p className="py-6 text-center text-[13px] text-neutral-500">
          No clients yet.
        </p>
      ) : clientId ? (
        <QueueView clientId={clientId} />
      ) : (
        <Loading />
      )}
    </XpWindow>
  );
}
