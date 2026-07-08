"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getCandidateMatches, getCandidateNotifications, respondToNotification } from "@/lib/api";
import { Loading, ErrorNote } from "@/components/xp";

const REFRESH = 30_000;

export default function MatchesPage() {
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

  if (matches.isLoading) return <Loading label="Loading your matches…" />;
  if (matches.error) return <ErrorNote error={matches.error} />;

  const list = matches.data ?? [];

  const findNotif = (shortlistId: string) =>
    (notifications.data ?? []).find(
      (n) => n.type === "reveal_request" && n.metadata?.shortlist_id === shortlistId,
    );

  if (list.length === 0) {
    return (
      <div className="mx-auto mt-10 flex max-w-md flex-col items-center gap-4 rounded-lg border border-[var(--border)] bg-white p-8 text-center shadow-sm">
        <span className="text-[40px]">💼</span>
        <p className="text-[14px] text-[var(--text-secondary)]">
          No matches yet. Complete your profile to get matched.
        </p>
        <Link href="/job-search/profile" className="btn btn-primary">
          Go to My Profile →
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-[20px] font-bold text-[var(--foreground)]">My Matches</h1>
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
                    Role: {m.role_title}
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
                    <span className="font-medium text-[var(--accent)]">Wants to connect — respond?</span>
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
