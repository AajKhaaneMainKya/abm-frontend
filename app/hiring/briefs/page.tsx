"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FileText, ArrowRight } from "lucide-react";
import { listBriefs, markBriefFilled } from "@/lib/api";
import { XpBadge, Loading, ErrorNote } from "@/components/xp";
import { fmtDate } from "@/lib/job-search";

export default function BriefsPage() {
  const qc = useQueryClient();
  const { data, isLoading, error } = useQuery({ queryKey: ["hiring-briefs"], queryFn: listBriefs });

  const markFilled = useMutation({
    mutationFn: (id: string) => markBriefFilled(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["hiring-briefs"] }),
  });

  if (isLoading) return <Loading label="Loading briefs…" />;
  if (error) return <ErrorNote error={error} />;

  const briefs = data ?? [];

  if (briefs.length === 0) {
    return (
      <div className="mx-auto mt-10 flex max-w-md flex-col items-center gap-4 rounded-lg border border-[var(--border)] bg-white p-8 text-center shadow-sm">
        <span className="grid h-12 w-12 place-items-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent)]">
          <FileText size={24} />
        </span>
        <p className="text-[14px] text-[var(--text-secondary)]">
          No briefs yet. Post your first brief to start finding candidates.
        </p>
        <Link href="/hiring/post" className="btn btn-primary">
          Post a Brief <ArrowRight size={15} />
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[13px] text-[var(--text-secondary)]">
          {briefs.length} brief{briefs.length === 1 ? "" : "s"}
        </p>
        <Link href="/hiring/post" className="btn btn-primary">
          Post a Brief <ArrowRight size={15} />
        </Link>
      </div>

      <div className="overflow-hidden rounded-lg border border-[var(--border)]">
        <div className="overflow-x-auto">
          <table className="sk-table">
            <thead>
              <tr>
                <th>Role</th>
                <th>Company</th>
                <th>Stage</th>
                <th>Location</th>
                <th>Matches</th>
                <th>Posted</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {briefs.map((b) => (
                <tr key={b.id}>
                  <td className="font-semibold text-[var(--foreground)]">{b.role_title}</td>
                  <td>{b.company_name}</td>
                  <td className="text-[var(--text-secondary)]">{b.company_stage ?? "—"}</td>
                  <td className="text-[var(--text-secondary)]">{b.location ?? "—"}</td>
                  <td>{b.match_count ?? 0}</td>
                  <td className="whitespace-nowrap text-[var(--text-secondary)]">
                    {fmtDate(b.created_at)}
                  </td>
                  <td>
                    <XpBadge color={b.filled ? "#6b7280" : b.active ? "#15803d" : "#6b7280"}>
                      {b.filled ? "Filled" : b.active ? "Active" : "Inactive"}
                    </XpBadge>
                  </td>
                  <td className="whitespace-nowrap">
                    <Link
                      href={`/hiring/shortlist?brief=${b.id}`}
                      className="mr-3 text-[12px] font-semibold text-[var(--accent)]"
                    >
                      View shortlist →
                    </Link>
                    {!b.filled && (
                      <button
                        type="button"
                        onClick={() => markFilled.mutate(b.id)}
                        disabled={markFilled.isPending}
                        className="text-[12px] font-medium text-[var(--text-secondary)] hover:text-[var(--foreground)]"
                      >
                        Mark filled
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
