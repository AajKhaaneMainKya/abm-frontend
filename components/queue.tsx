"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Mail, Image as ImageIcon, Info, Check, X } from "lucide-react";
import {
  getQueue,
  approveItem,
  rejectItem,
  approveCreative,
  rejectCreative,
  type QueueSequence,
  type Creative,
} from "@/lib/api";
import { XpButton, XpProgress, XpBadge, XpTabs, XpTabPanel, Loading, ErrorNote } from "@/components/xp";

function EmptyBox({ what }: { what: string }) {
  return (
    <div className="mx-auto my-6 w-[360px] max-w-full xp-window">
      <div className="xp-titlebar">
        <span className="xp-titlebar__title">{what}</span>
        <span className="xp-titlebar__btns">
          <span className="xp-titlebar__btn xp-titlebar__btn--close">
            <X size={12} strokeWidth={3} />
          </span>
        </span>
      </div>
      <div className="flex items-center gap-3 bg-[#ece9d8] px-5 py-6">
        <Info size={34} className="text-[#1b5dbf]" />
        <div className="text-[13px] text-neutral-700">
          No items awaiting review. You&apos;re all caught up.
        </div>
      </div>
    </div>
  );
}

function EmailCard({ s, clientId }: { s: QueueSequence; clientId: string }) {
  const qc = useQueryClient();
  const invalidate = () =>
    qc.invalidateQueries({ queryKey: ["queue", clientId] });

  const approve = useMutation({
    mutationFn: () => approveItem(clientId, s.id),
    onSuccess: invalidate,
  });
  const reject = useMutation({
    mutationFn: () => rejectItem(clientId, s.id),
    onSuccess: invalidate,
  });

  const critic = s.critic_score ?? 0; // 0..10
  const conf = s.confidence_score_at_send ?? 0; // 0..100
  const busy = approve.isPending || reject.isPending;

  return (
    <div className="xp-window !rounded-md">
      <div className="flex items-center gap-2 bg-[#d4d0c8] px-3 py-1.5">
        <Mail size={14} className="text-[#0a246a]" />
        <span className="text-[12px] font-bold text-[#0a246a]">{s.company ?? "—"}</span>
        <span className="text-[11px] text-neutral-500">
          {s.dm_name ?? ""}
          {s.dm_title ? ` · ${s.dm_title}` : ""}
        </span>
        {s.angle_used && (
          <XpBadge color="#6a1aad" className="ml-auto">
            {s.angle_used}
          </XpBadge>
        )}
      </div>
      <div className="space-y-3 bg-white px-4 py-3">
        <div>
          <div className="text-[11px] uppercase tracking-wide text-neutral-400">
            Subject
          </div>
          <div className="text-[13px] font-semibold text-neutral-800">
            {s.subject ?? "—"}
          </div>
        </div>
        <div className="xp-inset max-h-28 overflow-y-auto whitespace-pre-wrap px-3 py-2 font-mono text-[12px] leading-relaxed text-neutral-700">
          {s.body ?? "—"}
        </div>

        {!!(s.personalization_hooks && s.personalization_hooks.length) && (
          <div className="flex flex-wrap gap-1.5">
            {s.personalization_hooks!.map((h, i) => (
              <XpBadge key={i} color="#008080">
                {h}
              </XpBadge>
            ))}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="mb-1 flex justify-between text-[11px] uppercase tracking-wide text-neutral-400">
              <span>Critic</span>
              <span className="font-bold text-neutral-600">{critic.toFixed(1)}/10</span>
            </div>
            <XpProgress value={critic * 10} tone={critic >= 7 ? "green" : "amber"} />
          </div>
          <div>
            <div className="mb-1 flex justify-between text-[11px] uppercase tracking-wide text-neutral-400">
              <span>Confidence</span>
              <span className="font-bold text-neutral-600">{Math.round(conf)}</span>
            </div>
            <XpProgress value={conf} tone={conf >= 70 ? "green" : "teal"} />
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-[#eee] pt-2">
          <XpButton
            variant="green"
            disabled={busy}
            onClick={() => approve.mutate()}
          >
            <span className="inline-flex items-center gap-1">
              <Check size={13} /> Approve
            </span>
          </XpButton>
          <XpButton variant="red" disabled={busy} onClick={() => reject.mutate()}>
            <span className="inline-flex items-center gap-1">
              <X size={13} /> Reject
            </span>
          </XpButton>
        </div>
      </div>
    </div>
  );
}

function CreativeCard({ c, clientId }: { c: Creative; clientId: string }) {
  const qc = useQueryClient();
  const invalidate = () =>
    qc.invalidateQueries({ queryKey: ["queue", clientId] });
  const approve = useMutation({
    mutationFn: () => approveCreative(clientId, c.id),
    onSuccess: invalidate,
  });
  const reject = useMutation({
    mutationFn: () => rejectCreative(clientId, c.id),
    onSuccess: invalidate,
  });
  const busy = approve.isPending || reject.isPending;

  return (
    <div className="xp-window !rounded-md">
      <div className="flex items-center gap-2 bg-[#d4d0c8] px-3 py-1.5">
        <ImageIcon size={14} className="text-[#0a246a]" />
        <span className="text-[12px] font-bold text-[#0a246a]">
          Variant {c.variant}
        </span>
        <XpBadge color="#1b5dbf" className="uppercase">
          {c.platform}
        </XpBadge>
      </div>
      <div className="space-y-2 bg-white px-4 py-3 text-[12px]">
        <div className="text-[14px] font-bold text-neutral-800">{c.headline}</div>
        <div className="text-neutral-600">{c.body}</div>
        {c.cta && (
          <div className="inline-block rounded bg-[#1b5dbf] px-3 py-1 text-[12px] font-bold text-white">
            {c.cta}
          </div>
        )}
        {c.image_brief && (
          <div className="xp-inset px-3 py-2 text-[11px] italic text-neutral-600">
            <span className="font-bold not-italic text-neutral-500">Art brief: </span>
            {c.image_brief}
          </div>
        )}
        <div className="flex justify-end gap-2 border-t border-[#eee] pt-2">
          <XpButton variant="green" disabled={busy} onClick={() => approve.mutate()}>
            <span className="inline-flex items-center gap-1">
              <Check size={13} /> Approve
            </span>
          </XpButton>
          <XpButton variant="red" disabled={busy} onClick={() => reject.mutate()}>
            <span className="inline-flex items-center gap-1">
              <X size={13} /> Reject
            </span>
          </XpButton>
        </div>
      </div>
    </div>
  );
}

export function QueueView({ clientId }: { clientId: string }) {
  const [tab, setTab] = useState("emails");
  const { data, isLoading, error } = useQuery({
    queryKey: ["queue", clientId],
    queryFn: () => getQueue(clientId),
    enabled: !!clientId,
  });

  if (isLoading) return <Loading label="Loading review queue…" />;
  if (error) return <ErrorNote error={error} />;

  const sequences = data?.sequences ?? [];
  const creatives = data?.creatives ?? [];

  return (
    <XpTabs
      value={tab}
      onValueChange={setTab}
      tabs={[
        { value: "emails", label: `Emails (${sequences.length})` },
        { value: "creatives", label: `Creatives (${creatives.length})` },
      ]}
    >
      <XpTabPanel value="emails">
        {sequences.length === 0 ? (
          <EmptyBox what="No Emails" />
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {sequences.map((s) => (
              <EmailCard key={s.id} s={s} clientId={clientId} />
            ))}
          </div>
        )}
      </XpTabPanel>
      <XpTabPanel value="creatives">
        {creatives.length === 0 ? (
          <EmptyBox what="No Creatives" />
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {creatives.map((c) => (
              <CreativeCard key={c.id} c={c} clientId={clientId} />
            ))}
          </div>
        )}
      </XpTabPanel>
    </XpTabs>
  );
}
