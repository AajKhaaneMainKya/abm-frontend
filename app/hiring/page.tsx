"use client";

/**
 * Hiring manager dashboard placeholder. The marketplace API (hiring_briefs /
 * shortlists / notifications) already exists (api/main.py) — this page is
 * just the nav landing spot until the brief-creation + shortlist UI is built.
 */
export default function HiringDashboardPage() {
  return (
    <div className="flex h-full min-h-[60vh] flex-col items-center justify-center text-center">
      <h1 className="text-[18px] font-semibold text-[var(--foreground)]">
        Hiring dashboard — coming soon
      </h1>
      <p className="mt-2 max-w-sm text-[13px] text-[var(--text-secondary)]">
        Brief creation and candidate shortlists will show up here next.
      </p>
    </div>
  );
}
