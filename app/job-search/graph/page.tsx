"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { RotateCcw, Network, ArrowRight } from "lucide-react";
import { getAccounts, getAccountSequences, type AccountSequence } from "@/lib/api";
import { Loading, ErrorNote, XpButton, XpBadge, XpProgress } from "@/components/xp";
import { JOB_SEARCH_CLIENT_ID, ACCOUNT_STATUS_COLORS, STATE_NODE_FILL, fmtRelative } from "@/lib/job-search";
import MindMap, { type MindMapHandle } from "@/components/job-search/mind-map";

const CLIENT_ID = JOB_SEARCH_CLIENT_ID;
const FILTERABLE_STATES = ["DISCOVERED", "ENRICHED", "DRAFTED", "PENDING_APPROVAL", "SENT", "REPLIED"];

export default function JobSearchGraphPage() {
  const mapRef = useRef<MindMapHandle>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [visibleStates, setVisibleStates] = useState<Set<string>>(new Set(FILTERABLE_STATES));

  const accountsQ = useQuery({ queryKey: ["js-accounts", CLIENT_ID], queryFn: () => getAccounts(CLIENT_ID) });
  const accounts = accountsQ.data ?? [];

  const sequencesQ = useQuery({
    queryKey: ["js-all-sequences", CLIENT_ID, accounts.map((a) => a.id).join(",")],
    queryFn: async () => {
      const entries = await Promise.all(
        accounts.map(async (a) => [a.id, await getAccountSequences(CLIENT_ID, a.id)] as const),
      );
      return Object.fromEntries(entries) as Record<string, AccountSequence[]>;
    },
    enabled: accounts.length > 0,
  });

  const filteredAccounts = useMemo(
    () => accounts.filter((a) => visibleStates.has(a.state) || !FILTERABLE_STATES.includes(a.state)),
    [accounts, visibleStates],
  );

  const selectedAccount = accounts.find((a) => a.id === selected) ?? null;

  if (accountsQ.isLoading) return <Loading label="Building your mind map…" />;
  if (accountsQ.error) return <ErrorNote error={accountsQ.error} />;

  if (accounts.length === 0) {
    return (
      <div className="mx-auto mt-10 flex max-w-md flex-col items-center gap-4 rounded-lg border border-[var(--border)] bg-white p-8 text-center shadow-sm">
        <span className="grid h-12 w-12 place-items-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent)]">
          <Network size={24} />
        </span>
        <p className="text-[14px] text-[var(--text-secondary)]">
          Start targeting companies to build your mind map.
        </p>
        <Link href="/job-search/companies" className="btn btn-primary">
          Go to Companies <ArrowRight size={14} />
        </Link>
      </div>
    );
  }

  const repliedCount = accounts.filter((a) => a.state === "REPLIED").length;

  return (
    <div className="flex h-[calc(100vh-140px)] gap-4">
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-[var(--border)] bg-white px-4 py-2.5">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
            Filter
          </span>
          {FILTERABLE_STATES.map((state) => (
            <label key={state} className="flex items-center gap-1.5 text-[12px] text-[var(--foreground)]">
              <input
                type="checkbox"
                checked={visibleStates.has(state)}
                onChange={(e) =>
                  setVisibleStates((prev) => {
                    const next = new Set(prev);
                    if (e.target.checked) next.add(state);
                    else next.delete(state);
                    return next;
                  })
                }
                style={{ accentColor: STATE_NODE_FILL[state] ? "#0f766e" : undefined }}
              />
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ background: STATE_NODE_FILL[state] ?? "#e5e7eb", border: "1px solid #d1d5db" }}
              />
              {state}
            </label>
          ))}
          <XpButton className="ml-auto" onClick={() => mapRef.current?.resetLayout()}>
            <RotateCcw size={13} /> Reset layout
          </XpButton>
          <span className="text-[12px] text-[var(--text-secondary)]">
            {accounts.length} {accounts.length === 1 ? "company" : "companies"} · {repliedCount} replied
          </span>
        </div>

        <div className="min-h-0 flex-1 rounded-lg border border-[var(--border)] bg-white">
          {sequencesQ.isLoading ? (
            <Loading label="Loading touch history…" />
          ) : (
            <MindMap
              ref={mapRef}
              accounts={filteredAccounts}
              sequencesByAccount={sequencesQ.data ?? {}}
              onSelect={setSelected}
            />
          )}
        </div>
      </div>

      {selectedAccount && (
        <div className="w-[280px] shrink-0 overflow-y-auto rounded-lg border border-[var(--border)] bg-white p-4">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-[14px] font-semibold text-[var(--foreground)]">{selectedAccount.company}</div>
            <XpBadge color={ACCOUNT_STATUS_COLORS[selectedAccount.state] ?? "#6b7280"}>
              {selectedAccount.state}
            </XpBadge>
          </div>
          <div className="space-y-3 text-[13px]">
            <div>
              <div className="text-[11px] uppercase tracking-wide text-[var(--text-secondary)]">Founder</div>
              <div className="text-[var(--foreground)]">
                {selectedAccount.dm_name ?? "—"}
                {selectedAccount.dm_title ? ` · ${selectedAccount.dm_title}` : ""}
              </div>
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wide text-[var(--text-secondary)]">Touches</div>
              <div className="text-[var(--foreground)]">
                {selectedAccount.touch_count ?? 0} · last {fmtRelative(selectedAccount.last_touched_at)}
              </div>
            </div>
            <div>
              <div className="mb-1 flex justify-between text-[11px] uppercase tracking-wide text-[var(--text-secondary)]">
                <span>Engagement</span>
                <span className="font-semibold text-[var(--foreground)]">
                  {Math.round(selectedAccount.engagement_score ?? 0)}/100
                </span>
              </div>
              <XpProgress value={selectedAccount.engagement_score ?? 0} tone="teal" />
            </div>
            <Link
              href="/job-search/companies"
              className="btn btn-secondary mt-2 w-full justify-center"
            >
              View in Companies <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
