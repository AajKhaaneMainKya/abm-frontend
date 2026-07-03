"use client";

/**
 * Aha-moment "launching" page — shown immediately after a client is created.
 *
 * The instant a client is saved the backend publishes DISCOVER_ACCOUNTS, so Scout
 * is already running by the time the user lands here. We poll
 * GET /api/clients/{id}/activity every 3s and stream each new line into a
 * terminal-style feed with a typewriter effect. Once accounts start landing we
 * reveal cards and a "View full campaign" button.
 */
import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { getClient, getActivity, type ActivityItem, type ActivityAccount } from "@/lib/api";

const DARK = "#0f0f1a";
const TEAL = "#2dd4bf";
const GREEN = "#22c55e";
const YELLOW = "#eab308";

/* Terminal text for one activity item. */
function lineText(item: ActivityItem): string {
  if (item.type === "account") return `Scout found ${item.reasoning}`;
  return item.reasoning;
}

function itemKey(item: ActivityItem): string {
  return `${item.type}|${item.action}|${item.reasoning}|${item.created_at}`;
}

interface FeedLine {
  key: string;
  item: ActivityItem;
  text: string; // progressively revealed
  done: boolean;
}

/**
 * Streams activity items into a typewriter feed. New items (deduped) are queued
 * and typed out one at a time. Everything is driven by a single interval so all
 * setState happens inside a timer callback (no cascading-render lint issues).
 */
function useTypewriterFeed(items: ActivityItem[]): FeedLine[] {
  const [lines, setLines] = useState<FeedLine[]>([]);
  const seen = useRef<Set<string>>(new Set());
  const queue = useRef<ActivityItem[]>([]);
  const cursor = useRef<{ full: string; pos: number } | null>(null);

  // Enqueue any items we haven't seen yet (refs only — no setState here).
  useEffect(() => {
    for (const it of items) {
      const k = itemKey(it);
      if (!seen.current.has(k)) {
        seen.current.add(k);
        queue.current.push(it);
      }
    }
  }, [items]);

  // Single ticker drives the typewriter.
  useEffect(() => {
    const iv = setInterval(() => {
      if (cursor.current) {
        // Currently typing a line — reveal a few more characters.
        const c = cursor.current;
        c.pos = Math.min(c.full.length, c.pos + 2);
        const pos = c.pos;
        setLines((prev) => {
          if (prev.length === 0) return prev;
          const copy = prev.slice();
          const last = copy[copy.length - 1];
          copy[copy.length - 1] = { ...last, text: c.full.slice(0, pos), done: pos >= c.full.length };
          return copy;
        });
        if (c.pos >= c.full.length) cursor.current = null;
        return;
      }
      // Not typing — start the next queued line, if any.
      const next = queue.current.shift();
      if (!next) return;
      const full = lineText(next);
      cursor.current = { full, pos: 0 };
      setLines((prev) => [...prev, { key: itemKey(next), item: next, text: "", done: false }]);
    }, 28);
    return () => clearInterval(iv);
  }, []);

  return lines;
}

function Checkmark() {
  return (
    <svg viewBox="0 0 52 52" className="h-20 w-20" style={{ animation: "sk-pop 0.5s ease both" }}>
      <circle
        cx="26"
        cy="26"
        r="24"
        fill="none"
        stroke={GREEN}
        strokeWidth="3"
        style={{
          strokeDasharray: 151,
          strokeDashoffset: 151,
          animation: "sk-draw 0.6s ease forwards",
        }}
      />
      <path
        d="M15 27 l7 7 l15 -16"
        fill="none"
        stroke={GREEN}
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{
          strokeDasharray: 48,
          strokeDashoffset: 48,
          animation: "sk-draw 0.35s ease 0.5s forwards",
        }}
      />
    </svg>
  );
}

function FeedRow({ line }: { line: FeedLine }) {
  // Yellow ► while typing or for "…"-style in-progress lines; green when settled.
  const inProgress = !line.done || line.text.trim().endsWith("...") || line.text.trim().endsWith("…");
  const color = inProgress ? YELLOW : GREEN;
  return (
    <div className="animate-fade-up flex gap-2">
      <span style={{ color }}>►</span>
      <span className="text-neutral-200">
        {line.text}
        {!line.done && <span className="sk-caret" style={{ color: TEAL }}>▋</span>}
      </span>
    </div>
  );
}

