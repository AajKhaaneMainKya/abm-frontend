"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getBriefShortlist,
  requestReveal,
  type ShortlistEntry,
  type ContextGraphExperience,
} from "@/lib/api";
import { XpBadge, XpProgress, Loading, ErrorNote } from "@/components/xp";

const POLL_MS = 10_000;
// The backend has no "matching in progress" flag — a brief's shortlist just
// stays empty until the background matching thread finishes. This window is
// the best available proxy: keep showing the "still finding candidates"
// state for the first few minutes, then fall back to the empty state.
const MATCHING_WINDOW_MS = 3 * 60 * 1000;

function profileChips(entry: ShortlistEntry): {
  industries: string[];
  location: string;
  buildsCount: number;
} {
  if (entry.anonymous) {
    return {
      industries: entry.profile.industries,
      location: entry.profile.location,
      buildsCount: entry.profile.builds_count,
    };
  }
  const cg = entry.profile.context_graph;
  const industries = Array.from(
    new Set(
      (cg.experiences ?? [])
        .map((e: ContextGraphExperience) => e.industry)
        .filter((v): v is string => Boolean(v)),
    ),
  ).slice(0, 3);
  return {
    industries,
    location: "—",
    buildsCount: (cg.builds ?? []).length,
  };
}

function ShortlistCard({
  entry,
  onReveal,
  revealing,
}: {
  entry: ShortlistEntry;
  onReveal: () => void;
  revealing: boolean;
}) {
  const chips = profileChips(entry);
  const topDims = Object.entries(entry.dimension_scores)
    .sort((a, b) => b[1].weighted_score - a[1].weighted_score)
    .slice(0, 5);

  return (
    <div className="card p-4">
      <div className="flex items-start justify-between gap-3">
        {entry.anonymous ? (
          <div className="flex items-center gap-2">
            <span className="select-none text-[15px] font-semibold text-[var(--foreground)] blur-[3px]">
              Anonymous Candidate
            </span>
            <span className="text-[11px] text-[var(--text-secondary)]">(hidden until revealed)</span>
          </div>
        ) : (
          <span className="text-[15px] font-semibold text-[var(--foreground)]">
            {entry.profile.name}
          </span>
        )}
        <span
          className={`shrink-0 rounded-full px-3 py-1 text-[16px] font-bold ${
            entry.score >= 80
              ? "bg-[var(--accent-soft)] text-[var(--accent)]"
              : "bg-[var(--surface)] text-[var(--text-secondary)]"
          }`}
        >
          {Math.round(entry.score)}
        </span>
      </div>

      <div className="mt-3 rounded-md bg-[var(--surface)] p-3 text-[13px] leading-relaxed text-[var(--foreground)]">
        {entry.match_explanation}
      </div>

      <div className="mt-4 space-y-2">
        {topDims.map(([key, d]) => (
          <div key={key} className="flex items-center gap-3">
            <span className="w-44 shrink-0 truncate text-[12px] text-[var(--text-secondary)]">
              {d.label} <span className="text-[var(--text-secondary)]">({Math.round(d.weight)}%)</span>
            </span>
            <XpProgress
              value={d.raw_score}
              tone={d.type === "custom_keyword" ? "purple" : "teal"}
              className="flex-1"
            />
            <span className="w-8 shrink-0 text-right text-[12px] tabular-nums text-[var(--text-secondary)]">
              {Math.round(d.raw_score)}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {chips.industries.map((ind) => (
          <XpBadge key={ind} color="#6b7280">
            {ind}
          </XpBadge>
        ))}
        {chips.buildsCount > 0 && (
          <XpBadge color="#7c3aed">
            {chips.buildsCount} build{chips.buildsCount === 1 ? "" : "s"}
          </XpBadge>
        )}
        {chips.location && chips.location !== "—" && <XpBadge color="#2563eb">{chips.location}</XpBadge>}
      </div>

      <div className="mt-4">
        {entry.reveal_state === "signal" && (
          <button type="button" onClick={onReveal} disabled={revealing} className="btn btn-primary">
            {revealing ? "Requesting…" : "Unlock profile →"}
          </button>
        )}
        {entry.reveal_state === "requested" && (
          <p className="text-[13px] text-[var(--text-secondary)]">⏳ Waiting for approval</p>
        )}
        {entry.reveal_state === "revealed" && (
          <button type="button" className="btn btn-success">
            Reach out →
          </button>
        )}
        {entry.reveal_state === "rejected" && (
          <p className="text-[13px] text-[var(--text-secondary)]">Declined by candidate</p>
        )}
      </div>
    </div>
  );
}

function ShortlistInner() {
  const params = useSearchParams();
  const briefId = params.get("brief") ?? "";
  const qc = useQueryClient();
  const [revealingId, setRevealingId] = useState<string | null>(null);
  // Tracks whether we're still inside the "first run" matching window via a
  // timer effect rather than comparing Date.now() during render, which would
  // make this component impure.
  const [stillMatching, setStillMatching] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setStillMatching(false), MATCHING_WINDOW_MS);
    return () => clearTimeout(t);
  }, []);

  const { data, isLoading, error } = useQuery({
    queryKey: ["hiring-shortlist", briefId],
    queryFn: () => getBriefShortlist(briefId),
    enabled: !!briefId,
    refetchInterval: POLL_MS,
  });

  const reveal = useMutation({
    mutationFn: (id: string) => requestReveal(id),
    onMutate: (id: string) => setRevealingId(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["hiring-shortlist", briefId] }),
    onSettled: () => setRevealingId(null),
  });

  if (!briefId) return <ErrorNote error={new Error("Missing ?brief= in the URL.")} />;
  if (error) return <ErrorNote error={error} />;

  const entries = data ?? [];

  if (isLoading || (entries.length === 0 && stillMatching)) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
        <div className="mb-4 animate-pulse text-[40px]">🔍</div>
        <h2 className="text-[16px] font-semibold text-[var(--foreground)]">
          Finding matched candidates…
        </h2>
        <p className="mt-1.5 text-[13px] text-[var(--text-secondary)]">
          This takes 2-3 minutes for the first run.
        </p>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-center text-[13px] text-[var(--text-secondary)]">
        No matches yet. Check back in a few minutes.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-[20px] font-bold text-[var(--foreground)]">Shortlist</h1>
        <p className="mt-1 text-[13px] text-[var(--text-secondary)]">
          {entries.length} matched candidate{entries.length === 1 ? "" : "s"}
        </p>
      </div>

      {entries.map((entry) => (
        <ShortlistCard
          key={entry.shortlist_id}
          entry={entry}
          onReveal={() => reveal.mutate(entry.shortlist_id)}
          revealing={revealingId === entry.shortlist_id}
        />
      ))}
    </div>
  );
}

export default function ShortlistPage() {
  return (
    <Suspense fallback={<Loading label="Loading shortlist…" />}>
      <ShortlistInner />
    </Suspense>
  );
}
