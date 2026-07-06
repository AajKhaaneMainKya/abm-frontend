"use client";

/**
 * First-login role picker. Shown once — whoever renders this component
 * (see components/shell.tsx) already checked that the user has no
 * user_role in the DB yet. The role itself can be changed later from the
 * sidebar switcher, but that's a settings action, not this first-run flow.
 *
 * Three steps:
 *   1. Role selection (all users) — saves immediately for abm/candidate.
 *   2. Work email + OTP verification (hiring_manager only) — proves
 *      control of a company inbox before the domain is trusted.
 *   3. Company details (hiring_manager only, after verification, skippable)
 *      — the organisation itself was already created during step 2's OTP
 *      confirmation; this updates users.company_name/company_stage plus
 *      the organisation's name/industry/stage to match.
 *
 * SECURITY (frontend): the OTP is never persisted anywhere but this
 * component's own transient state, is cleared immediately after every
 * submit attempt (success or failure), is never passed through a URL or
 * localStorage, and is never passed to console.log/console.error — only
 * error objects (never the code itself) are logged.
 */
import { useEffect, useRef, useState } from "react";
import { setUserRole, sendOtp, confirmOtp, updateMyOrg, type UserRole } from "@/lib/api";

type Step = 1 | 2 | 3;

interface OrgFormState {
  name: string;
  domain: string;
  industry: string;
  stage: string;
}

const STAGES = ["Seed", "Series A", "Series B", "Growth"];
const EMPTY_OTP = ["", "", "", "", "", ""];

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

function ProgressDots({ step }: { step: 2 | 3 }) {
  return (
    <div className="mt-5 flex flex-col items-center gap-2">
      <div className="flex gap-1.5">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className={`h-1.5 w-1.5 rounded-full ${
              i <= step ? "bg-[var(--accent)]" : "bg-[var(--border)]"
            }`}
          />
        ))}
      </div>
      <p className="text-[12px] text-[var(--text-secondary)]">Step {step} of 3</p>
    </div>
  );
}

/** Extracts a friendly message from an axios error without ever touching
 * an OTP value — these only ever see server-supplied error text. */
function apiErrorDetail(e: unknown): string | undefined {
  const err = e as { response?: { data?: { detail?: string } } };
  return err.response?.data?.detail;
}

function apiErrorStatus(e: unknown): number | undefined {
  const err = e as { response?: { status?: number } };
  return err.response?.status;
}