function AccountCard({ a, index }: { a: ActivityAccount; index: number }) {
  const score = Math.round((a.icp_match_score ?? 0) * 100);
  return (
    <div
      className="animate-slide-up rounded-lg border border-white/10 bg-white/5 p-4"
      style={{ animationDelay: `${index * 120}ms` }}
    >
      <div className="text-[15px] font-semibold text-white">{a.company}</div>
      <div className="mt-0.5 text-[12px] text-neutral-400">{a.industry || "—"}</div>
      <div className="mt-3 flex items-center gap-2">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full" style={{ width: `${score}%`, background: TEAL }} />
        </div>
        <span className="text-[12px] font-semibold tabular-nums" style={{ color: TEAL }}>
          {score}%
        </span>
      </div>
    </div>
  );
}

export default function LaunchingPage() {
  const params = useParams<{ id: string }>();
  const clientId = params.id;

  const client = useQuery({
    queryKey: ["client", clientId],
    queryFn: () => getClient(clientId),
    enabled: !!clientId,
  });

  const activity = useQuery({
    queryKey: ["activity", clientId],
    queryFn: () => getActivity(clientId),
    enabled: !!clientId,
    refetchInterval: 3000,
  });

  const items = activity.data?.activity ?? [];
  const accountsDiscovered = activity.data?.accounts_discovered ?? 0;
  const accounts = activity.data?.accounts ?? [];
  const lines = useTypewriterFeed(items);

  // Keep the terminal scrolled to the newest line.
  const feedRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    feedRef.current?.scrollTo({ top: feedRef.current.scrollHeight, behavior: "smooth" });
  }, [lines]);

  const showButton = accountsDiscovered >= 1;
  const showCards = accountsDiscovered >= 3 && accounts.length > 0;

  return (
    <div
      className="flex min-h-screen w-full flex-col items-center px-4 py-10"
      style={{ background: DARK }}
    >
      <div className="flex w-full max-w-2xl flex-1 flex-col items-center">
        {/* Top — checkmark + headline */}
        <Checkmark />
        <h1 className="mt-5 text-[28px] font-bold text-white">Sahayak is on it.</h1>
        <div className="mt-1 text-[16px] font-medium" style={{ color: TEAL }}>
          {client.data?.name ?? ""}
        </div>

        {/* Middle — live activity terminal */}
        <div
          ref={feedRef}
          className="mt-8 h-[300px] w-full overflow-y-auto rounded-xl border border-white/10 bg-black/40 p-4 leading-relaxed"
          style={{ fontFamily: "'Courier New', monospace", fontSize: 13 }}
        >
          {lines.length === 0 ? (
            <div className="flex items-center gap-2 text-neutral-500">
              <span style={{ color: YELLOW }}>►</span>
              <span>
                Waking the agents
                <span className="sk-caret" style={{ color: TEAL }}>▋</span>
              </span>
            </div>
          ) : (
            <div className="space-y-1.5">
              {lines.map((l) => (
                <FeedRow key={l.key} line={l} />
              ))}
            </div>
          )}
        </div>

        {/* Bottom — first account cards */}
        {showCards && (
          <div className="mt-8 w-full">
            <div className="mb-3 text-[13px] font-medium text-neutral-400">First accounts found:</div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {accounts.slice(0, 3).map((a, i) => (
                <AccountCard key={`${a.company}-${i}`} a={a} index={i} />
              ))}
            </div>
          </div>
        )}

        {/* View full campaign — appears once discovery produces its first account */}
        {showButton && (
          <Link
            href={`/clients/${clientId}`}
            className="animate-fade-up mt-8 inline-flex items-center gap-2 rounded-md px-5 py-2.5 text-[14px] font-medium text-white transition-colors"
            style={{ background: "#0f766e" }}
          >
            View full campaign →
          </Link>
        )}
      </div>
    </div>
  );
}
