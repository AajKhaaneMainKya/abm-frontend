"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Mail, Image as ImageIcon, Info, Check, X, Share2, Copy, ExternalLink,
  Ban, RotateCcw, AlertTriangle,
} from "lucide-react";
import {
  getQueue, approveItem, rejectItem, approveCreative, rejectCreative,
  addToDnc, redraftItem,
  type QueueSequence, type Creative,
} from "@/lib/api";
import { XpButton, XpProgress, XpBadge, XpTabs, XpTabPanel, XpDialog, Loading, ErrorNote } from "@/components/xp";

function EmptyBox({ what, why }: { what: string; why: string }) {
  return (
    <div className="mx-auto my-6 w-[400px] max-w-full xp-window">
      <div className="xp-titlebar">
        <span className="xp-titlebar__title">{what}</span>
        <span className="xp-titlebar__btns">
          <span className="xp-titlebar__btn xp-titlebar__btn--close"><X size={12} strokeWidth={3} /></span>
        </span>
      </div>
      <div className="flex items-center gap-3 bg-[#ece9d8] px-5 py-6">
        <Info size={34} className="text-[#1b5dbf]" />
        <div className="text-[13px] text-neutral-700">{why}</div>
      </div>
    </div>
  );
}

function EmailCard({ s, clientId }: { s: QueueSequence; clientId: string }) {
  const qc = useQueryClient();
  const [view, setView] = useState<"email" | "linkedin">("email");
  const [copied, setCopied] = useState(false);
  const [dncOpen, setDncOpen] = useState(false);
  const invalidate = () => qc.invalidateQueries({ queryKey: ["queue", clientId] });

  const approve = useMutation({ mutationFn: () => approveItem(clientId, s.id), onSuccess: invalidate });
  const reject = useMutation({ mutationFn: () => rejectItem(clientId, s.id), onSuccess: invalidate });
  const dnc = useMutation({
    mutationFn: () => addToDnc(clientId, s.account_id ?? ""),
    onSuccess: () => { setDncOpen(false); invalidate(); },
  });

  const critic = s.critic_score ?? 0;
  const conf = s.confidence_score_at_send ?? 0;
  const busy = approve.isPending || reject.isPending;
  const li = s.linkedin_message ?? "";

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(li);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard unavailable */ }
  };

  return (
    <div className="xp-window !rounded-md">
      <div className="flex items-center gap-2 bg-[#d4d0c8] px-3 py-1.5">
        <Mail size={14} className="text-[#0a246a]" />
        <span className="text-[12px] font-bold text-[#0a246a]">{s.company ?? "—"}</span>
        <span className="text-[11px] text-neutral-500">
          {s.dm_name ?? ""}{s.dm_title ? ` · ${s.dm_title}` : ""}
        </span>
        {s.angle_used && <XpBadge color="#6a1aad" className="ml-auto">{s.angle_used}</XpBadge>}
      </div>

      {/* Email / LinkedIn sub-tabs */}
      <div className="flex gap-1 border-b border-[#919b9c] bg-[#ece9d8] px-2 pt-1.5">
        {(["email", "linkedin"] as const).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`rounded-t-sm border border-b-0 px-3 py-1 text-[11px] font-bold ${
              view === v
                ? "border-[#919b9c] bg-white text-[#0a246a]"
                : "border-transparent bg-[#dcd8cc] text-neutral-500"
            }`}
          >
            <span className="inline-flex items-center gap-1">
              {v === "email" ? <Mail size={11} /> : <Share2 size={11} />}
              {v === "email" ? "Email" : "LinkedIn"}
            </span>
          </button>
        ))}
      </div>

      <div className="space-y-3 bg-white px-4 py-3">
        {view === "email" ? (
          <>
            <div>
              <div className="text-[11px] uppercase tracking-wide text-neutral-400">Subject</div>
              <div className="text-[13px] font-semibold text-neutral-800">{s.subject ?? "—"}</div>
            </div>
            {/*
              TODO: Replace plain textarea with TipTap rich text editor
              TipTap gives: bold, italic, inline formatting, word count
              Install: npm install @tiptap/react @tiptap/pm @tiptap/starter-kit
              Pattern to follow: Akshar's TipTap integration in claude-writing-agent
              Gate: show TipTap only for email body (not LinkedIn message —
                LinkedIn is plain text only, 300 char limit)
              On save: strip HTML tags before sending to API (emails are plain text)
              Akshar repo reference: /vercel/app/components/TipTapEditor.tsx
            */}
            <div className="xp-inset max-h-28 overflow-y-auto whitespace-pre-wrap px-3 py-2 font-mono text-[12px] leading-relaxed text-neutral-700">
              {s.body ?? "—"}
            </div>
            {!!(s.personalization_hooks && s.personalization_hooks.length) && (
              <div className="flex flex-wrap gap-1.5">
                {s.personalization_hooks!.map((h, i) => <XpBadge key={i} color="#008080">{h}</XpBadge>)}
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="mb-1 flex justify-between text-[11px] uppercase tracking-wide text-neutral-400">
                  <span>Critic</span><span className="font-bold text-neutral-600">{critic.toFixed(1)}/10</span>
                </div>
                <XpProgress value={critic * 10} tone={critic >= 7 ? "green" : "amber"} />
              </div>
              <div>
                <div className="mb-1 flex justify-between text-[11px] uppercase tracking-wide text-neutral-400">
                  <span>Confidence</span><span className="font-bold text-neutral-600">{Math.round(conf)}</span>
                </div>
                <XpProgress value={conf} tone={conf >= 70 ? "green" : "teal"} />
              </div>
            </div>
          </>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] uppercase tracking-wide text-neutral-400">
              <span>Connection request</span>
              <XpBadge color={li.length > 300 ? "#a02020" : "#1b5dbf"}>{li.length}/300</XpBadge>
            </div>
            <div className="xp-inset min-h-[72px] whitespace-pre-wrap px-3 py-2 text-[12px] leading-relaxed text-neutral-700">
              {li || <span className="italic text-neutral-400">No LinkedIn message was drafted for this account.</span>}
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <XpButton disabled={!li} onClick={copy}>
                  <span className="inline-flex items-center gap-1"><Copy size={12} /> Copy</span>
                </XpButton>
                {copied && (
                  <span className="absolute -top-7 left-0 whitespace-nowrap rounded bg-[#2d7a2d] px-2 py-0.5 text-[11px] font-bold text-white">
                    Copied! ✓
                  </span>
                )}
              </div>
              <XpButton disabled={!s.dm_linkedin} onClick={() => s.dm_linkedin && window.open(s.dm_linkedin, "_blank")}>
                <span className="inline-flex items-center gap-1"><ExternalLink size={12} /> Open Profile</span>
              </XpButton>
            </div>
          </div>
        )}

        <div className="flex items-center justify-end gap-2 border-t border-[#eee] pt-2">
          <button
            className="mr-auto inline-flex items-center gap-1 rounded-sm border border-[#bbb] bg-[#e8e6df] px-2 py-1 text-[11px] font-semibold text-neutral-600 hover:bg-[#ddd]"
            onClick={() => setDncOpen(true)}
            title="Add to do-not-contact"
          >
            <Ban size={12} /> DNC
          </button>
          <XpButton variant="green" disabled={busy} onClick={() => approve.mutate()}>
            <span className="inline-flex items-center gap-1"><Check size={13} /> Approve</span>
          </XpButton>
          <XpButton variant="red" disabled={busy} onClick={() => reject.mutate()}>
            <span className="inline-flex items-center gap-1"><X size={13} /> Reject</span>
          </XpButton>
        </div>
      </div>

      <XpDialog
        open={dncOpen}
        onOpenChange={(o) => { if (!o) setDncOpen(false); }}
        title="Add to Do-Not-Contact"
        footer={
          <>
            <XpButton onClick={() => setDncOpen(false)}>Cancel</XpButton>
            <XpButton variant="red" disabled={dnc.isPending} onClick={() => dnc.mutate()}>
              {dnc.isPending ? "Adding…" : "Confirm DNC"}
            </XpButton>
          </>
        }
      >
        <div className="text-[13px] text-neutral-700">
          Mark <strong>{s.dm_email ?? s.company}</strong> as unsubscribed and add it to the
          do-not-contact list? This removes the account from the queue and it will never be emailed again.
        </div>
      </XpDialog>
    </div>
  );
}

