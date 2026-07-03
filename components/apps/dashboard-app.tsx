"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Users, Send, MessageSquare, Clock4, UserPlus } from "lucide-react";
import { getCampaign, getPipeline, getDecisions } from "@/lib/api";
import { useClientList } from "@/components/client-select";
import { useActiveClient } from "@/components/active-client";
import { StatCard, XpButton, Loading, ErrorNote } from "@/components/xp";
import { PipelineBars } from "@/components/pipeline";
import { DecisionsTable } from "@/components/decisions";
import { CostMonitor } from "@/components/cost-monitor";

const REFRESH = 30_000;

export default function DashboardApp() {
  const router = useRouter();
  const { data: clients, isLoading, error } = useClientList();
  const { activeClientId } = useActiveClient();
  const clientId = activeClientId ?? clients?.[0]?.id ?? null;

  const campaign = useQuery({ queryKey: ["campaign", clientId], queryFn: () => getCampaign(clientId!), enabled: !!clientId, refetchInterval: REFRESH });
  const pipeline = useQuery({ queryKey: ["pipeline", clientId], queryFn: () => getPipeline(clientId!), enabled: !!clientId, refetchInterval: REFRESH });
  const decisions = useQuery({ queryKey: ["decisions", clientId], queryFn: () => getDecisions(clientId!), enabled: !!clientId, refetchInterval: REFRESH });

  if (isLoading) return <Loading label="Loading clients…" />;
  if (error) return <ErrorNote error={error} />;

  if (!clients || clients.length === 0) {
    return (
      <div className="mx-auto mt-10 flex max-w-md flex-col items-center gap-4 rounded-lg border border-[var(--border)] bg-white p-8 text-center shadow-sm">
        <span className="grid h-12 w-12 place-items-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent)]">
          <UserPlus size={24} />
        </span>
        <p className="text-[14px] text-[var(--text-secondary)]">
          No clients yet. Create your first client to start a campaign.
        </p>
        <XpButton variant="primary" onClick={() => router.push("/clients/new")}>
          <UserPlus size={15} /> New Client
        </XpButton>
      </div>
    );
  }

  const c = campaign.data;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Accounts discovered" value={c?.total_accounts ?? "—"} accent="#0f766e" icon={<Users size={14} />} />
        <StatCard label="Emails sent" value={c?.emails_sent ?? "—"} accent="#2563eb" icon={<Send size={14} />} />
        <StatCard label="Replies" value={c?.replies ?? "—"} accent="#0891b2" icon={<MessageSquare size={14} />} />
        <StatCard label="Pending review" value={c?.pending_sequences ?? "—"} accent="#b45309" icon={<Clock4 size={14} />} />
      </div>

      <div className="lg:max-w-xl">
        <CostMonitor />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="card-flush">
          <div className="card-header">Account Pipeline</div>
          <div className="p-4">
            {pipeline.isLoading ? <Loading /> : pipeline.error ? <ErrorNote error={pipeline.error} /> : <PipelineBars pipeline={pipeline.data?.pipeline ?? {}} />}
          </div>
        </div>
        <div className="card-flush">
          <div className="card-header">
            <span className="flex-1">Recent Decisions</span>
            <Link href="/decisions" className="text-[12px] font-medium text-[var(--accent)] hover:underline">
              View all
            </Link>
          </div>
          <div className="p-2">
            {decisions.isLoading ? <Loading /> : decisions.error ? <ErrorNote error={decisions.error} /> : <DecisionsTable decisions={(decisions.data ?? []).slice(0, 5)} compact />}
          </div>
        </div>
      </div>

      <p className="text-right text-[11px] text-[var(--text-secondary)]">
        Auto-refreshes every 30 seconds · {c?.campaign_goal ?? ""}
      </p>
    </div>
  );
}
