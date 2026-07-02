"use client";

/**
 * Sahayak splash + sign-in. Full-screen teal, two columns (55/45) centered,
 * stacking on mobile. Cards and the sign-in dialog are normal flow elements
 * (flexbox + gap) — NOT the window-manager's `.xp-os-window`, which is
 * position:absolute and was overlapping everything here.
 *
 * We embed Clerk's prebuilt <SignIn/> (hash routing, no catch-all route needed)
 * rather than hand-rolled OAuth buttons — it renders whatever providers are
 * enabled in the dashboard. See SETUP_AUTH.md to switch to custom buttons.
 */

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Monitor } from "lucide-react";
import { SignIn, useAuth } from "@clerk/nextjs";

const VALUE_PROPS = [
  {
    icon: "🔍",
    title: "Finds the right companies",
    body: "Discovers accounts matching your ICP automatically.",
  },
  {
    icon: "✉️",
    title: "Writes personalised emails",
    body: "6-agent pipeline. No templates. No assumptions.",
  },
  {
    icon: "🧠",
    title: "Learns from every reply",
    body: "Memory agent updates strategy after every outcome.",
  },
];

export default function WelcomePage() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();

  useEffect(() => {
    if (isLoaded && isSignedIn) router.replace("/");
  }, [isLoaded, isSignedIn, router]);

  return (
    <div
      className="flex min-h-screen w-full items-center justify-center p-6 sm:p-10"
      style={{ background: "#008080" }}
    >
      <style>{`
        @keyframes xpFadeUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
        .xp-fade { animation: xpFadeUp .55s cubic-bezier(.2,.7,.2,1) both; }
      `}</style>

      <div className="grid w-full max-w-6xl items-center gap-10 md:grid-cols-[55fr_45fr] lg:gap-16">
        {/* ── LEFT: branding + value props ───────────────────── */}
        <div>
          <h1
            className="xp-fade font-bold leading-none tracking-tight text-white"
            style={{
              fontFamily: "Segoe UI, Tahoma, Verdana, sans-serif",
              fontSize: "48px",
              textShadow: "0 2px 12px rgba(0,0,0,0.25)",
            }}
          >
            Sahayak
          </h1>
          <p
            className="xp-fade mt-3 text-lg font-light text-white/85"
            style={{ animationDelay: "80ms" }}
          >
            Your outbound motion. Automated.
          </p>

          <div className="mt-10 flex flex-col gap-4">
            {VALUE_PROPS.map((v, i) => (
              <div
                key={v.title}
                className="xp-fade flex items-start gap-4 rounded-xl bg-white p-4 shadow-lg ring-1 ring-black/5"
                style={{ animationDelay: `${200 + i * 120}ms` }}
              >
                <span className="text-2xl leading-none">{v.icon}</span>
                <div>
                  <div className="text-[15px] font-bold text-neutral-900">{v.title}</div>
                  <div className="mt-0.5 text-[13px] leading-snug text-neutral-500">{v.body}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── RIGHT: sign-in dialog ──────────────────────────── */}
        <div className="flex justify-center md:justify-end">
          <div
            className="xp-fade w-[380px] max-w-full overflow-hidden rounded-lg bg-white shadow-2xl ring-1 ring-black/10"
            style={{ animationDelay: "260ms" }}
          >
            <div
              className="flex items-center gap-2 px-4 py-2.5 text-white"
              style={{
                background: "linear-gradient(to right, #0a246a, #1b5dbf)",
                fontFamily: "Segoe UI, Tahoma, sans-serif",
              }}
            >
              <Monitor size={16} className="shrink-0" />
              <span className="text-[13px] font-semibold">Welcome to Sahayak</span>
            </div>

            <div className="flex justify-center px-5 py-6">
              <SignIn
                routing="hash"
                fallbackRedirectUrl="/"
                signUpForceRedirectUrl="/onboarding"
                appearance={{
                  elements: {
                    rootBox: "w-full",
                    cardBox: "w-full shadow-none",
                    card: "w-full border-0 shadow-none p-0",
                  },
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
