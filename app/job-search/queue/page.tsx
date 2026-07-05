"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, X, RotateCcw, Sparkles } from "lucide-react";
import {
  getQueue,
  getAccounts,
  approveItem,
  rejectItem,
  redraftItem,
  updateSequenceBody,
  type QueueSequence,
  type Account,
} from "@/lib/api";
import { XpButton, XpBadge, XpProgress, Loading, ErrorNote } from "@/components/xp";
import TipTapEditor from "@/components/tiptap-editor";
import { JOB_SEARCH_CLIENT_ID } from "@/lib/job-search";

const CLIENT_ID = JOB_SEARCH_CLIENT_ID;

/** Why this company was targeted — pulled from belief_state / the account description. */
function MatchCard({ account }: { account?: Account }) {
  if (!account) return null;

  const bullets: string[] = [];
  if (account.industry) bullets.push(`${account.industry} company matching your ICP`);
  if (account.icp_match_score) bullets.push(`${Math.round(account.icp_match_score * 100)}% ICP match score`);
  const nextAngle = account.belief_state?.recommended_next_angle;
  if (nextAngle) bullets.push(`Recommended angle: ${nextAngle}`);
  if (bullets.length === 0 && account.description) {
    bullets.push(account.description.slice(0, 140));
  }
  if (bullets.length === 0) bullets.push("Matches your target company profile.");

  return (
    <div
      className="rounded-lg border px-3 py-2.5"
      style={{ background: "#f0fdfa", borderColor: "#99f6e4" }}
    >
      <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#0f766e]">
        <Sparkles size={12} /> Why this company
      </div>
      <ul className="space-y-1 text-[12px] text-[#115e59]">
        {bullets.slice(0, 3).map((b, i) => (
          <li key={i} className="flex gap-1.5">
            <span>•</span>
            <span>{b}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function QueueCard({ s, account }: { s: QueueSequence; account?: Account }) {
  const qc = useQueryClient();
  const [body, setBody] = useState(s.body ?? "");
  const dirty = body.trim() !== (s.body ?? "").trim();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["js-queue", CLIENT_ID] });

  const saveBody = useMutation({ mutationFn: () => updateSequenceBody(CLIENT_ID, s.id, body) });
  const approve = useMutation({
    mutationFn: async () => {
      if (dirty) await saveBody.mutateAsync();
      return approveItem(CLIENT_ID, s.id);
    },
    onSuccess: invalidate,
  });
  const reject = useMutation({ mutationFn: () => rejectItem(CLIENT_ID, s.id), onSuccess: invalidate });
  const redraft = useMutation({ mutationFn: () => redraftItem(CLIENT_ID, s.id), onSuccess: invalidate });

  const critic = s.critic_score ?? 0;
  const busy = approve.isPending || reject.isPending || redraft.isPending;

  return (
    <div className="card-flush">
      <div className="flex items-center gap-2 border-b border-[var(--border)] px-4 py-2.5">
        <span className="text-[13px] font-semibold text-[var(--foreground)]">{s.company ?? "—"}</span>
        <span className="text-[12px] text-[var(--text-secondary)]">
          {s.dm_name ?? ""}{s.dm_title ? ` · ${s.dm_title}` : ""}
        </span>
        <span className="ml-auto flex items-center gap-1.5">
          <span className="text-[11px] uppercase tracking-wide text-[var(--text-secondary)]">Critic</span>
          <XpBadge color={critic >= 7 ? "#15803d" : "#b45309"}>{critic.toFixed(1)}/10</XpBadge>
        </span>
      </div>

      <div className="space-y-3 px-4 py-3">
        <div>
          <div className="text-[11px] uppercase tracking-wide text-[var(--text-secondary)]">Subject</div>
          <div className="text-[13px] font-semibold text-[var(--foreground)]">{s.subject ?? "—"}</div>
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between">
            <div className="text-[11px] uppercase tracking-wide text-[var(--text-secondary)]">Body</div>
            {dirty && !approve.isPending && (
              <span className="text-[11px] font-medium text-[var(--accent)]">Edited — will save on approve</span>
            )}
          </div>
          <TipTapEditor content={s.body ?? ""} onChange={setBody} maxWords={150} />
        </div>

        <MatchCard account={account} />

        <div className="mt-1">
          <div className="mb-1 flex justify-between text-[11px] uppercase tracking-wide text-[var(--text-secondary)]">
            <span>Critic score</span>
            <span className="font-semibold text-[var(--foreground)]">{critic.toFixed(1)}/10</span>
          </div>
          <XpProgress value={critic * 10} tone={critic >= 7 ? "green" : "amber"} />
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-[var(--border)] pt-2">
          <XpButton disabled={busy} onClick={() => redraft.mutate()}>
            <RotateCcw size={13} className={redraft.isPending ? "animate-spin" : ""} />
            {redraft.isPending ? "Redrafting…" : "Redraft"}
          </XpButton>
          <XpButton variant="red" disabled={busy} onClick={() => reject.mutate()}>
            <X size={14} /> Reject
          </XpButton>
          <XpButton variant="green" disabled={busy} onClick={() => approve.mutate()}>
            <Check size={14} /> {dirty ? "Edit then Approve" : "Approve"}
          </XpButton>
        </div>
      </div>
    </div>
  );
}

export default function JobSearchQueuePage() {
  const queue = useQuery({ queryKey: ["js-queue", CLIENT_ID], queryFn: () => getQueue(CLIENT_ID) });
  const accounts = useQuery({ queryKey: ["js-accounts-map", CLIENT_ID], queryFn: () => getAccounts(CLIENT_ID) });

  const accountMap = useMemo(() => {
    const m = new Map<string, Account>();
    (accounts.data ?? []).forEach((a) => m.set(a.id, a));
    return m;
  }, [accounts.data]);

  if (queue.isLoading) return <Loading label="Loading outreach queue…" />;
  if (queue.error) return <ErrorNote error={queue.error} />;

  const pending = (queue.data?.sequences ?? []).filter((s) => s.status === "PENDING_APPROVAL");

  if (pending.length === 0) {
    return (
      <div className="mx-auto my-6 max-w-md rounded-lg border border-[var(--border)] bg-[var(--surface)] px-5 py-8 text-center">
        <p className="text-[14px] font-medium text-[var(--foreground)]">Nothing to review</p>
        <p className="mt-1 text-[13px] text-[var(--text-secondary)]">
          Drafted outreach will appear here once the orchestrator writes it for enriched companies.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {pending.map((s) => (
        <QueueCard key={s.id} s={s} account={s.account_id ? accountMap.get(s.account_id) : undefined} />
      ))}
    </div>
  );
}
