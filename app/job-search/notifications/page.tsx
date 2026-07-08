"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getCandidateNotifications, type CandidateNotification } from "@/lib/api";
import { Loading, ErrorNote } from "@/components/xp";
import { fmtRelative } from "@/lib/job-search";

const REFRESH = 30_000;

export default function NotificationsPage() {
  // Read state is local-only — there's no generic mark-as-read endpoint.
  // The only mutation on marketplace_notifications is POST .../respond,
  // which requires action: "approve" | "reject" and, for reveal_request
  // notifications, actually approves/rejects the reveal. Reusing it for a
  // passive "I opened this" click would risk silently approving a
  // candidate's profile reveal — so this never calls it.
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  const notifications = useQuery({
    queryKey: ["candidate-notifications"],
    queryFn: getCandidateNotifications,
    refetchInterval: REFRESH,
  });

  if (notifications.isLoading) return <Loading label="Loading notifications…" />;
  if (notifications.error) return <ErrorNote error={notifications.error} />;

  const list = notifications.data ?? [];

  if (list.length === 0) {
    return (
      <div className="mx-auto mt-10 flex max-w-md flex-col items-center gap-4 rounded-lg border border-[var(--border)] bg-white p-8 text-center shadow-sm">
        <span className="text-[40px]">🔔</span>
        <p className="text-[14px] text-[var(--text-secondary)]">No notifications yet.</p>
      </div>
    );
  }

  const isUnread = (n: CandidateNotification) => !n.read && !readIds.has(n.id);

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-[20px] font-bold text-[var(--foreground)]">Notifications</h1>
      <div className="space-y-2">
        {list.map((n) => (
          <button
            key={n.id}
            type="button"
            onClick={() => setReadIds((prev) => new Set(prev).add(n.id))}
            className="card flex w-full items-start gap-3 p-4 text-left transition hover:border-[var(--accent)]"
          >
            <span
              className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                isUnread(n) ? "bg-[var(--accent)]" : "bg-transparent"
              }`}
            />
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-semibold text-[var(--foreground)]">{n.title}</div>
              {n.body && <div className="mt-0.5 text-[13px] text-[var(--text-secondary)]">{n.body}</div>}
              <div className="mt-1.5 text-[11px] text-[var(--text-secondary)]">{fmtRelative(n.created_at)}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
