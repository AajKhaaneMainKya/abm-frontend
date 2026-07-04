"use client";

import { useState } from "react";
import {
  Mail, Image as ImageIcon, Info, Check, X, Share2, Copy, ExternalLink,
  Ban, RotateCcw, AlertTriangle,
} from "lucide-react";
import {
  getQueue, approveItem, rejectItem, approveCreative, rejectCreative,
  addToDnc, redraftItem, updateSequenceBody,
  type QueueSequence, type Creative,
} from "@/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { XpButton, XpProgress, XpBadge, XpTabs, XpTabPanel, XpDialog, Loading, ErrorNote } from "@/components/xp";
import TipTapEditor from "@/components/tiptap-editor";

function EmptyBox({ what, why }: { what: string; why: string }) {
  return (
    <div className="mx-auto my-6 flex w-[440px] max-w-full items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-5 py-6">
      <Info size={28} className="shrink-0 text-[var(--accent)]" />
      <div>
        <div className="text-[13px] font-semibold text-[var(--foreground)]">{what}</div>
        <div className="mt-0.5 text-[13px] text-[var(--text-secondary)]">{why}</div>
      </div>
    </div>
  );
}

function EmailCard({ s, clientId }: { s: QueueSequence; clientId: string }) {
  const qc = useQueryClient();
  const [view, setView] = useState<"email" | "linkedin">("email");
  const [copied, setCopied] = useState(false);
  const [dncOpen, setDncOpen] = useState(false);
  // Editable email body (plain text). Seeded from the draft; the TipTap editor
  // returns plain text on every change, so no HTML stripping is needed on save.
  const [body, setBody] = useState(s.body ?? "");
  const dirty = body.trim() !== (s.body ?? "").trim();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["queue", clientId] });

  const approve = useMutation({ mutationFn: () => approveItem(clientId, s.id), onSuccess: invalidate });
  const reject = useMutation({ mutationFn: () => rejectItem(clientId, s.id), onSuccess: invalidate });
  const saveBody = useMutation({ mutationFn: () => updateSequenceBody(clientId, s.id, body), onSuccess: invalidate });
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
    <div className="card-flush">
      <div className="flex items-center gap-2 border-b border-[var(--border)] px-4 py-2.5">
        <Mail size={15} className="text-[var(--accent)]" />
        <span className="text-[13px] font-semibold text-[var(--foreground)]">{s.company ?? "—"}</span>
        <span className="text-[12px] text-[var(--text-secondary)]">
          {s.dm_name ?? ""}{s.dm_title ? ` · ${s.dm_title}` : ""}
        </span>
        {s.angle_used && <XpBadge color="#7c3aed" className="ml-auto">{s.angle_used}</XpBadge>}
      </div>

      {/* Email / LinkedIn sub-tabs */}
      <div className="flex gap-1 border-b border-[var(--border)] px-3 pt-2">
        {(["email", "linkedin"] as const).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`-mb-px border-b-2 px-3 py-1.5 text-[12px] font-medium ${
              view === v
                ? "border-[var(--accent)] text-[var(--accent)]"
                : "border-transparent text-[var(--text-secondary)] hover:text-[var(--foreground)]"
            }`}
          >
            <span className="inline-flex items-center gap-1">
              {v === "email" ? <Mail size={12} /> : <Share2 size={12} />}
              {v === "email" ? "Email" : "LinkedIn"}
            </span>
          </button>
        ))}
      </div>

      <div className="space-y-3 px-4 py-3">
        {view === "email" ? (
          <>
            <div>
              <div className="text-[11px] uppercase tracking-wide text-[var(--text-secondary)]">Subject</div>
              <div className="text-[13px] font-semibold text-[var(--foreground)]">{s.subject ?? "—"}</div>
            </div>
            {/* Editable email body — TipTap rich-text editor. onChange returns
                plain text (HTML stripped), so it's send-ready as-is. The LinkedIn
                message below stays a plain read-only field (300-char, plain text). */}
            <div>
              <div className="mb-1 flex items-center justify-between">
                <div className="text-[11px] uppercase tracking-wide text-[var(--text-secondary)]">Body</div>
                {dirty && (
                  <XpButton
                    variant="primary"
                    className="!px-2.5 !py-1 !text-[11px]"
                    disabled={saveBody.isPending}
                    onClick={() => saveBody.mutate()}
                  >
                    {saveBody.isPending ? "Saving…" : saveBody.isError ? "Retry save" : "Save edits"}
                  </XpButton>
                )}
              </div>
              <TipTapEditor content={s.body ?? ""} onChange={setBody} maxWords={120} />
            </div>
            {!!(s.personalization_hooks && s.personalization_hooks.length) && (
              <div className="flex flex-wrap gap-1.5">
                {s.personalization_hooks!.map((h, i) => <XpBadge key={i} color="#0f766e">{h}</XpBadge>)}
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="mb-1 flex justify-between text-[11px] uppercase tracking-wide text-[var(--text-secondary)]">
                  <span>Critic</span><span className="font-semibold text-[var(--foreground)]">{critic.toFixed(1)}/10</span>
                </div>
                <XpProgress value={critic * 10} tone={critic >= 7 ? "green" : "amber"} />
              </div>
              <div>
                <div className="mb-1 flex justify-between text-[11px] uppercase tracking-wide text-[var(--text-secondary)]">
                  <span>Confidence</span><span className="font-semibold text-[var(--foreground)]">{Math.round(conf)}</span>
                </div>
                <XpProgress value={conf} tone={conf >= 70 ? "green" : "teal"} />
              </div>
            </div>
          </>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] uppercase tracking-wide text-[var(--text-secondary)]">
              <span>Connection request</span>
              <XpBadge color={li.length > 300 ? "#dc2626" : "#0f766e"}>{li.length}/300</XpBadge>
            </div>
            <div className="min-h-[72px] whitespace-pre-wrap rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[12px] leading-relaxed text-[var(--foreground)]">
              {li || <span className="italic text-[var(--text-secondary)]">No LinkedIn message was drafted for this account.</span>}
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <XpButton disabled={!li} onClick={copy}>
                  <Copy size={13} /> Copy
                </XpButton>
                {copied && (
                  <span className="absolute -top-7 left-0 whitespace-nowrap rounded bg-[var(--success)] px-2 py-0.5 text-[11px] font-semibold text-white">
                    Copied! ✓
                  </span>
                )}
              </div>
              <XpButton disabled={!s.dm_linkedin} onClick={() => s.dm_linkedin && window.open(s.dm_linkedin, "_blank")}>
                <ExternalLink size={13} /> Open Profile
              </XpButton>
            </div>
          </div>
        )}

        <div className="flex items-center justify-end gap-2 border-t border-[var(--border)] pt-2">
          <button
            className="mr-auto inline-flex items-center gap-1 rounded-md border border-[var(--border)] bg-white px-2.5 py-1.5 text-[12px] font-medium text-[var(--text-secondary)] hover:bg-[var(--surface)]"
            onClick={() => setDncOpen(true)}
            title="Add to do-not-contact"
          >
            <Ban size={13} /> DNC
          </button>
          <XpButton variant="green" disabled={busy} onClick={() => approve.mutate()}>
            <Check size={14} /> Approve
          </XpButton>
          <XpButton variant="red" disabled={busy} onClick={() => reject.mutate()}>
            <X size={14} /> Reject
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
        <div className="text-[13px] text-[var(--foreground)]">
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
    <div className="card-flush border-[#fecaca]">
      <div className="flex items-center gap-2 border-b border-[#fecaca] bg-[var(--danger-soft)] px-4 py-2.5">
        <AlertTriangle size={15} className="text-[var(--danger)]" />
        <span className="text-[13px] font-semibold text-[#991b1b]">{s.company ?? "—"}</span>
        <span className="text-[12px] text-[#b45454]">{s.dm_name ?? ""}</span>
        <XpBadge color="#dc2626" className="ml-auto uppercase">{s.status}</XpBadge>
      </div>
      <div className="space-y-2 px-4 py-3">
        {s.subject && <div className="text-[12px] font-semibold text-[var(--foreground)]">{s.subject}</div>}
        <div className="text-[12px] italic text-[var(--danger)]">
          {s.critic_feedback || "The critic flagged this draft. Re-draft to try a different angle."}
        </div>
        <div className="flex justify-end border-t border-[var(--border)] pt-2">
          <XpButton disabled={redraft.isPending || redraft.isSuccess} onClick={() => redraft.mutate()}>
            <RotateCcw size={13} className={redraft.isPending ? "animate-spin" : ""} />
            {redraft.isPending ? "Re-drafting…" : redraft.isSuccess ? "Queued" : "Re-draft"}
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
    <div className="card-flush">
      <div className="flex items-center gap-2 border-b border-[var(--border)] px-4 py-2.5">
        <ImageIcon size={15} className="text-[var(--accent)]" />
        <span className="text-[13px] font-semibold text-[var(--foreground)]">Variant {c.variant}</span>
        <XpBadge color="#2563eb" className="uppercase">{c.platform}</XpBadge>
      </div>
      <div className="space-y-2 px-4 py-3 text-[12px]">
        <div className="text-[14px] font-semibold text-[var(--foreground)]">{c.headline}</div>
        <div className="text-[var(--text-secondary)]">{c.body}</div>
        {c.cta && <div className="inline-block rounded-md bg-[var(--accent)] px-3 py-1 text-[12px] font-semibold text-white">{c.cta}</div>}
        {c.image_brief && (
          <div className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[11px] italic text-[var(--text-secondary)]">
            <span className="font-semibold not-italic text-[var(--foreground)]">Art brief: </span>{c.image_brief}
          </div>
        )}
        <div className="flex justify-end gap-2 border-t border-[var(--border)] pt-2">
          <XpButton variant="green" disabled={busy} onClick={() => approve.mutate()}>
            <Check size={14} /> Approve
          </XpButton>
          <XpButton variant="red" disabled={busy} onClick={() => reject.mutate()}>
            <X size={14} /> Reject
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
            <div className="mb-2 flex items-center gap-2 text-[12px] font-semibold uppercase tracking-wide text-[var(--danger)]">
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
