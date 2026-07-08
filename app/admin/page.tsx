"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink } from "lucide-react";
import { getPlatformOverview, getWaitlist, type WaitlistEntry } from "@/lib/api";
import { StatCard, XpBadge, XpTabs, XpTabPanel, Loading, ErrorNote } from "@/components/xp";
import { fmtDate, fmtRelative } from "@/lib/job-search";

const ROLE_BADGE_COLOR: Record<string, string> = {
  abm: "#2563eb",
  candidate: "#7c3aed",
  hiring_manager: "#15803d",
};

const CLIENT_TYPE_LABEL: Record<string, string> = {
  abm: "ABM",
  job_search: "Job Search",
};

const PLAN_ROWS: { key: string; label: string; color: string }[] = [
  { key: "trial", label: "Trial", color: "#b45309" },
  { key: "pro", label: "Pro", color: "#0f766e" },
  { key: "free", label: "Free", color: "#6b7280" },
  { key: "cancelled", label: "Cancelled", color: "#b91c1c" },
];

const ADMIN_TABS = [
  { value: "overview", label: "Overview" },
  { value: "users", label: "Users" },
  { value: "applications", label: "Applications" },
  { value: "waitlist", label: "Waitlist" },
];

type WaitlistFilter = "all" | "hiring_manager" | "candidate";

