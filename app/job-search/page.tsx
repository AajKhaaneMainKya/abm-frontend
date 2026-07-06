"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Users, Send, MessageSquare, MessagesSquare, ArrowRight, Sparkles } from "lucide-react";
import {
  getQueue,
  getAccounts,
  getDecisions,
  getActivity,
  getReplies,
  getCandidateMatches,
  getCandidateNotifications,
  respondToNotification,
} from "@/lib/api";
import { StatCard, Loading, ErrorNote } from "@/components/xp";
import { JOB_SEARCH_CLIENT_ID } from "@/lib/job-search";
import { fmtRelative } from "@/lib/job-search";

const REFRESH = 30_000;
const CLIENT_ID = JOB_SEARCH_CLIENT_ID;

function CompaniesInterested() {
  const qc = useQueryClient();
  const [respondingId, setRespondingId] = useState<string | null>(null);

  const matches = useQuery({
    queryKey: ["candidate-matches"],
    queryFn: getCandidateMatches,
    refetchInterval: REFRESH,
  });
  const notifications = useQuery({
    queryKey: ["candidate-notifications"],
    queryFn: getCandidateNotifications,
    refetchInterval: REFRESH,
  });

  const respond = useMutation({
    mutationFn: ({ notifId, action }: { notifId: string; action: "approve" | "reject" }) =>
      respondToNotification(notifId, action),
    onMutate: ({ notifId }) => setRespondingId(notifId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["candidate-matches"] });
      qc.invalidateQueries({ queryKey: ["candidate-notifications"] });
    },
    onSettled: () => setRespondingId(null),
  });

  // Silent-fail this section on error/loading — it's a bonus above the
  // existing dashboard, not core to it.
  if (matches.isLoading || matches.error) return null;
  const list = matches.data ?? [];
  if (list.length === 0) return null;

  const findNotif = (shortlistId: string) =>
    (notifications.data ?? []).find(
      (n) => n.type === "reveal_request" && n.metadata?.shortlist_id === shortlistId,
    );

  return (
    <div>
      <div className="mb-2 text-[13px] font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
        Companies Interested In You
      </div>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {list.map((m) => {
          const notif = m.reveal_state === "requested" ? findNotif(m.shortlist_id) : undefined;
          return (
            <div key={m.shortlist_id} className="card p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[13px] text-[var(--text-secondary)]">
                    A {m.company_stage ?? "growing"} company in {m.location ?? "your area"}
                  </div>
                  <div className="mt-0.5 text-[14px] font-semibold text-[var(--foreground)]">
                    {m.role_title}
                  </div>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-[13px] font-bold ${
                    m.match_score >= 80
                      ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                      : "bg-[var(--surface)] text-[var(--text-secondary)]"
                  }`}
                >
                  {Math.round(m.match_score)}
                </span>
              </div>

              <div className="mt-3 text-[12px]">
                {m.reveal_state === "signal" && (
                  <span className="text-[var(--text-secondary)]">Reviewing your profile</span>
                )}
                {m.reveal_state === "requested" && (
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-[var(--accent)]">
                      Wants to connect — respond?
                    </span>
                    {notif && (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={respondingId === notif.id}
                          onClick={() => respond.mutate({ notifId: notif.id, action: "approve" })}
                          className="btn btn-success"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          disabled={respondingId === notif.id}
                          onClick={() => respond.mutate({ notifId: notif.id, action: "reject" })}
                          className="btn btn-secondary"
                        >
                          Decline
                        </button>
                      </div>
                    )}
                  </div>
                )}
                {m.reveal_state === "revealed" && (
                  <span className="font-medium text-[var(--success)]">Connected ✓</span>
                )}
                {m.reveal_state === "rejected" && (
                  <span className="text-[var(--text-secondary)]">Declined</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface AttentionItem {
  key: string;
  company: string;
  person: string;
  what: string;
  cta: string;
  href: string;
  at: string;
}

function NeedsAttention() {
  const queue = useQuery({ queryKey: ["js-queue", CLIENT_ID], queryFn: () => getQueue(CLIENT_ID), refetchInterval: REFRESH });
  const replies = useQuery({ queryKey: ["js-replies", CLIENT_ID], queryFn: () => getReplies(CLIENT_ID), refetchInterval: REFRESH });

  if (queue.isLoading || replies.isLoading) return <Loading label="Checking what needs attention…" />;
  if (queue.error) return <ErrorNote error={queue.error} />;
  if (replies.error) return <ErrorNote error={replies.error} />;

  const pending = (queue.data?.sequences ?? []).filter((s) => s.status === "PENDING_APPROVAL");
  const outstanding = (replies.data ?? []).filter((r) => r.needs_follow_up);

  const items: AttentionItem[] = [
    ...pending.map((s) => ({
      key: `pending-${s.id}`,
      company: s.company ?? "—",
      person: [s.dm_name, s.dm_title].filter(Boolean).join(" · "),
      what: "Approve outreach",
      cta: "Review →",
      href: "/job-search/queue",
      at: s.created_at,
    })),
    ...outstanding.map((r) => {
      const overdue = !!r.follow_up_due_at && new Date(r.follow_up_due_at).getTime() < Date.now();
      return {
        key: `reply-${r.id}`,
        company: r.company ?? "—",
        person: [r.dm_name, r.dm_title].filter(Boolean).join(" · "),
        what: overdue ? "Follow-up due" : "Reply received — follow up",
        cta: overdue ? "Draft Follow-up →" : "View Reply →",
        href: "/job-search/replies",
        at: r.replied_at ?? r.created_at,
      };
    }),
  ];

  items.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  const top = items.slice(0, 8);

  if (top.length === 0) {
    return (
      <div className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-4 py-6 text-center text-[13px] text-[var(--text-secondary)]">
        Nothing needs your attention right now — you&apos;re all caught up.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
      {top.map((item) => (
        <Link
          key={item.key}
          href={item.href}
          className="card flex items-center justify-between gap-3 p-4 transition hover:border-[var(--accent)] hover:shadow-md"
        >
          <div className="min-w-0">
            <div className="truncate text-[13px] font-semibold text-[var(--foreground)]">{item.company}</div>
            <div className="truncate text-[12px] text-[var(--text-secondary)]">{item.person || "—"}</div>
            <div className="mt-1 text-[12px] font-medium text-[var(--accent)]">{item.what}</div>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1 text-[12px] font-semibold text-[var(--accent)]">
            {item.cta.replace(" →", "")} <ArrowRight size={13} />
          </span>
        </Link>
      ))}
    </div>
  );
}

function PipelineSummary() {
  const accounts = useQuery({
    queryKey: ["js-accounts-summary", CLIENT_ID],
    queryFn: () => getAccounts(CLIENT_ID),
    refetchInterval: REFRESH,
  });

  if (accounts.isLoading) return <Loading label="Loading pipeline…" />;
  if (accounts.error) return <ErrorNote error={accounts.error} />;

  const list = accounts.data ?? [];
  const discovered = list.length;
  const outreached = list.filter((a) => ["DRAFTED", "PENDING_APPROVAL", "SENT"].includes(a.state)).length;
  const replied = list.filter((a) => a.state === "REPLIED").length;
  const conversations = list.filter((a) => a.state === "REPLIED" && (a.touch_count ?? 0) > 1).length;

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <StatCard label="Discovered" value={discovered} accent="#6b7280" icon={<Users size={14} />} />
      <StatCard label="Outreached" value={outreached} accent="#2563eb" icon={<Send size={14} />} />
      <StatCard label="Replied" value={replied} accent="#15803d" icon={<MessageSquare size={14} />} />
      <StatCard label="Conversations" value={conversations} accent="#0f766e" icon={<MessagesSquare size={14} />} />
    </div>
  );
}

function OrchestratorSays() {
  const decisions = useQuery({
    queryKey: ["js-decisions", CLIENT_ID],
    queryFn: () => getDecisions(CLIENT_ID),
    refetchInterval: REFRESH,
  });

  if (decisions.isLoading) return <Loading label="Reading the latest reasoning…" />;
  if (decisions.error) return <ErrorNote error={decisions.error} />;

  const latest = decisions.data?.[0];

  return (
    <div className="card-flush">
      <div className="card-header">
        <Sparkles size={14} className="text-[var(--accent)]" />
        Orchestrator Says
      </div>
      <div className="p-4">
        {latest ? (
          <>
            <p className="text-[13px] italic leading-relaxed text-[var(--foreground)]">
              &ldquo;{latest.reasoning}&rdquo;
            </p>
            <p className="mt-2 text-[11px] text-[var(--text-secondary)]">
              {latest.action_taken} · {fmtRelative(latest.created_at)}
            </p>
          </>
        ) : (
          <p className="text-[13px] text-[var(--text-secondary)]">
            No reasoning logged yet — trigger a cycle to see the orchestrator think out loud.
          </p>
        )}
      </div>
    </div>
  );
}

function TodaysActivity() {
  const activity = useQuery({
    queryKey: ["js-activity", CLIENT_ID],
    queryFn: () => getActivity(CLIENT_ID),
    refetchInterval: REFRESH,
  });

  if (activity.isLoading) return <Loading label="Loading activity…" />;
  if (activity.error) return <ErrorNote error={activity.error} />;

  const items = (activity.data?.activity ?? []).slice(-5).reverse();

  return (
    <div className="card-flush">
      <div className="card-header">Today&apos;s Activity</div>
      <div className="p-4">
        {items.length === 0 ? (
          <p className="text-[13px] text-[var(--text-secondary)]">
            No recent activity — trigger the orchestrator to get things moving.
          </p>
        ) : (
          <ol className="space-y-3">
            {items.map((item, i) => (
              <li key={i} className="flex gap-3 text-[13px]">
                <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--accent)]" />
                <div className="min-w-0 flex-1">
                  <span className="text-[var(--foreground)]">{item.reasoning}</span>
                  <span className="ml-2 text-[11px] text-[var(--text-secondary)]">{fmtRelative(item.created_at)}</span>
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}

export default function JobSearchDashboardPage() {
  return (
    <div className="space-y-6">
      <CompaniesInterested />

      <div>
        <div className="mb-2 text-[13px] font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
          Needs Attention
        </div>
        <NeedsAttention />
      </div>

      <div>
        <div className="mb-2 text-[13px] font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
          Pipeline Summary
        </div>
        <PipelineSummary />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <OrchestratorSays />
        <TodaysActivity />
      </div>
    </div>
  );
}
