"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Play, Pause, Pencil, UserPlus } from "lucide-react";
import {
  getClient, getCampaign, getMetrics, getPipeline, getDecisions,
  triggerOrchestrator, pauseClient, resumeClient, addManualAccount,
  ApiValidationError, type Client,
} from "@/lib/api";
import { PIPELINE_STATES, stateColors } from "@/lib/design";
import { StatCard, XpTabs, XpTabPanel, XpButton, XpDialog, Loading, ErrorNote } from "@/components/xp";
import { PipelineBars } from "@/components/pipeline";
import { DecisionsTable } from "@/components/decisions";
import { QueueView } from "@/components/queue";
import { CreativesGrid } from "@/components/creatives";
import { useWindowManager } from "@/components/window-manager";

const modalInput =
  "w-full xp-inset rounded-sm px-2 py-1.5 text-[13px] text-neutral-800 outline-none focus:ring-1 focus:ring-[#316ac5]";

function AddAccountModal({
  open, onClose, clientId, onSaved,
}: {
  open: boolean;
  onClose: () => void;
  clientId: string;
  onSaved: () => void;
}) {
  const [company, setCompany] = useState("");
  const [domain, setDomain] = useState("");
  const [contactName, setContactName] = useState("");
  const [title, setTitle] = useState("");
  const [email, setEmail] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [industry, setIndustry] = useState("");
  const [size, setSize] = useState("");
  const [errors, setErrors] = useState<string[]>([]);

  const reset = () => {
    setCompany(""); setDomain(""); setContactName(""); setTitle("");
    setEmail(""); setLinkedin(""); setIndustry(""); setSize(""); setErrors([]);
  };

  const m = useMutation({
    mutationFn: () =>
      addManualAccount(clientId, {
        company: company.trim(),
        domain: domain.trim(),
        dm_name: contactName.trim(),
        dm_title: title.trim(),
        dm_email: email.trim(),
        dm_linkedin: linkedin.trim() || undefined,
        industry: industry.trim() || undefined,
        size_estimate: size ? Number(size) : undefined,
      }),
    onSuccess: () => { reset(); onSaved(); },
    onError: (e) => setErrors(e instanceof ApiValidationError ? e.errors : [String((e as Error).message)]),
  });

  const submit = () => {
    const errs: string[] = [];
    if (!company.trim()) errs.push("Company is required");
    if (!domain.trim()) errs.push("Domain is required");
    if (!contactName.trim()) errs.push("Contact name is required");
    if (!title.trim()) errs.push("Title is required");
    const at = email.split("@");
    if (at.length !== 2 || !at[1].includes(".")) errs.push("A valid email is required");
    if (errs.length) { setErrors(errs); return; }
    setErrors([]);
    m.mutate();
  };

  return (
    <XpDialog
      open={open}
      onOpenChange={(o) => { if (!o) { reset(); onClose(); } }}
      title="Add Account"
      footer={
        <>
          <XpButton onClick={() => { reset(); onClose(); }}>Cancel</XpButton>
          <XpButton variant="green" disabled={m.isPending} onClick={submit}>
            {m.isPending ? "Adding…" : "Add Account"}
          </XpButton>
        </>
      }
    >
      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <input className={modalInput} placeholder="Company *" value={company} onChange={(e) => setCompany(e.target.value)} />
          <input className={modalInput} placeholder="Domain *" value={domain} onChange={(e) => setDomain(e.target.value)} />
          <input className={modalInput} placeholder="Contact name *" value={contactName} onChange={(e) => setContactName(e.target.value)} />
          <input className={modalInput} placeholder="Title *" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <input className={modalInput} placeholder="Email *" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className={modalInput} placeholder="LinkedIn URL" value={linkedin} onChange={(e) => setLinkedin(e.target.value)} />
        <div className="grid grid-cols-2 gap-2">
          <input className={modalInput} placeholder="Industry" value={industry} onChange={(e) => setIndustry(e.target.value)} />
          <input className={modalInput} type="number" placeholder="Company size" value={size} onChange={(e) => setSize(e.target.value)} />
        </div>
        {errors.length > 0 && (
          <ul className="list-disc border border-[#a02020] bg-[#fdeaea] px-5 py-2 text-[12px] text-[#7a1818]">
            {errors.map((e) => <li key={e}>{e}</li>)}
          </ul>
        )}
        <p className="text-[11px] text-neutral-400">Added at state ENRICHED (enrichment layer 3) — ready for drafting.</p>
      </div>
    </XpDialog>
  );
}

