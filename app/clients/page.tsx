"use client";

import Link from "next/link";
import { Building2, UserPlus, ArrowRight } from "lucide-react";
import { useClientList } from "@/components/client-select";
import { Loading, ErrorNote, XpBadge } from "@/components/xp";

export default function ClientsPage() {
  const { data: clients, isLoading, error } = useClientList();

  if (isLoading) return <Loading label="Loading clients…" />;
  if (error) return <ErrorNote error={error} />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[13px] text-[var(--text-secondary)]">
          {clients?.length ?? 0} client{(clients?.length ?? 0) === 1 ? "" : "s"}
        </p>
        <Link href="/clients/new" className="btn btn-primary">
          <UserPlus size={15} /> New Client
        </Link>
      </div>

      {!clients || clients.length === 0 ? (
        <div className="mx-auto mt-10 flex max-w-md flex-col items-center gap-4 rounded-lg border border-[var(--border)] bg-white p-8 text-center shadow-sm">
          <span className="grid h-12 w-12 place-items-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent)]">
            <Building2 size={24} />
          </span>
          <p className="text-[14px] text-[var(--text-secondary)]">
            No clients yet. Create your first client — the company you&apos;re running outbound for.
          </p>
          <Link href="/clients/new" className="btn btn-primary">
            <UserPlus size={15} /> Create a client
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {clients.map((c) => (
            <Link
              key={c.id}
              href={`/clients/${c.id}`}
              className="card group flex flex-col gap-3 p-4 transition-shadow hover:shadow-md"
            >
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[var(--accent-soft)] text-[var(--accent)]">
                  <Building2 size={18} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[14px] font-semibold text-[var(--foreground)]">
                    {c.name}
                  </div>
                </div>
                <XpBadge color={c.active ? "#15803d" : "#b45309"}>
                  {c.active ? "Active" : "Paused"}
                </XpBadge>
              </div>
              <p className="line-clamp-2 min-h-[2.5rem] text-[13px] text-[var(--text-secondary)]">
                {c.campaign_goal || "No campaign goal set."}
              </p>
              <div className="flex items-center justify-between text-[12px] text-[var(--text-secondary)]">
                <span>
                  {c.daily_send_cap != null ? `${c.daily_send_cap}/day cap` : ""}
                </span>
                <span className="inline-flex items-center gap-1 font-medium text-[var(--accent)] opacity-0 transition-opacity group-hover:opacity-100">
                  Open <ArrowRight size={13} />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
