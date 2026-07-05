"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Users, Send, MessageSquare, MessagesSquare, ArrowRight, Sparkles } from "lucide-react";
import { getQueue, getAccounts, getDecisions, getActivity, getReplies } from "@/lib/api";
import { StatCard, Loading, ErrorNote } from "@/components/xp";
import { JOB_SEARCH_CLIENT_ID } from "@/lib/job-search";
import { fmtRelative } from "@/lib/job-search";

const REFRESH = 30_000;
const CLIENT_ID = JOB_SEARCH_CLIENT_ID;

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
