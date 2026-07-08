"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  listBriefs,
  getBriefShortlist,
  requestReveal,
  type HiringBrief,
  type ShortlistEntry,
  type ContextGraphExperience,
} from "@/lib/api";
import { XpBadge, XpProgress, Loading } from "@/components/xp";

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

function BriefTabs({
  briefs,
  selectedBriefId,
  onSelect,
}: {
  briefs: HiringBrief[];
  selectedBriefId: string | null;
  onSelect: (id: string) => void;
}) {
  if (briefs.length <= 1) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {briefs.map((b) => (
        <button
          key={b.id}
          type="button"
          onClick={() => onSelect(b.id)}
          className={`rounded-md border px-3.5 py-1.5 text-[13px] font-medium transition-colors ${
            selectedBriefId === b.id
              ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]"
              : "border-[var(--border)] bg-white text-[var(--foreground)]"
          }`}
        >
          {b.role_title}
          {!!b.match_count && (
            <span className="ml-1.5 rounded-full bg-[var(--accent)] px-1.5 py-0.5 text-[11px] font-semibold text-white">
              {b.match_count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

function CandidateCard({
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
    .filter(([, d]) => d.weighted_score > 0)
    .sort((a, b) => b[1].weighted_score - a[1].weighted_score)
    .slice(0, 4);

  return (
    <div className="card p-5">
      <div className="mb-3 flex items-start justify-between gap-3">
        {entry.anonymous ? (
          <div className="h-4 w-32 rounded bg-[var(--surface)]" />
        ) : (
          <span className="text-[16px] font-bold text-[var(--foreground)]">{entry.profile.name}</span>
        )}
        <div
          className={`min-w-[70px] shrink-0 rounded-lg border px-3.5 py-2 text-center ${
            entry.score >= 80
              ? "border-[var(--accent)]/30 bg-[var(--accent-soft)]"
              : "border-[var(--border)] bg-[var(--surface)]"
          }`}
        >
          <div
            className={`text-[22px] font-extrabold ${
              entry.score >= 80 ? "text-[var(--accent)]" : "text-[var(--foreground)]"
            }`}
          >
            {Math.round(entry.score)}
          </div>
          <div className="text-[10px] text-[var(--text-secondary)]">match</div>
        </div>
      </div>

      {entry.match_explanation && (
        <p className="mb-3 rounded-md bg-[var(--surface)] p-3 text-[13px] leading-relaxed text-[var(--foreground)]">
          {entry.match_explanation}
        </p>
      )}

      {topDims.length > 0 && (
        <div className="mb-3 space-y-1.5">
          {topDims.map(([key, d]) => (
            <div key={key} className="flex items-center gap-2">
              <span className="w-36 shrink-0 truncate text-[11px] text-[var(--text-secondary)]">
                {d.label} ({Math.round(d.weight)}%)
              </span>
              <XpProgress
                value={d.raw_score}
                tone={d.type === "custom_keyword" ? "purple" : "teal"}
                className="flex-1"
              />
              <span className="w-7 shrink-0 text-right text-[11px] font-semibold text-[var(--text-secondary)]">
                {Math.round(d.raw_score)}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="mb-3 flex flex-wrap gap-1.5">
        {chips.industries.map((ind) => (
          <XpBadge key={ind} color="#0369a1">
            {ind}
          </XpBadge>
        ))}
        {chips.buildsCount > 0 && (
          <XpBadge color="#7e22ce">
            {chips.buildsCount} build{chips.buildsCount === 1 ? "" : "s"}
          </XpBadge>
        )}
        {chips.location !== "—" && <XpBadge color="#6b7280">{chips.location}</XpBadge>}
      </div>

      <div className="flex justify-end">
        {entry.reveal_state === "signal" && (
          <button type="button" onClick={onReveal} disabled={revealing} className="btn btn-primary">
            {revealing ? "..." : "Unlock profile →"}
          </button>
        )}
        {entry.reveal_state === "requested" && (
          <span className="py-2 text-[13px] text-[var(--text-secondary)]">⏳ Waiting for candidate to approve</span>
        )}
        {entry.reveal_state === "revealed" && (
          <button type="button" className="btn btn-success">
            Reach out →
          </button>
        )}
        {entry.reveal_state === "rejected" && (
          <span className="py-2 text-[13px] text-[var(--text-secondary)]">Declined by candidate</span>
        )}
      </div>
    </div>
  );
}

function ShortlistInner() {
  const params = useSearchParams();
  const briefIdFromUrl = params.get("brief");

  const [briefs, setBriefs] = useState<HiringBrief[]>([]);
  const [briefsLoaded, setBriefsLoaded] = useState(false);
  const [selectedBriefId, setSelectedBriefId] = useState<string | null>(briefIdFromUrl);
  const [candidates, setCandidates] = useState<ShortlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState<string | null>(null);

  // Load all active briefs on mount, defaulting to the first one if none
  // was specified in the URL (e.g. via the Shortlist nav item directly).
  useEffect(() => {
    listBriefs()
      .then((data) => {
        const active = data.filter((b) => b.active && !b.filled);
        setBriefs(active);
        if (!briefIdFromUrl && active.length > 0) {
          setSelectedBriefId(active[0].id);
        }
      })
      .catch(() => {})
      .finally(() => setBriefsLoaded(true));
  }, [briefIdFromUrl]);

  // Load the shortlist whenever the selected brief changes.
  useEffect(() => {
    if (!selectedBriefId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    getBriefShortlist(selectedBriefId)
      .then((data) => setCandidates(data ?? []))
      .catch(() => setCandidates([]))
      .finally(() => setLoading(false));
  }, [selectedBriefId]);

  const handleReveal = async (shortlistId: string) => {
    setRequesting(shortlistId);
    try {
      await requestReveal(shortlistId);
      setCandidates((prev) =>
        prev.map((c) => (c.shortlist_id === shortlistId ? { ...c, reveal_state: "requested" } : c)),
      );
    } finally {
      setRequesting(null);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="text-[20px] font-bold text-[var(--foreground)]">Shortlist</h1>

      <BriefTabs briefs={briefs} selectedBriefId={selectedBriefId} onSelect={setSelectedBriefId} />

      {briefsLoaded && briefs.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-[var(--border)] p-12 text-center">
          <div className="text-[40px]">📋</div>
          <p className="text-[13px] text-[var(--text-secondary)]">No active briefs yet.</p>
          <Link href="/hiring/post" className="text-[14px] font-semibold text-[var(--accent)]">
            Post a brief →
          </Link>
        </div>
      )}

      {loading && <Loading label="Finding matched candidates…" />}

      {!loading &&
        candidates.map((c) => (
          <CandidateCard
            key={c.shortlist_id}
            entry={c}
            onReveal={() => handleReveal(c.shortlist_id)}
            revealing={requesting === c.shortlist_id}
          />
        ))}

      {!loading && candidates.length === 0 && selectedBriefId && briefs.length > 0 && (
        <div className="flex min-h-[30vh] items-center justify-center text-center text-[13px] text-[var(--text-secondary)]">
          No matches yet. Check back in a few minutes.
        </div>
      )}
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