function normalizeLinkedinUrl(url: string): string {
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

function exportWaitlistCSV(entries: WaitlistEntry[]) {
  const headers = ["Name", "Email", "Type", "Company", "Role", "What Built", "Signed Up"];
  const rows = entries.map((e) => [
    e.name || "",
    e.email,
    e.type,
    e.company || "",
    e.role || "",
    (e.what_built || "").replace(/,/g, ";"),
    new Date(e.created_at).toLocaleDateString(),
  ]);
  const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `sahayak-waitlist-${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function WaitlistTab() {
  const [filter, setFilter] = useState<WaitlistFilter>("all");
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-waitlist"],
    queryFn: getWaitlist,
    retry: false,
  });

  const filtered = useMemo(() => {
    const entries = data?.entries ?? [];
    if (filter === "all") return entries;
    return entries.filter((e) => e.type === filter);
  }, [data, filter]);

  if (isLoading) return <Loading label="Loading waitlist…" />;
  if (error) return <ErrorNote error={error} />;
  if (!data) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-3">
          <XpBadge color="#2563eb">🔍 Hiring Managers: {data.hiring_managers}</XpBadge>
          <XpBadge color="#7c3aed">💼 Builders: {data.candidates}</XpBadge>
        </div>
        <button
          type="button"
          onClick={() => exportWaitlistCSV(data.entries)}
          className="btn btn-secondary"
        >
          Export CSV
        </button>
      </div>

      <select
        value={filter}
        onChange={(e) => setFilter(e.target.value as WaitlistFilter)}
        className="select max-w-xs"
      >
        <option value="all">All</option>
        <option value="hiring_manager">Hiring Managers</option>
        <option value="candidate">Builders</option>
      </select>

      <div className="card-flush">
        <div className="overflow-x-auto">
          <table className="sk-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Type</th>
                <th>Company/Built</th>
                <th>Signed up</th>
                <th>Links</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e) => (
                <tr key={e.id}>
                  <td>{e.name ?? "—"}</td>
                  <td>{e.email}</td>
                  <td>
                    {e.type === "hiring_manager" ? (
                      <XpBadge color="#2563eb">🔍 Hiring</XpBadge>
                    ) : (
                      <XpBadge color="#7c3aed">💼 Builder</XpBadge>
                    )}
                  </td>
                  <td className="text-[var(--text-secondary)]">
                    {e.type === "hiring_manager"
                      ? [e.company, e.role].filter(Boolean).join(" — ") || "—"
                      : e.what_built
                        ? e.what_built.slice(0, 60) + (e.what_built.length > 60 ? "…" : "")
                        : "—"}
                  </td>
                  <td className="whitespace-nowrap text-[var(--text-secondary)]">
                    {fmtRelative(e.created_at)}
                  </td>
                  <td>
                    {e.linkedin_url && (
                      <a
                        href={normalizeLinkedinUrl(e.linkedin_url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="LinkedIn"
                        className="text-[var(--text-secondary)] hover:text-[var(--accent)]"
                      >
                        <ExternalLink size={14} />
                      </a>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center text-[var(--text-secondary)]">
                    No waitlist entries.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function AdminConsolePage() {
  const [tab, setTab] = useState<"overview" | "users" | "applications" | "waitlist">("overview");
  const { data, isLoading, error, dataUpdatedAt } = useQuery({
    queryKey: ["admin-platform"],
    queryFn: getPlatformOverview,
    retry: false,
  });

  if (isLoading) return <Loading label="Loading admin console…" />;

  if (error) {
    const status = (error as { response?: { status?: number } })?.response?.status;
    if (status === 403) {
      return (
        <div className="flex min-h-[50vh] items-center justify-center text-[14px] text-[var(--text-secondary)]">
          Access denied.
        </div>
      );
    }
    return <ErrorNote error={error} />;
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-[20px] font-bold text-[var(--foreground)]">Admin Console</h1>
        <p className="text-[12px] text-[var(--text-secondary)]">
          Last updated {new Date(dataUpdatedAt).toLocaleString([], { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>

      <XpTabs tabs={ADMIN_TABS} value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
        <XpTabPanel value="overview">
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <StatCard label="Total Users" value={data.total_users} accent="#0f766e" />
              <StatCard label="Emails Sent Today" value={data.emails_sent_today} accent="#2563eb" />
              <StatCard
                label="Today's API Cost"
                value={`$${data.today_cost_usd.toFixed(2)}`}
                accent="#b45309"
              />
              <StatCard label="Matches Made" value={data.matches_made} accent="#7c3aed" />
            </div>

            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <StatCard label="Resumes Uploaded" value={data.resumes_uploaded} accent="#0f766e" />
              <StatCard label="Verified Hiring Managers" value={data.verified_hiring_managers} accent="#15803d" />
              <StatCard label="New Users (7 days)" value={data.new_users_7d} accent="#2563eb" />
              <StatCard label="Matched Candidates" value={data.matched_candidates} accent="#7c3aed" />
            </div>

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <div className="card-flush">
                <div className="card-header">Clients by type</div>
                <div className="space-y-2 p-4">
                  {data.clients.length === 0 && (
                    <p className="text-[13px] text-[var(--text-secondary)]">No clients yet.</p>
                  )}
                  {data.clients.map((c) => (
                    <div key={c.client_type} className="flex items-center justify-between text-[13px]">
                      <span className="text-[var(--foreground)]">
                        {CLIENT_TYPE_LABEL[c.client_type] ?? c.client_type}
                      </span>
                      <span className="text-[var(--text-secondary)]">
                        {c.active_count} active / {c.count} total
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card-flush">
                <div className="card-header">Plan Breakdown</div>
                <div className="space-y-2 p-4 text-[13px]">
                  {PLAN_ROWS.map(({ key, label, color }) => (
                    <div key={key} className="flex items-center justify-between">
                      <XpBadge color={color}>{label}</XpBadge>
                      <span className="text-[var(--text-secondary)]">{data.plans[key] ?? 0} users</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </XpTabPanel>

        <XpTabPanel value="users">
          <div className="card-flush">
            <div className="card-header">Users</div>
            <div className="overflow-x-auto">
              <table className="sk-table">
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Name</th>
                    <th>Role</th>
                    <th>Plan</th>
                    <th>Clients</th>
                    <th>Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {data.all_users.map((u) => (
                    <tr key={u.id}>
                      <td>{u.email ?? "—"}</td>
                      <td>{u.name ?? "—"}</td>
                      <td>
                        {u.user_role ? (
                          <XpBadge color={ROLE_BADGE_COLOR[u.user_role] ?? "#6b7280"}>
                            {u.user_role}
                          </XpBadge>
                        ) : (
                          <XpBadge color="#6b7280">No role</XpBadge>
                        )}
                      </td>
                      <td className="text-[var(--text-secondary)]">{u.plan ?? "—"}</td>
                      <td>{u.client_count}</td>
                      <td className="whitespace-nowrap text-[var(--text-secondary)]">
                        {fmtDate(u.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </XpTabPanel>

        <XpTabPanel value="applications">
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <div className="card-flush">
              <div className="card-header">Hiring briefs</div>
              <div className="space-y-2 p-4 text-[13px]">
                <div className="flex items-center justify-between">
                  <span className="text-[var(--foreground)]">Active</span>
                  <span className="text-[var(--text-secondary)]">{data.hiring_briefs.active ?? 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[var(--foreground)]">Filled</span>
                  <span className="text-[var(--text-secondary)]">{data.hiring_briefs.filled ?? 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[var(--foreground)]">Total</span>
                  <span className="text-[var(--text-secondary)]">{data.hiring_briefs.total ?? 0}</span>
                </div>
              </div>
            </div>

            <div className="card-flush">
              <div className="card-header">Marketplace Health</div>
              <div className="space-y-2 p-4 text-[13px]">
                <div className="flex items-center justify-between">
                  <span className="text-[var(--foreground)]">Briefs posted</span>
                  <span className="text-[var(--text-secondary)]">{data.hiring_briefs.total ?? 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[var(--foreground)]">Briefs with matches</span>
                  <span className="text-[var(--text-secondary)]">{data.briefs_with_matches}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[var(--foreground)]">Total matches</span>
                  <span className="text-[var(--text-secondary)]">{data.matches_made}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[var(--foreground)]">Profile unlocks</span>
                  <span className="text-[var(--text-secondary)]">{data.profile_unlocks}</span>
                </div>
              </div>
            </div>
          </div>
        </XpTabPanel>

        <XpTabPanel value="waitlist">
          <WaitlistTab />
        </XpTabPanel>
      </XpTabs>
    </div>
  );
}
