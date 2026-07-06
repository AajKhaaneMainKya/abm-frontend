"use client";

import { useQuery } from "@tanstack/react-query";
import { getPlatformOverview } from "@/lib/api";
import { StatCard, XpBadge, Loading, ErrorNote } from "@/components/xp";
import { fmtDate } from "@/lib/job-search";

const ROLE_BADGE_COLOR: Record<string, string> = {
  abm: "#2563eb",
  candidate: "#7c3aed",
  hiring_manager: "#15803d",
};

const CLIENT_TYPE_LABEL: Record<string, string> = {
  abm: "ABM",
  job_search: "Job Search",
};

export default function AdminConsolePage() {
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
      </div>
    </div>
  );
}
