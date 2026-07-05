/** The single Job Search campaign — job search mode has no client picker, unlike ABM. */
export const JOB_SEARCH_CLIENT_ID = "df48ff35-29eb-4ddd-832f-811b185a7917";

/** Account status badge colour (Companies table + mind map legend). */
export const ACCOUNT_STATUS_COLORS: Record<string, string> = {
  DISCOVERED: "#6b7280",
  ENRICHED: "#2563eb",
  SIGNAL_DETECTED: "#7c3aed",
  DRAFTED: "#b45309",
  PENDING_APPROVAL: "#b45309",
  SENT: "#0f766e",
  REPLIED: "#15803d",
  NO_REPLY_T1: "#9ca3af",
  NO_REPLY_T2: "#9ca3af",
  NO_REPLY_T3: "#9ca3af",
  HOT: "#dc2626",
  COLD: "#6b7280",
  CONVERTED: "#15803d",
  UNSUBSCRIBED: "#dc2626",
  BOUNCED: "#dc2626",
};

/** D3 node fill per account state — matches the mind-map spec's flatter palette. */
export const STATE_NODE_FILL: Record<string, string> = {
  DISCOVERED: "#e5e7eb",
  ENRICHED: "#bfdbfe",
  SIGNAL_DETECTED: "#ddd6fe",
  DRAFTED: "#fef08a",
  PENDING_APPROVAL: "#fef08a",
  SENT: "#99f6e4",
  REPLIED: "#bbf7d0",
  NO_REPLY_T1: "#e5e7eb",
  NO_REPLY_T2: "#e5e7eb",
  NO_REPLY_T3: "#e5e7eb",
  HOT: "#fecaca",
  COLD: "#e5e7eb",
  CONVERTED: "#bbf7d0",
  UNSUBSCRIBED: "#fecaca",
  BOUNCED: "#fecaca",
};

export const SENTIMENT_META: Record<string, { emoji: string; label: string; color: string }> = {
  positive: { emoji: "\u{1F7E2}", label: "Interested", color: "#15803d" },
  interested: { emoji: "\u{1F7E2}", label: "Interested", color: "#15803d" },
  open: { emoji: "\u{1F7E1}", label: "Open", color: "#b45309" },
  neutral: { emoji: "⚪", label: "Neutral", color: "#6b7280" },
  negative: { emoji: "\u{1F534}", label: "Not now", color: "#dc2626" },
  not_now: { emoji: "\u{1F534}", label: "Not now", color: "#dc2626" },
  out_of_office: { emoji: "⚪", label: "Neutral", color: "#6b7280" },
};

export function sentimentMeta(sentiment: string | null | undefined) {
  return SENTIMENT_META[sentiment ?? ""] ?? SENTIMENT_META.neutral;
}

export function fmtDateTime(ts: string | null | undefined): string {
  if (!ts) return "—";
  const d = new Date(ts);
  if (isNaN(d.getTime())) return ts;
  return d.toLocaleString([], { month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export function fmtDate(ts: string | null | undefined): string {
  if (!ts) return "—";
  const d = new Date(ts);
  if (isNaN(d.getTime())) return ts;
  return d.toLocaleDateString([], { month: "short", day: "2-digit", year: "numeric" });
}

/** Human "3h ago" / "2d ago" style relative time. */
export function fmtRelative(ts: string | null | undefined): string {
  if (!ts) return "—";
  const d = new Date(ts).getTime();
  if (isNaN(d)) return ts as string;
  const diffMs = Date.now() - d;
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return fmtDate(ts);
}
