"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronRight, Send, CheckCircle2, Archive as ArchiveIcon, Clock } from "lucide-react";
import { getReplies, triggerOrchestrator, addToDnc, type Reply } from "@/lib/api";
import { XpButton, XpBadge, XpDialog, Loading, ErrorNote } from "@/components/xp";
import { JOB_SEARCH_CLIENT_ID, sentimentMeta, fmtRelative } from "@/lib/job-search";

const CLIENT_ID = JOB_SEARCH_CLIENT_ID;
const SNOOZE_MS = 7 * 24 * 60 * 60 * 1000;

const INTENT_COLORS: Record<string, string> = {
  interested: "#15803d",
  open: "#b45309",
  not_now: "#dc2626",
  wrong_fit: "#6b7280",
};

function ReplyCard({ reply, onDismiss }: { reply: Reply; onDismiss: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [reasoningOpen, setReasoningOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);

  const sentiment = sentimentMeta(reply.reply_sentiment);
  const followUp = useMutation({ mutationFn: () => triggerOrchestrator(CLIENT_ID) });
  const archive = useMutation({
    mutationFn: () => addToDnc(CLIENT_ID, reply.account_id),
    onSuccess: () => { setArchiveOpen(false); onDismiss(); },
  });

  const text = reply.reply_text ?? "";
  const isLong = text.length > 220;
  const shown = expanded || !isLong ? text : `${text.slice(0, 220)}…`;

  return (
    <div className="card-flush">
      <div className="flex items-center gap-2 border-b border-[var(--border)] px-4 py-2.5">
        <span className="text-[13px] font-semibold text-[var(--foreground)]">{reply.company ?? "—"}</span>
        <span className="text-[12px] text-[var(--text-secondary)]">
          {reply.dm_name ?? ""}{reply.dm_title ? ` · ${reply.dm_title}` : ""}
        </span>
        <span className="ml-auto flex items-center gap-1.5">
          <XpBadge color={sentiment.color}>{sentiment.emoji} {sentiment.label}</XpBadge>
          {reply.reply_intent && (
            <XpBadge color={INTENT_COLORS[reply.reply_intent] ?? "#6b7280"}>{reply.reply_intent}</XpBadge>
          )}
        </span>
      </div>

      <div className="space-y-3 px-4 py-3">
        <div>
          <div className="mb-1 text-[11px] uppercase tracking-wide text-[var(--text-secondary)]">Their reply</div>
          <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-[var(--foreground)]">{shown}</p>
          {isLong && (
            <button
              className="mt-1 text-[12px] font-medium text-[var(--accent)] hover:underline"
              onClick={() => setExpanded((v) => !v)}
            >
              {expanded ? "Show less" : "Show more"}
            </button>
          )}
        </div>

        {reply.reply_next_action && (
          <div className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[12px] text-[var(--foreground)]">
            <span className="font-semibold">Next action: </span>{reply.reply_next_action}
          </div>
        )}

        {reply.reply_reasoning && (
          <div>
            <button
              className="flex items-center gap-1 text-[12px] font-medium text-[var(--text-secondary)] hover:text-[var(--foreground)]"
              onClick={() => setReasoningOpen((v) => !v)}
            >
              {reasoningOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
              Reply reasoning
            </button>
            {reasoningOpen && (
              <p className="mt-1 text-[12px] italic leading-relaxed text-[var(--text-secondary)]">
                {reply.reply_reasoning}
              </p>
            )}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--border)] pt-2">
          <span className="text-[11px] text-[var(--text-secondary)]">{fmtRelative(reply.replied_at ?? reply.created_at)}</span>
          <div className="flex flex-wrap gap-2">
            <XpButton variant="primary" disabled={followUp.isPending} onClick={() => followUp.mutate()}>
              <Send size={13} /> {followUp.isPending ? "Queuing…" : followUp.isSuccess ? "Queued" : "Draft Follow-up"}
            </XpButton>
            <XpButton onClick={onDismiss}>
              <CheckCircle2 size={13} /> Mark Done
            </XpButton>
            <XpButton onClick={() => setArchiveOpen(true)}>
              <ArchiveIcon size={13} /> Archive
            </XpButton>
            <XpButton onClick={onDismiss} title="Hide for a week">
              <Clock size={13} /> Snooze 1 week
            </XpButton>
          </div>
        </div>
      </div>

      <XpDialog
        open={archiveOpen}
        onOpenChange={(o) => !o && setArchiveOpen(false)}
        title="Archive company"
        footer={
          <>
            <XpButton onClick={() => setArchiveOpen(false)}>Cancel</XpButton>
            <XpButton variant="red" disabled={archive.isPending} onClick={() => archive.mutate()}>
              {archive.isPending ? "Archiving…" : "Confirm archive"}
            </XpButton>
          </>
        }
      >
        <p className="text-[13px] text-[var(--foreground)]">
          This adds <strong>{reply.company}</strong> to the do-not-contact list.
        </p>
      </XpDialog>
    </div>
  );
}

export default function JobSearchRepliesPage() {
  const { data, isLoading, error } = useQuery({ queryKey: ["js-replies", CLIENT_ID], queryFn: () => getReplies(CLIENT_ID) });
  const [dismissed, setDismissed] = useState<Record<string, number>>({});

  if (isLoading) return <Loading label="Loading replies…" />;
  if (error) return <ErrorNote error={error} />;

  const now = Date.now();
  const replies = (data ?? []).filter((r) => !(dismissed[r.id] && dismissed[r.id] > now));

  if (replies.length === 0) {
    return (
      <p className="py-10 text-center text-[13px] text-[var(--text-secondary)]">
        No replies yet. Keep the outreach going.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {replies.map((r) => (
        <ReplyCard
          key={r.id}
          reply={r}
          onDismiss={() => setDismissed((d) => ({ ...d, [r.id]: now + SNOOZE_MS }))}
        />
      ))}
    </div>
  );
}