function FailedDraftCard({ s, clientId }: { s: QueueSequence; clientId: string }) {
  const qc = useQueryClient();
  const redraft = useMutation({
    mutationFn: () => redraftItem(clientId, s.id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["queue", clientId] }),
  });

  return (
    <div className="xp-window !rounded-md border-[#caa]">
      <div className="flex items-center gap-2 bg-[#f0d8d8] px-3 py-1.5">
        <AlertTriangle size={14} className="text-[#a02020]" />
        <span className="text-[12px] font-bold text-[#7a1818]">{s.company ?? "—"}</span>
        <span className="text-[11px] text-[#9a5050]">{s.dm_name ?? ""}</span>
        <XpBadge color="#a02020" className="ml-auto uppercase">{s.status}</XpBadge>
      </div>
      <div className="space-y-2 bg-white px-4 py-3">
        {s.subject && <div className="text-[12px] font-semibold text-neutral-700">{s.subject}</div>}
        <div className="text-[12px] italic text-[#a02020]">
          {s.critic_feedback || "The critic flagged this draft. Re-draft to try a different angle."}
        </div>
        <div className="flex justify-end border-t border-[#eee] pt-2">
          <XpButton disabled={redraft.isPending || redraft.isSuccess} onClick={() => redraft.mutate()}>
            <span className="inline-flex items-center gap-1">
              <RotateCcw size={12} className={redraft.isPending ? "animate-spin" : ""} />
              {redraft.isPending ? "Re-drafting…" : redraft.isSuccess ? "Queued" : "Re-draft"}
            </span>
          </XpButton>
        </div>
      </div>
    </div>
  );
}

