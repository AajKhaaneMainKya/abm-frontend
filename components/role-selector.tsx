"use client";

/**
 * First-login role picker. Shown once — whoever renders this component
 * (see components/shell.tsx) already checked that the user has no
 * user_role in the DB yet. Selection is permanent — there is no "don't ask
 * again"; the point of moving this into the DB is that it's not a
 * preference anymore.
 *
 * Two steps:
 *   1. Role selection (all users) — saves immediately for abm/candidate.
 *   2. Company setup (hiring_manager only) — also creates an organisation.
 *
 * Calls onComplete() once the role (and org, if applicable) is saved; the
 * caller reloads so the shell re-fetches /api/users/me and renders the
 * right nav.
 */
import { useState } from "react";
import { setUserRole, createOrg, type UserRole } from "@/lib/api";

interface RoleSelectorProps {
  onComplete: () => void;
}

interface OrgFormState {
  name: string;
  domain: string;
  industry: string;
  stage: string;
}

const STAGES = ["Seed", "Series A", "Series B", "Growth"];

const ROLES: { value: UserRole; icon: string; title: string; desc: string }[] = [
  {
    value: "abm",
    icon: "🎯",
    title: "Running outbound campaigns",
    desc: "I want to find companies, enrich contacts, and send personalised outreach at scale.",
  },
  {
    value: "candidate",
    icon: "💼",
    title: "Looking for my next role",
    desc: "I want to find the right founders to reach out to and manage my job search pipeline.",
  },
  {
    value: "hiring_manager",
    icon: "🔍",
    title: "Hiring for my team",
    desc: "I want to post what I need and get matched with the right candidates.",
  },
];

function Logo() {
  return (
    <div className="mb-2 flex items-center gap-2.5">
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-[var(--accent)] text-[16px] font-extrabold text-white">
        S
      </span>
      <span className="text-[18px] font-bold text-[var(--foreground)]">Sahayak</span>
    </div>
  );
}

export default function RoleSelector({ onComplete }: RoleSelectorProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [org, setOrg] = useState<OrgFormState>({ name: "", domain: "", industry: "", stage: "" });

  const handleRoleSelect = (role: UserRole) => {
    if (loading) return;
    if (role === "hiring_manager") {
      setStep(2);
      return;
    }
    // ABM and candidate need nothing else — save immediately.
    void saveRole(role);
  };

  const saveRole = async (role: UserRole, companyData?: OrgFormState) => {
    setLoading(true);
    setError(null);
    try {
      await setUserRole(role, {
        company_name: companyData?.name,
        company_stage: companyData?.stage,
      });

      if (role === "hiring_manager" && companyData?.name.trim()) {
        await createOrg({
          name: companyData.name.trim(),
          domain: companyData.domain.trim() || undefined,
          stage: companyData.stage || undefined,
          industry: companyData.industry.trim() || undefined,
        });
      }

      onComplete();
    } catch {
      setError("Could not save — please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-5">
      <div className="w-full max-w-[520px] rounded-2xl bg-white p-10 shadow-[0_20px_60px_rgba(0,0,0,0.2)]">
        {step === 1 ? (
          <>
            <Logo />
            <h2 className="mb-1.5 text-[20px] font-bold text-[var(--foreground)]">
              What brings you here?
            </h2>
            <p className="mb-6 text-[14px] text-[var(--text-secondary)]">
              This helps us show you the right tools.
            </p>

            <div className="space-y-2.5">
              {ROLES.map((role) => (
                <button
                  key={role.value}
                  type="button"
                  disabled={loading}
                  onClick={() => handleRoleSelect(role.value)}
                  className="flex w-full items-start gap-3.5 rounded-lg border-2 border-[var(--border)] p-4 text-left transition-colors hover:border-[var(--accent)] hover:bg-[var(--accent-soft)] disabled:cursor-wait disabled:opacity-60"
                >
                  <span className="text-[24px]">{role.icon}</span>
                  <div>
                    <div className="mb-0.5 text-[14px] font-semibold text-[var(--foreground)]">
                      {role.title}
                    </div>
                    <div className="text-[13px] text-[var(--text-secondary)]">{role.desc}</div>
                  </div>
                </button>
              ))}
            </div>

            {error && <p className="mt-3 text-[13px] text-red-600">{error}</p>}

            <p className="mt-4 text-center text-[12px] text-[var(--text-secondary)]">
              You can contact support to change this later.
            </p>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="mb-4 text-[13px] text-[var(--text-secondary)] hover:text-[var(--foreground)]"
            >
              ← Back
            </button>

            <h2 className="mb-1.5 text-[20px] font-bold text-[var(--foreground)]">
              Tell us about your company
            </h2>
            <p className="mb-6 text-[14px] text-[var(--text-secondary)]">
              This helps candidates understand who they might be working with.
            </p>

            <div className="mb-4">
              <label className="text-[13px] font-semibold text-[var(--foreground)]">
                Company name *
              </label>
              <input
                className="input mt-1.5"
                placeholder="Acme Inc"
                value={org.name}
                onChange={(e) => setOrg((prev) => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div className="mb-4">
              <label className="text-[13px] font-semibold text-[var(--foreground)]">
                Company domain
              </label>
              <input
                className="input mt-1.5"
                placeholder="acme.com"
                value={org.domain}
                onChange={(e) => setOrg((prev) => ({ ...prev, domain: e.target.value }))}
              />
            </div>

            <div className="mb-4">
              <label className="text-[13px] font-semibold text-[var(--foreground)]">
                Industry
              </label>
              <input
                className="input mt-1.5"
                placeholder="B2B SaaS, Fintech..."
                value={org.industry}
                onChange={(e) => setOrg((prev) => ({ ...prev, industry: e.target.value }))}
              />
            </div>

            <div className="mb-6">
              <label className="mb-2 block text-[13px] font-semibold text-[var(--foreground)]">
                Stage
              </label>
              <div className="flex flex-wrap gap-2">
                {STAGES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setOrg((prev) => ({ ...prev, stage: s }))}
                    className={`rounded-md border px-3.5 py-1.5 text-[13px] font-medium transition-colors ${
                      org.stage === s
                        ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]"
                        : "border-[var(--border)] bg-white text-[var(--foreground)]"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {error && <p className="mb-3 text-[13px] text-red-600">{error}</p>}

            <button
              type="button"
              onClick={() => saveRole("hiring_manager", org)}
              disabled={loading || !org.name.trim()}
              className="btn btn-primary w-full"
            >
              {loading ? "Setting up…" : "Get started →"}
            </button>

            <div className="mt-4 flex justify-center gap-1.5">
              <div className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
              <div className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
            </div>
            <p className="mt-2 text-center text-[12px] text-[var(--text-secondary)]">
              Step 2 of 2
            </p>
          </>
        )}
      </div>
    </div>
  );
}