export default function RoleSelector() {
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 2 — work email + OTP
  const [workEmail, setWorkEmail] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpInputs, setOtpInputs] = useState<string[]>(EMPTY_OTP);
  const [otpError, setOtpError] = useState("");
  const [sendError, setSendError] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verifiedDomain, setVerifiedDomain] = useState("");
  const [justVerified, setJustVerified] = useState(false);
  const otpBoxRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Step 3 — company details
  const [org, setOrg] = useState<OrgFormState>({ name: "", domain: "", industry: "", stage: "" });

  useEffect(() => {
    if (otpSent && !justVerified) otpBoxRefs.current[0]?.focus();
  }, [otpSent, justVerified]);

  const handleRoleSelect = (role: UserRole) => {
    if (loading) return;
    if (role === "hiring_manager") {
      setStep(2);
      return;
    }
    void saveSimpleRole(role);
  };

  // ABM / candidate — no verification needed, save and go straight in.
  const saveSimpleRole = async (role: UserRole) => {
    setLoading(true);
    setError(null);
    try {
      await setUserRole(role);
      window.location.assign(role === "candidate" ? "/job-search" : "/");
    } catch {
      setError("Could not save — please try again.");
      setLoading(false);
    }
  };

  const handleSendOtp = async () => {
    if (sendingOtp || !workEmail.includes("@")) return;
    setSendingOtp(true);
    setSendError("");
    try {
      // Company name isn't collected until step 3 — the verification email
      // just falls back to "your company" in that case (utils/otp.py).
      await sendOtp(workEmail, "");
      setOtpSent(true);
    } catch (e) {
      setSendError(
        apiErrorStatus(e) === 429
          ? "Too many attempts. Try again in 15 minutes."
          : apiErrorDetail(e) || "Could not send email. Check the address.",
      );
    } finally {
      setSendingOtp(false);
    }
  };

  const handleResend = () => {
    setOtpInputs(EMPTY_OTP);
    setOtpSent(false);
    setOtpError("");
    setSendError("");
  };

  const handleVerifyOtp = async () => {
    const code = otpInputs.join("");
    if (verifying || code.length < 6) return;
    setVerifying(true);
    setOtpError("");
    try {
      const result = await confirmOtp(code, "", "", "");
      setOtpInputs(EMPTY_OTP); // never keep the code in state longer than needed
      setVerifiedDomain(result.domain);
      setOrg((prev) => ({ ...prev, domain: result.domain }));
      setJustVerified(true);
      setTimeout(() => setStep(3), 1000);
    } catch (e) {
      setOtpInputs(EMPTY_OTP);
      setOtpError(apiErrorDetail(e) || "Verification failed. Please try again.");
    } finally {
      setVerifying(false);
    }
  };

  const setOtpDigit = (index: number, raw: string) => {
    const digit = raw.replace(/\D/g, "").slice(-1);
    const next = [...otpInputs];
    next[index] = digit;
    setOtpInputs(next);
    setOtpError("");
    if (digit && index < 5) otpBoxRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpInputs[index] && index > 0) {
      otpBoxRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const digits = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6).split("");
    if (digits.length === 0) return;
    const next = [...EMPTY_OTP];
    digits.forEach((d, i) => {
      next[i] = d;
    });
    setOtpInputs(next);
    setOtpError("");
    otpBoxRefs.current[Math.min(digits.length, 6) - 1]?.focus();
  };

  const finishCompanyDetails = async () => {
    if (loading || !org.name.trim()) return;
    setLoading(true);
    setError(null);
    try {
      // Org was already created (and domain-verified) during OTP confirm —
      // this updates the user's own company_name/company_stage.
      await setUserRole("hiring_manager", {
        company_name: org.name.trim(),
        company_stage: org.stage,
      });

      try {
        await updateMyOrg({
          name: org.name,
          industry: org.industry,
          stage: org.stage,
        });
      } catch (e) {
        // Non-critical — org name/industry/stage update failed.
        // Role and verification already saved — continue.
        console.error("Org update failed (non-critical):", e);
      }

      window.location.assign("/hiring");
    } catch {
      setError("Could not save — please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-5">
      <div className="w-full max-w-[520px] rounded-2xl bg-white p-10 shadow-[0_20px_60px_rgba(0,0,0,0.2)]">
        {step === 1 && (
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
              You can switch modes anytime from the sidebar.
            </p>
          </>
        )}

        {step === 2 && (
          <>
            {!otpSent ? (
              <>
                <h2 className="mb-1.5 text-[20px] font-bold text-[var(--foreground)]">
                  Verify your work email
                </h2>
                <p className="mb-6 text-[14px] text-[var(--text-secondary)]">
                  We&apos;ll send a 6-digit code to confirm you&apos;re associated with the
                  company you&apos;re setting up.
                </p>

                <input
                  type="email"
                  className="input"
                  placeholder="you@yourcompany.com"
                  value={workEmail}
                  onChange={(e) => {
                    setWorkEmail(e.target.value);
                    setSendError("");
                  }}
                />

                <p className="mt-2 text-[12px] text-[var(--text-secondary)]">
                  ⚠️ Personal emails (Gmail, Yahoo, Outlook, etc.) are not accepted.
                </p>

                {sendError && <p className="mt-2 text-[13px] text-red-600">{sendError}</p>}

                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={sendingOtp || !workEmail.includes("@")}
                  className="btn btn-primary mt-4 w-full"
                >
                  {sendingOtp ? "Sending..." : "Send verification code →"}
                </button>
              </>
            ) : justVerified ? (
              <div className="py-6 text-center">
                <p className="text-[16px] font-semibold text-[var(--success)]">
                  ✓ {verifiedDomain} verified
                </p>
              </div>
            ) : (
              <>
                <p className="text-[14px] font-semibold text-[var(--success)]">
                  ✓ Code sent to {workEmail}
                </p>
                <p className="mb-6 mt-1 text-[13px] text-[var(--text-secondary)]">
                  Check your inbox and spam folder.
                </p>

                <div className="flex justify-center gap-2">
                  {otpInputs.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => {
                        otpBoxRefs.current[i] = el;
                      }}
                      value={digit}
                      disabled={verifying}
                      onChange={(e) => setOtpDigit(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      onPaste={handleOtpPaste}
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={1}
                      aria-label={`Digit ${i + 1}`}
                      className="h-[52px] w-[44px] rounded-lg border-2 border-[var(--border)] text-center font-mono text-[22px] font-bold text-[var(--foreground)] outline-none transition-colors focus:border-[var(--accent)] disabled:opacity-60"
                    />
                  ))}
                </div>

                {otpError && (
                  <p className="mt-3 text-center text-[13px] text-red-600">{otpError}</p>
                )}

                <button
                  type="button"
                  onClick={handleVerifyOtp}
                  disabled={verifying || otpInputs.join("").length < 6}
                  className="btn btn-primary mt-5 w-full"
                >
                  {verifying ? "Verifying..." : "Verify code →"}
                </button>

                <button
                  type="button"
                  onClick={handleResend}
                  className="mt-3 w-full text-center text-[12px] text-[var(--text-secondary)] hover:text-[var(--foreground)]"
                >
                  Didn&apos;t receive it? Resend code
                </button>
              </>
            )}

            <ProgressDots step={2} />
          </>
        )}

        {step === 3 && (
          <>
            <h2 className="mb-1.5 text-[20px] font-bold text-[var(--foreground)]">
              Tell us about your company
            </h2>
            <p className="mb-4 text-[14px] text-[var(--text-secondary)]">
              This helps candidates understand who they might be working with.
            </p>

            <div className="mb-6 inline-flex items-center gap-1.5 rounded-full bg-[var(--success-soft)] px-3 py-1 text-[12px] font-semibold text-[var(--success)]">
              ✓ {workEmail} verified
            </div>

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
              <label className="text-[13px] font-semibold text-[var(--foreground)]">Domain</label>
              <input
                className="input mt-1.5 cursor-not-allowed bg-[var(--surface)] text-[var(--text-secondary)]"
                value={org.domain}
                readOnly
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
              onClick={finishCompanyDetails}
              disabled={loading || !org.name.trim()}
              className="btn btn-primary w-full"
            >
              {loading ? "Saving..." : "Get started →"}
            </button>

            <button
              type="button"
              onClick={() => window.location.assign("/hiring")}
              disabled={loading}
              className="mt-2 w-full text-center text-[13px] text-[var(--text-secondary)] hover:text-[var(--foreground)]"
            >
              Skip for now →
            </button>

            <ProgressDots step={3} />
          </>
        )}
      </div>
    </div>
  );
}