function ControlsBar({ client, clientId }: { client: Client; clientId: string }) {
  const wm = useWindowManager();
  const qc = useQueryClient();
  const [dialog, setDialog] = useState<{ title: string; body: string } | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  const triggerM = useMutation({
    mutationFn: () => triggerOrchestrator(clientId),
    onSuccess: () => setDialog({ title: "Orchestrator triggered", body: "Discovery has been kicked off. The orchestrator will pick this up on its next cycle." }),
    onError: (e) => setDialog({ title: "Error", body: String((e as Error).message) }),
  });

  const toggleM = useMutation({
    mutationFn: () => (client.active ? pauseClient(clientId) : resumeClient(clientId)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["client", clientId] });
      qc.invalidateQueries({ queryKey: ["clients"] });
    },
    onError: (e) => setDialog({ title: "Error", body: String((e as Error).message) }),
  });

  return (
    <div className="mb-3 flex flex-wrap items-center gap-2 border-b border-[#d8d4c8] pb-3">
      <XpButton onClick={() => triggerM.mutate()} disabled={triggerM.isPending}>
        <span className="inline-flex items-center gap-1"><Play size={13} /> {triggerM.isPending ? "Triggering…" : "Trigger Now"}</span>
      </XpButton>
      <XpButton onClick={() => toggleM.mutate()} disabled={toggleM.isPending}>
        <span className="inline-flex items-center gap-1">
          {client.active ? <><Pause size={13} /> Pause</> : <><Play size={13} /> Resume</>}
        </span>
      </XpButton>
      <XpButton onClick={() => wm.open("client-edit", { props: { clientId }, title: `Edit — ${client.name}` })}>
        <span className="inline-flex items-center gap-1"><Pencil size={13} /> Edit</span>
      </XpButton>
      <XpButton variant="primary" onClick={() => setAddOpen(true)}>
        <span className="inline-flex items-center gap-1"><UserPlus size={13} /> Add Account</span>
      </XpButton>
      <span className={`ml-1 text-[11px] font-bold uppercase tracking-wide ${client.active ? "text-[#2d7a2d]" : "text-[#c8a020]"}`}>
        {client.active ? "● Active" : "❚❚ Paused"}
      </span>

      <AddAccountModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        clientId={clientId}
        onSaved={() => {
          qc.invalidateQueries({ queryKey: ["pipeline", clientId] });
          qc.invalidateQueries({ queryKey: ["campaign", clientId] });
          setAddOpen(false);
          setDialog({ title: "Account added", body: "The account was added at ENRICHED (layer 3) and is ready for drafting." });
        }}
      />
      <XpDialog
        open={!!dialog}
        onOpenChange={(o) => { if (!o) setDialog(null); }}
        title={dialog?.title ?? ""}
        footer={<XpButton variant="primary" onClick={() => setDialog(null)}>OK</XpButton>}
      >
        <div className="text-[13px] text-neutral-700">{dialog?.body}</div>
      </XpDialog>
    </div>
  );
}

export default function ClientDetailApp({ clientId }: { clientId: string }) {
  const [tab, setTab] = useState("overview");

  const client = useQuery({ queryKey: ["client", clientId], queryFn: () => getClient(clientId), enabled: !!clientId });
  const campaign = useQuery({ queryKey: ["campaign", clientId], queryFn: () => getCampaign(clientId), enabled: !!clientId });
  const metrics = useQuery({ queryKey: ["metrics", clientId], queryFn: () => getMetrics(clientId), enabled: !!clientId });
  const pipeline = useQuery({ queryKey: ["pipeline", clientId], queryFn: () => getPipeline(clientId), enabled: !!clientId && (tab === "overview" || tab === "pipeline") });
  const decisions = useQuery({ queryKey: ["decisions", clientId], queryFn: () => getDecisions(clientId), enabled: !!clientId && (tab === "overview" || tab === "decisions") });

  if (client.isLoading) return <Loading label="Loading client…" />;
  if (client.error || !client.data) return <ErrorNote error={client.error} />;

  const chartData = PIPELINE_STATES.map((s) => ({ state: s, count: pipeline.data?.pipeline?.[s] ?? 0 }));

  return (
    <div className="p-3">
      <ControlsBar client={client.data} clientId={clientId} />

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
        <XpTabPanel value="overview" className="space-y-4">
          <div className="xp-inset bg-white px-4 py-3">
            <div className="text-[11px] uppercase tracking-wide text-neutral-400">Campaign goal</div>
            <div className="text-[14px] font-bold text-[#0a246a]">{campaign.data?.campaign_goal ?? client.data?.campaign_goal ?? "—"}</div>
          </div>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="Accounts" value={campaign.data?.total_accounts ?? "—"} accent="#1a73e8" />
            <StatCard label="Sent" value={metrics.data?.sent ?? "—"} accent="#1b5dbf" />
            <StatCard label="Replies" value={metrics.data?.replied ?? "—"} accent="#008080" />
            <StatCard label="Converted" value={metrics.data?.converted ?? "—"} accent="#2d7a2d" />
          </div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="xp-window !rounded-md">
              <div className="bg-[#d4d0c8] px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-[#0a246a]">Pipeline overview</div>
              <div className="bg-white p-3" style={{ height: 220 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 8, right: 8, bottom: 8, left: -18 }}>
                    <XAxis dataKey="state" tick={{ fontSize: 9 }} interval={0} angle={-25} textAnchor="end" height={50} />
                    <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" radius={[2, 2, 0, 0]}>
                      {chartData.map((d) => (<Cell key={d.state} fill={stateColors[d.state] ?? "#1b5dbf"} />))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="xp-window !rounded-md">
              <div className="bg-[#d4d0c8] px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-[#0a246a]">Recent activity</div>
              <div className="bg-white p-2"><DecisionsTable decisions={(decisions.data ?? []).slice(0, 5)} compact /></div>
            </div>
          </div>
        </XpTabPanel>

        <XpTabPanel value="pipeline">
          {pipeline.isLoading ? <Loading /> : pipeline.error ? <ErrorNote error={pipeline.error} /> : (
            <div className="xp-inset bg-white p-4"><PipelineBars pipeline={pipeline.data?.pipeline ?? {}} /></div>
          )}
        </XpTabPanel>

        <XpTabPanel value="decisions">
          {decisions.isLoading ? <Loading /> : decisions.error ? <ErrorNote error={decisions.error} /> : <DecisionsTable decisions={decisions.data ?? []} />}
        </XpTabPanel>

        <XpTabPanel value="queue"><QueueView clientId={clientId} /></XpTabPanel>
        <XpTabPanel value="creatives"><CreativesGrid clientId={clientId} /></XpTabPanel>
      </XpTabs>
    </div>
  );
}
