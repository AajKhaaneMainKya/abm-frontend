"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  getClient,
  getCampaign,
  getMetrics,
  getPipeline,
  getDecisions,
} from "@/lib/api";
import { PIPELINE_STATES, stateColors } from "@/lib/design";
import { XpWindow, StatCard, XpTabs, XpTabPanel, Loading, ErrorNote } from "@/components/xp";
import { PipelineBars } from "@/components/pipeline";
import { DecisionsTable } from "@/components/decisions";
import { QueueView } from "@/components/queue";
import { CreativesGrid } from "@/components/creatives";

export default function ClientDetailPage() {
  const params = useParams<{ id: string }>();
  const clientId = params.id;
  const [tab, setTab] = useState("overview");

  const client = useQuery({
    queryKey: ["client", clientId],
    queryFn: () => getClient(clientId),
    enabled: !!clientId,
  });
  const campaign = useQuery({
    queryKey: ["campaign", clientId],
    queryFn: () => getCampaign(clientId),
    enabled: !!clientId,
  });
  const metrics = useQuery({
    queryKey: ["metrics", clientId],
    queryFn: () => getMetrics(clientId),
    enabled: !!clientId,
  });
  const pipeline = useQuery({
    queryKey: ["pipeline", clientId],
    queryFn: () => getPipeline(clientId),
    enabled: !!clientId && (tab === "overview" || tab === "pipeline"),
  });
  const decisions = useQuery({
    queryKey: ["decisions", clientId],
    queryFn: () => getDecisions(clientId),
    enabled: !!clientId && (tab === "overview" || tab === "decisions"),
  });

  if (client.isLoading) return <Loading label="Loading client…" />;
  if (client.error) return <ErrorNote error={client.error} />;

  const c = client.data;
  const chartData = PIPELINE_STATES.map((s) => ({
    state: s,
    count: pipeline.data?.pipeline?.[s] ?? 0,
  }));

  return (
    <XpWindow title={c?.name ?? "Client"}>
      <XpTabs
        value={tab}
        onValueChange={setTab}
        tabs={[
          { value: "overview", label: "Overview" },
          { value: "pipeline", label: "Pipeline" },
          { value: "decisions", label: "Decisions" },
          { value: "queue", label: "Queue" },
          { value: "creatives", label: "Creatives" },
        ]}
      >
        {/* Overview */}
        <XpTabPanel value="overview" className="space-y-4">
          <div className="xp-inset bg-white px-4 py-3">
            <div className="text-[11px] uppercase tracking-wide text-neutral-400">
              Campaign goal
            </div>
            <div className="text-[14px] font-bold text-[#0a246a]">
              {campaign.data?.campaign_goal ?? c?.campaign_goal ?? "—"}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="Accounts" value={campaign.data?.total_accounts ?? "—"} accent="#1a73e8" />
            <StatCard label="Sent" value={metrics.data?.sent ?? "—"} accent="#1b5dbf" />
            <StatCard label="Replies" value={metrics.data?.replied ?? "—"} accent="#008080" />
            <StatCard label="Converted" value={metrics.data?.converted ?? "—"} accent="#2d7a2d" />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="xp-window !rounded-md">
              <div className="bg-[#d4d0c8] px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-[#0a246a]">
                Pipeline overview
              </div>
              <div className="bg-white p-3" style={{ height: 220 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 8, right: 8, bottom: 8, left: -18 }}>
                    <XAxis dataKey="state" tick={{ fontSize: 9 }} interval={0} angle={-25} textAnchor="end" height={50} />
                    <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" radius={[2, 2, 0, 0]}>
                      {chartData.map((d) => (
                        <Cell key={d.state} fill={stateColors[d.state] ?? "#1b5dbf"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="xp-window !rounded-md">
              <div className="bg-[#d4d0c8] px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-[#0a246a]">
                Recent activity
              </div>
              <div className="bg-white p-2">
                <DecisionsTable decisions={(decisions.data ?? []).slice(0, 5)} compact />
              </div>
            </div>
          </div>
        </XpTabPanel>

        {/* Pipeline */}
        <XpTabPanel value="pipeline">
          {pipeline.isLoading ? (
            <Loading />
          ) : pipeline.error ? (
            <ErrorNote error={pipeline.error} />
          ) : (
            <div className="xp-inset bg-white p-4">
              <PipelineBars pipeline={pipeline.data?.pipeline ?? {}} />
            </div>
          )}
        </XpTabPanel>

        {/* Decisions */}
        <XpTabPanel value="decisions">
          {decisions.isLoading ? (
            <Loading />
          ) : decisions.error ? (
            <ErrorNote error={decisions.error} />
          ) : (
            <DecisionsTable decisions={decisions.data ?? []} />
          )}
        </XpTabPanel>

        {/* Queue */}
        <XpTabPanel value="queue">
          <QueueView clientId={clientId} />
        </XpTabPanel>

        {/* Creatives */}
        <XpTabPanel value="creatives">
          <CreativesGrid clientId={clientId} />
        </XpTabPanel>
      </XpTabs>
    </XpWindow>
  );
}
