"use client";

import { Fragment, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronRight, ChevronDown, ExternalLink, Play, Archive as ArchiveIcon } from "lucide-react";
import {
  getAccounts,
  getAccountSequences,
  addToDnc,
  triggerOrchestrator,
  type Account,
} from "@/lib/api";
import { XpButton, XpBadge, XpProgress, XpDialog, Loading, ErrorNote } from "@/components/xp";
import { JOB_SEARCH_CLIENT_ID, ACCOUNT_STATUS_COLORS, fmtRelative, fmtDate } from "@/lib/job-search";

const CLIENT_ID = JOB_SEARCH_CLIENT_ID;

function ExpandedRow({ account }: { account: Account }) {
  const qc = useQueryClient();
  const [dncOpen, setDncOpen] = useState(false);

  const sequences = useQuery({
    queryKey: ["js-account-sequences", account.id],
    queryFn: () => getAccountSequences(CLIENT_ID, account.id),
  });

  const trigger = useMutation({ mutationFn: () => triggerOrchestrator(CLIENT_ID) });
  const archive = useMutation({
    mutationFn: () => addToDnc(CLIENT_ID, account.id),
    onSuccess: () => {
      setDncOpen(false);
      qc.invalidateQueries({ queryKey: ["js-accounts"] });
    },
  });

  const belief = account.belief_state ?? {};
  const angles = belief.angles_tried ?? account.angles_tried ?? [];
  const profileUrl = account.dm_linkedin || (account.domain ? `https://${account.domain}` : null);

  return (
    <tr>
      <td colSpan={9} className="bg-[var(--surface)] px-5 py-4">
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <div>
            <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
              Company description
            </div>
            <p className="text-[13px] leading-relaxed text-[var(--foreground)]">
              {account.description || "No description recorded yet."}
            </p>

            <div className="mb-1 mt-4 text-[11px] font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
              Belief state
            </div>
            <div className="space-y-2 text-[13px] text-[var(--foreground)]">
              <div>
                Touches: <strong>{account.touch_count ?? 0}</strong> · Engagement:{" "}
                <strong>{Math.round(account.engagement_score ?? 0)}/100</strong>
              </div>
              {angles.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {angles.map((a, i) => (
                    <XpBadge key={i} color="#7c3aed">{a}</XpBadge>
                  ))}
                </div>
              )}
              {belief.recommended_next_angle && (
                <div className="text-[12px] italic text-[var(--text-secondary)]">
                  Recommended next angle: {belief.recommended_next_angle}
                </div>
              )}
              {angles.length === 0 && !belief.recommended_next_angle && (
                <div className="text-[12px] text-[var(--text-secondary)]">No belief-state signals yet.</div>
              )}
            </div>
          </div>

          <div>
            <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
              Sequences sent
            </div>
            {sequences.isLoading ? (
              <Loading label="Loading sequences…" />
            ) : sequences.error ? (
              <ErrorNote error={sequences.error} />
            ) : (sequences.data ?? []).length === 0 ? (
              <p className="text-[13px] text-[var(--text-secondary)]">No sequences drafted yet.</p>
            ) : (
              <ul className="space-y-2">
                {(sequences.data ?? []).map((s) => (
                  <li key={s.id} className="flex items-center justify-between gap-2 rounded-md border border-[var(--border)] bg-white px-3 py-2">
                    <div className="min-w-0">
                      <div className="truncate text-[12px] font-medium text-[var(--foreground)]">{s.subject ?? "(no subject)"}</div>
                      <div className="text-[11px] text-[var(--text-secondary)]">{fmtDate(s.created_at)}</div>
                    </div>
                    <XpBadge color={ACCOUNT_STATUS_COLORS[s.status] ?? "#6b7280"}>{s.status}</XpBadge>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2 border-t border-[var(--border)] pt-3">
          <XpButton
            variant="primary"
            disabled={trigger.isPending}
            onClick={() => trigger.mutate()}
          >
            <Play size={13} /> {trigger.isPending ? "Triggering…" : trigger.isSuccess ? "Triggered" : "Trigger outreach"}
          </XpButton>
          <button
            className="inline-flex items-center gap-1 rounded-md border border-[var(--border)] bg-white px-2.5 py-1.5 text-[12px] font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]"
            onClick={() => setDncOpen(true)}
          >
            <ArchiveIcon size={13} /> Archive
          </button>
          <button
            className="ml-auto inline-flex items-center gap-1 rounded-md border border-[var(--border)] bg-white px-2.5 py-1.5 text-[12px] font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] disabled:opacity-40"
            disabled={!profileUrl}
            onClick={() => profileUrl && window.open(profileUrl, "_blank")}
          >
            <ExternalLink size={13} /> View profile
          </button>
        </div>

        <XpDialog
          open={dncOpen}
          onOpenChange={(o) => !o && setDncOpen(false)}
          title="Archive company"
          footer={
            <>
              <XpButton onClick={() => setDncOpen(false)}>Cancel</XpButton>
              <XpButton variant="red" disabled={archive.isPending} onClick={() => archive.mutate()}>
                {archive.isPending ? "Archiving…" : "Confirm archive"}
              </XpButton>
            </>
          }
        >
          <p className="text-[13px] text-[var(--foreground)]">
            This adds <strong>{account.company}</strong> to the do-not-contact list. It will be
            removed from the pipeline and never contacted again.
          </p>
        </XpDialog>
      </td>
    </tr>
  );
}

export default function CompaniesPage() {
  const [expanded, setExpanded] = useState<string | null>(null);
  const { data, isLoading, error } = useQuery({
    queryKey: ["js-accounts", CLIENT_ID],
    queryFn: () => getAccounts(CLIENT_ID),
  });

  if (isLoading) return <Loading label="Loading companies…" />;
  if (error) return <ErrorNote error={error} />;

  const accounts = data ?? [];

  if (accounts.length === 0) {
    return (
      <p className="py-10 text-center text-[13px] text-[var(--text-secondary)]">
        No companies targeted yet. Trigger the orchestrator to start discovery.
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-[var(--border)]">
      <div className="overflow-x-auto">
        <table className="sk-table">
          <thead>
            <tr>
              <th></th>
              <th>Company</th>
              <th>Founder</th>
              <th>Title</th>
              <th>Industry</th>
              <th>Stage</th>
              <th>ICP Match</th>
              <th>Touches</th>
              <th>Status</th>
              <th>Last Activity</th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((a) => {
              const isOpen = expanded === a.id;
              return (
                <Fragment key={a.id}>
                  <tr
                    className="cursor-pointer"
                    onClick={() => setExpanded(isOpen ? null : a.id)}
                  >
                    <td className="w-8 text-[var(--text-secondary)]">
                      {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </td>
                    <td className="font-semibold text-[var(--foreground)]">{a.company}</td>
                    <td>{a.dm_name ?? "—"}</td>
                    <td className="text-[var(--text-secondary)]">{a.dm_title ?? "—"}</td>
                    <td className="text-[var(--text-secondary)]">{a.industry ?? "—"}</td>
                    <td className="whitespace-nowrap text-[var(--text-secondary)]">
                      Layer {a.enrichment_layer ?? 0}/4
                    </td>
                    <td className="w-[120px]">
                      <XpProgress value={(a.icp_match_score ?? 0) * 100} tone="teal" showValue />
                    </td>
                    <td>{a.touch_count ?? 0}</td>
                    <td>
                      <XpBadge color={ACCOUNT_STATUS_COLORS[a.state] ?? "#6b7280"}>{a.state}</XpBadge>
                    </td>
                    <td className="whitespace-nowrap text-[var(--text-secondary)]">
                      {fmtRelative(a.last_touched_at)}
                    </td>
                  </tr>
                  {isOpen && <ExpandedRow account={a} />}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
