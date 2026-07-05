"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Send, ArrowRight } from "lucide-react";
import { getQueue, getReplies, getAccounts, sendActionsToTelegram } from "@/lib/api";
import { XpButton, Loading, ErrorNote } from "@/components/xp";
import { JOB_SEARCH_CLIENT_ID, fmtDate } from "@/lib/job-search";

const CLIENT_ID = JOB_SEARCH_CLIENT_ID;

type Priority = "high" | "medium" | "low";
const PRIORITY_META: Record<Priority, { icon: string; label: string }> = {
  high: { icon: "🔴", label: "High" },
  medium: { icon: "🟡", label: "Medium" },
  low: { icon: "⚪", label: "Low" },
};

interface ActionItem {
  key: string;
  priority: Priority;
  description: string;
  company: string;
  person: string;
  due: string | null;
  href: string;
  sortAt: string;
}

export default function JobSearchActionsPage() {
  const [shared, setShared] = useState(false);
  const queue = useQuery({ queryKey: ["js-queue", CLIENT_ID], queryFn: () => getQueue(CLIENT_ID) });
  const replies = useQuery({ queryKey: ["js-replies", CLIENT_ID], queryFn: () => getReplies(CLIENT_ID) });
  const accounts = useQuery({ queryKey: ["js-accounts", CLIENT_ID], queryFn: () => getAccounts(CLIENT_ID) });

  const share = useMutation({
    mutationFn: () => sendActionsToTelegram(CLIENT_ID),
    onSuccess: () => { setShared(true); setTimeout(() => setShared(false), 2500); },
  });

  if (queue.isLoading || replies.isLoading || accounts.isLoading) return <Loading label="Building your action list…" />;
  if (queue.error) return <ErrorNote error={queue.error} />;
  if (replies.error) return <ErrorNote error={replies.error} />;
  if (accounts.error) return <ErrorNote error={accounts.error} />;

  const pending = (queue.data?.sequences ?? []).filter((s) => s.status === "PENDING_APPROVAL");
  const outstanding = (replies.data ?? []).filter((r) => r.needs_follow_up);
  const overdue = outstanding.filter((r) => r.follow_up_due_at && new Date(r.follow_up_due_at).getTime() < Date.now());
  const positiveOpen = outstanding.filter((r) => !overdue.includes(r) && r.reply_sentiment === "positive");
  const discoveredNotEnriched = (accounts.data ?? []).filter((a) => a.state === "DISCOVERED" && (a.touch_count ?? 0) === 0);

  const items: ActionItem[] = [
    ...pending.map((s) => ({
      key: `pending-${s.id}`,
      priority: "high" as const,
      description: "Approve outreach",
      company: s.company ?? "—",
      person: [s.dm_name, s.dm_title].filter(Boolean).join(" · "),
      due: null,
      href: "/job-search/queue",
      sortAt: s.created_at,
    })),
    ...overdue.map((r) => ({
      key: `overdue-${r.id}`,
      priority: "high" as const,
      description: "Follow-up overdue",
      company: r.company ?? "—",
      person: [r.dm_name, r.dm_title].filter(Boolean).join(" · "),
      due: r.follow_up_due_at,
      href: "/job-search/replies",
      sortAt: r.follow_up_due_at ?? r.created_at,
    })),
    ...positiveOpen.map((r) => ({
      key: `positive-${r.id}`,
      priority: "medium" as const,
      description: "Positive reply — send a follow-up",
      company: r.company ?? "—",
      person: [r.dm_name, r.dm_title].filter(Boolean).join(" · "),
      due: r.follow_up_due_at,
      href: "/job-search/replies",
      sortAt: r.replied_at ?? r.created_at,
    })),
    ...discoveredNotEnriched.map((a) => ({
      key: `unenriched-${a.id}`,
      priority: "low" as const,
      description: "Discovered — not yet enriched",
      company: a.company,
      person: a.dm_name ?? "—",
      due: null,
      href: "/job-search/companies",
      sortAt: a.created_at ?? "",
    })),
  ];

  const order: Record<Priority, number> = { high: 0, medium: 1, low: 2 };
  items.sort((a, b) => order[a.priority] - order[b.priority] || new Date(b.sortAt).getTime() - new Date(a.sortAt).getTime());

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-[13px] text-[var(--text-secondary)]">
          {items.length} {items.length === 1 ? "item needs" : "items need"} attention
        </div>
        <XpButton variant="primary" disabled={share.isPending} onClick={() => share.mutate()}>
          <Send size={14} /> {share.isPending ? "Sending…" : shared ? "Sent ✓" : "Share to Telegram"}
        </XpButton>
      </div>

      {items.length === 0 ? (
        <p className="py-10 text-center text-[13px] text-[var(--text-secondary)]">
          Nothing needs doing right now — you&apos;re all caught up.
        </p>
      ) : (
        <div className="divide-y divide-[var(--border)] overflow-hidden rounded-lg border border-[var(--border)] bg-white">
          {items.map((item) => (
            <div key={item.key} className="flex items-center gap-3 px-4 py-3">
              <span className="text-[16px]">{PRIORITY_META[item.priority].icon}</span>
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-medium text-[var(--foreground)]">{item.description}</div>
                <div className="truncate text-[12px] text-[var(--text-secondary)]">
                  {item.company}{item.person && item.person !== "—" ? ` · ${item.person}` : ""}
                  {item.due && ` · Due ${fmtDate(item.due)}`}
                </div>
              </div>
              <Link
                href={item.href}
                className="inline-flex shrink-0 items-center gap-1 rounded-md bg-[var(--accent)] px-3 py-1.5 text-[12px] font-medium text-white hover:bg-[var(--accent-hover)]"
              >
                Do it <ArrowRight size={12} />
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
