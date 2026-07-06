"use client";

/**
 * First-login role picker. Shown once — whoever renders this component
 * (see components/shell.tsx) already checked that the user has no
 * user_role in the DB yet. Selection is permanent: it saves via
 * POST /api/users/role and reloads so the shell re-fetches /api/users/me
 * and renders the right nav. There is no "don't ask again" — the point
 * of moving this into the DB is that it's not a preference anymore.
 */
import { useState } from "react";
import { Target, Briefcase, Users, type LucideIcon } from "lucide-react";
import { setUserRole, type UserRole } from "@/lib/api";

const OPTIONS: {
  value: UserRole;
  icon: LucideIcon;
  title: string;
  desc: string;
}[] = [
  {
    value: "abm",
    icon: Target,
    title: "Running outbound campaigns",
    desc: "Find companies, enrich contacts, send personalised outreach.",
  },
  {
    value: "candidate",
    icon: Briefcase,
    title: "Looking for my next role",
    desc: "Target founders, send warm outreach, track replies.",
  },
  {
    value: "hiring_manager",
    icon: Users,
    title: "Hiring for my team",
    desc: "Post a brief, get a matched shortlist, request intros.",
  },
];

export default function RoleSelector() {
  const [selected, setSelected] = useState<UserRole | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const confirm = async () => {
    if (!selected || saving) return;
    setSaving(true);
    setError(null);
    try {
      await setUserRole(selected);
      window.location.reload();
    } catch {
      setError("Could not save your selection — please try again.");
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-8 shadow-[0_20px_60px_rgba(0,0,0,0.2)]">
        <div className="mb-2 flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-[var(--accent)] text-[15px] font-bold text-white">
            S
          </span>
          <span className="text-[16px] font-semibold text-[var(--foreground)]">Sahayak</span>
        </div>

        <p className="mb-7 text-[14px] text-[var(--text-secondary)]">
          What brings you to Sahayak?
        </p>

        <div className="space-y-3">
          {OPTIONS.map(({ value, icon: Icon, title, desc }) => {
            const isSelected = selected === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setSelected(value)}
                className={`flex w-full items-start gap-3.5 rounded-lg border-2 p-4 text-left transition-colors ${
                  isSelected
                    ? "border-[#0f766e] bg-[#f0fdfa]"
                    : "border-[var(--border)] bg-white hover:border-[#99f6e4]"
                }`}
              >
                <Icon size={22} className="mt-0.5 shrink-0 text-[#0f766e]" strokeWidth={2} />
                <div>
                  <div className="text-[14px] font-semibold text-[var(--foreground)]">
                    {title}
                  </div>
                  <div className="mt-0.5 text-[13px] text-[var(--text-secondary)]">{desc}</div>
                </div>
              </button>
            );
          })}
        </div>

        {error && <p className="mt-3 text-[13px] text-red-600">{error}</p>}

        <button
          type="button"
          onClick={confirm}
          disabled={!selected || saving}
          className="btn btn-primary mt-6 w-full"
        >
          {saving ? "Saving…" : "Continue →"}
        </button>

        <p className="mt-4 text-center text-[12px] text-[var(--text-secondary)]">
          Your role is permanent. You can contact support to change this later.
        </p>
      </div>
    </div>
  );
}
