"use client";

/**
 * 3-step XP wizard shown after first sign-up (Clerk signUpForceRedirectUrl on
 * the splash points here). Purely a welcome/guide flow — it collects no data
 * the backend needs yet; "Let's go" drops the user onto the desktop where the
 * client-creation app lives.
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
    <div
      className="flex min-h-screen w-full items-center justify-center p-6"
      style={{ background: "#008080" }}
    >
      <div className="xp-os-window w-full max-w-lg">
        <div
          className="xp-os-window__titlebar flex items-center gap-2 px-3 py-1 text-white"
          style={{ background: "var(--xp-blue, #0a51c9)" }}
        >
          <span>🧭</span>
          <span className="text-[13px] font-semibold">Sahayak Setup — Step {step} of 3</span>
        </div>

        <div className="p-6 text-neutral-800">
          {step === 1 && (
            <section>
              <h2 className="text-[18px] font-bold">Welcome, {firstName}</h2>
              <p className="mt-1 text-[13px] text-neutral-600">
                You&apos;re building your outbound system.
              </p>
              <p className="mt-4 text-[13px]">
                Sahayak discovers accounts, writes personalised emails, and learns from
                every reply — autonomously. Let&apos;s get you set up.
              </p>
              <div className="mt-6 flex justify-end">
                <button type="button" className="xp-btn xp-btn--primary" onClick={() => setStep(2)}>
                  Continue →
                </button>
              </div>
            </section>
          )}

          {step === 2 && (
            <section>
              <h2 className="text-[18px] font-bold">Set up your sender</h2>
              <p className="mt-1 text-[13px] text-neutral-600">Every email needs a home.</p>
              <ul className="mt-4 list-disc space-y-1 pl-5 text-[13px]">
                <li>Verify your sending domain on Resend (SPF + DKIM).</li>
                <li>Add your Resend API key to the client, or use the shared key.</li>
                <li>Pick a sender name + address on that domain.</li>
              </ul>
              <p className="mt-3 text-[12px] text-neutral-500">
                You can do this now or skip and use a test sender for the first run.
              </p>
              <div className="mt-6 flex justify-between">
                <button type="button" className="xp-btn" onClick={() => setStep(1)}>
                  ← Back
                </button>
                <button type="button" className="xp-btn xp-btn--primary" onClick={() => setStep(3)}>
                  Continue →
                </button>
              </div>
            </section>
          )}

          {step === 3 && (
            <section>
              <h2 className="text-[18px] font-bold">Create your first client</h2>
              <p className="mt-1 text-[13px] text-neutral-600">
                Open the New Client app on the desktop and define your ICP.
              </p>
              <p className="mt-4 text-[13px]">
                That&apos;s it — the Orchestrator takes over from there.
              </p>
              <div className="mt-6 flex justify-between">
                <button type="button" className="xp-btn" onClick={() => setStep(2)}>
                  ← Back
                </button>
                <button
                  type="button"
                  className="xp-btn xp-btn--green"
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
