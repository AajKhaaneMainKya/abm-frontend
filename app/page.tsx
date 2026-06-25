"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Users, Send, MessageSquare, Clock4, UserPlus } from "lucide-react";
import { getCampaign, getPipeline, getDecisions } from "@/lib/api";
import { useClientList, ClientSelect } from "@/components/client-select";
import { XpWindow, StatCard, XpButton, Loading, ErrorNote } from "@/components/xp";
import { PipelineBars } from "@/components/pipeline";
import { DecisionsTable } from "@/components/decisions";

const REFRESH = 30_000;

export default function DashboardPage() {
  const { data: clients, isLoading: loadingClients, error: clientsError } = useClientList();
  const [clientId, setClientId] = useState<string | null>(null);

  useEffect(() => {
    if (!clientId && clients && clients.length > 0) setClientId(clients[0].id);
  }, [clients, clientId]);

  const campaign = useQuery({
    queryKey: ["campaign", clientId],
    queryFn: () => getCampaign(clientId!),
    enabled: !!clientId,
    refetchInterval: REFRESH,
  });
  const pipeline = useQuery({
    queryKey: ["pipeline", clientId],
    queryFn: () => getPipeline(clientId!),
    enabled: !!clientId,
    refetchInterval: REFRESH,
  });
  const decisions = useQuery({
    queryKey: ["decisions", clientId],
    queryFn: () => getDecisions(clientId!),
    enabled: !!clientId,
    refetchInterval: REFRESH,
  });

  const selector =
    clients && clients.length > 0 ? (
      <div className="mr-2">
        <ClientSelect clients={clients} value={clientId} onChange={setClientId} />
      </div>
    ) : null;

  if (loadingClients) return <Loading label="Loading clients…" />;
  if (clientsError) return <ErrorNote error={clientsError} />;

  if (!clients || clients.length === 0) {
    return (
      <XpWindow title="ABM System v1.0">
        <div className="flex flex-col items-center gap-4 py-10 text-center">
          <p className="text-[14px] text-neutral-600">
            No clients yet. Create your first client to start a campaign.
          </p>
          <Link href="/clients/new">
            <XpButton variant="primary">
              <span className="inline-flex items-center gap-1">
                <UserPlus size={14} /> New Client Setup
              </span>
            </XpButton>
          </Link>
        </div>
      </XpWindow>
    );
  }

  const c = campaign.data;

  return (
    <XpWindow title="ABM System v1.0" headerRight={selector} bodyClassName="space-y-5">
      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Accounts discovered"
          value={c?.total_accounts ?? "—"}
          accent="#1a73e8"
          icon={<Users size={14} />}
        />
        <StatCard
          label="Emails sent"
          value={c?.emails_sent ?? "—"}
          accent="#1b5dbf"
          icon={<Send size={14} />}
        />
        <StatCard
          label="Replies"
          value={c?.replies ?? "—"}
          accent="#008080"
          icon={<MessageSquare size={14} />}
        />
        <StatCard
          label="Pending review"
          value={c?.pending_sequences ?? "—"}
          accent="#c8a020"
          icon={<Clock4 size={14} />}
        />
      </div>

      {/* Pipeline + decisions */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="xp-window !rounded-md">
          <div className="bg-[#d4d0c8] px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-[#0a246a]">
            Account Pipeline
          </div>
          <div className="bg-white p-4">
            {pipeline.isLoading ? (
              <Loading />
            ) : pipeline.error ? (
              <ErrorNote error={pipeline.error} />
            ) : (
              <PipelineBars pipeline={pipeline.data?.pipeline ?? {}} />
            )}
          </div>
        </div>

        <div className="xp-window !rounded-md">
          <div className="bg-[#d4d0c8] px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-[#0a246a]">
            Recent Decisions
          </div>
          <div className="bg-white p-2">
            {decisions.isLoading ? (
              <Loading />
            ) : decisions.error ? (
              <ErrorNote error={decisions.error} />
            ) : (
              <DecisionsTable decisions={(decisions.data ?? []).slice(0, 5)} compact />
            )}
          </div>
        </div>
      </div>

      <p className="text-right text-[11px] text-neutral-500">
        Auto-refreshes every 30 seconds · {c?.campaign_goal ?? ""}
      </p>
    </XpWindow>
  );
}
