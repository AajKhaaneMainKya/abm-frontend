"use client";

/**
 * 3-step welcome wizard shown after first sign-up (Clerk signUpForceRedirectUrl on
 * the splash points here). Purely a welcome/guide flow — it collects no data
 * the backend needs yet; "Let's go" drops the user onto the dashboard.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";

export default function OnboardingPage() {
  const router = useRouter();
  const { user } = useUser();
  const [step, setStep] = useState(1);

  const firstName = user?.firstName || user?.fullName || "there";

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[var(--surface)] p-6">
      <div className="w-full max-w-lg overflow-hidden rounded-xl border border-[var(--border)] bg-white shadow-[0_10px_40px_rgba(0,0,0,0.08)]">
        <div className="flex items-center gap-2.5 border-b border-[var(--border)] px-5 py-4">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-[var(--accent)] text-[14px] font-bold text-white">
            S
          </span>
          <span className="text-[14px] font-semibold text-[var(--foreground)]">
            Sahayak Setup — Step {step} of 3
          </span>
        </div>

        <div className="p-6 text-[var(--foreground)]">
          {step === 1 && (
            <section>
              <h2 className="text-[18px] font-semibold">Welcome, {firstName}</h2>
              <p className="mt-1 text-[13px] text-[var(--text-secondary)]">
                You&apos;re building your outbound system.
              </p>
              <p className="mt-4 text-[13px]">
                Sahayak discovers accounts, writes personalised emails, and learns from
                every reply — autonomously. Let&apos;s get you set up.
              </p>
              <div className="mt-6 flex justify-end">
                <button type="button" className="btn btn-primary" onClick={() => setStep(2)}>
                  Continue →
                </button>
              </div>
            </section>
          )}

          {step === 2 && (
            <section>
              <h2 className="text-[18px] font-semibold">Set up your sender</h2>
              <p className="mt-1 text-[13px] text-[var(--text-secondary)]">Every email needs a home.</p>
              <ul className="mt-4 list-disc space-y-1 pl-5 text-[13px]">
                <li>Verify your sending domain on Resend (SPF + DKIM).</li>
                <li>Add your Resend API key to the client, or use the shared key.</li>
                <li>Pick a sender name + address on that domain.</li>
              </ul>
              <p className="mt-3 text-[12px] text-[var(--text-secondary)]">
                You can do this now or skip and use a test sender for the first run.
              </p>
              <div className="mt-6 flex justify-between">
                <button type="button" className="btn btn-secondary" onClick={() => setStep(1)}>
                  ← Back
                </button>
                <button type="button" className="btn btn-primary" onClick={() => setStep(3)}>
                  Continue →
                </button>
              </div>
            </section>
          )}

          {step === 3 && (
            <section>
              <h2 className="text-[18px] font-semibold">Create your first client</h2>
              <p className="mt-1 text-[13px] text-[var(--text-secondary)]">
                Head to New Client and define your ICP.
              </p>
              <p className="mt-4 text-[13px]">
                That&apos;s it — the Orchestrator takes over from there.
              </p>
              <div className="mt-6 flex justify-between">
                <button type="button" className="btn btn-secondary" onClick={() => setStep(2)}>
                  ← Back
                </button>
                <button
                  type="button"
                  className="btn btn-success"
                  onClick={() => router.push("/")}
                >
                  Let&apos;s go →
                </button>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