function CreativeCard({ c, clientId }: { c: Creative; clientId: string }) {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["queue", clientId] });
  const approve = useMutation({ mutationFn: () => approveCreative(clientId, c.id), onSuccess: invalidate });
  const reject = useMutation({ mutationFn: () => rejectCreative(clientId, c.id), onSuccess: invalidate });
  const busy = approve.isPending || reject.isPending;

  return (
    <div className="xp-window !rounded-md">
      <div className="flex items-center gap-2 bg-[#d4d0c8] px-3 py-1.5">
        <ImageIcon size={14} className="text-[#0a246a]" />
        <span className="text-[12px] font-bold text-[#0a246a]">Variant {c.variant}</span>
        <XpBadge color="#1b5dbf" className="uppercase">{c.platform}</XpBadge>
      </div>
      <div className="space-y-2 bg-white px-4 py-3 text-[12px]">
        <div className="text-[14px] font-bold text-neutral-800">{c.headline}</div>
        <div className="text-neutral-600">{c.body}</div>
        {c.cta && <div className="inline-block rounded bg-[#1b5dbf] px-3 py-1 text-[12px] font-bold text-white">{c.cta}</div>}
        {c.image_brief && (
          <div className="xp-inset px-3 py-2 text-[11px] italic text-neutral-600">
            <span className="font-bold not-italic text-neutral-500">Art brief: </span>{c.image_brief}
          </div>
        )}
        <div className="flex justify-end gap-2 border-t border-[#eee] pt-2">
          <XpButton variant="green" disabled={busy} onClick={() => approve.mutate()}>
            <span className="inline-flex items-center gap-1"><Check size={13} /> Approve</span>
          </XpButton>
          <XpButton variant="red" disabled={busy} onClick={() => reject.mutate()}>
            <span className="inline-flex items-center gap-1"><X size={13} /> Reject</span>
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
  const pending = sequences.filter((s) => s.status === "PENDING_APPROVAL");
  const failed = sequences.filter((s) => s.status === "CRITIC_REVIEWING");

  return (
    <XpTabs
      value={tab}
      onValueChange={setTab}
      tabs={[
        { value: "emails", label: `Emails (${pending.length})` },
        { value: "creatives", label: `Creatives (${creatives.length})` },
      ]}
    >
      <XpTabPanel value="emails" className="space-y-5">
        {pending.length === 0 ? (
          <EmptyBox
            what="Nothing to review"
            why={
              failed.length > 0
                ? "No drafts are awaiting approval — but some need attention below."
                : sequences.length === 0
                  ? "No drafts yet. Emails appear here once the orchestrator drafts outreach for enriched accounts. Use Trigger Now to start a cycle."
                  : "You're all caught up — every draft has been actioned."
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {pending.map((s) => <EmailCard key={s.id} s={s} clientId={clientId} />)}
          </div>
        )}

        {failed.length > 0 && (
          <div>
            <div className="mb-2 flex items-center gap-2 text-[12px] font-bold uppercase tracking-wide text-[#a02020]">
              <AlertTriangle size={14} /> Failed Drafts — Needs Attention ({failed.length})
            </div>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {failed.map((s) => <FailedDraftCard key={s.id} s={s} clientId={clientId} />)}
            </div>
          </div>
        )}
      </XpTabPanel>

      <XpTabPanel value="creatives">
        {creatives.length === 0 ? (
          <EmptyBox what="No Creatives" why="No ad creatives awaiting review. Generate creatives from a client workspace to see variants here." />
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {creatives.map((c) => <CreativeCard key={c.id} c={c} clientId={clientId} />)}
          </div>
        )}
      </XpTabPanel>
    </XpTabs>
  );
}
