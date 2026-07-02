"use client";

/**
 * Sahayak sign-in — clean dark SaaS login (Linear/Vercel/Raycast direction).
 * Deep-navy gradient with an ambient grid + orbs (components/sahayak-demo-bg),
 * a 50/50 split: brand story + live stat on the left, frosted sign-in panel on
 * the right. Stacks on mobile (feature rows hidden on very small screens).
 *
 * Clerk's <SignIn/> is themed dark via the appearance API. See SETUP_AUTH.md.
 */

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { SignIn, useAuth } from "@clerk/nextjs";
import SahayakDemoBg, { LiveStat } from "@/components/sahayak-demo-bg";

const FEATURES = [
  {
    icon: "🔍",
    title: "Finds companies matching your ICP",
    sub: "Scout agent searches 24/7 — no manual list building",
  },
  {
    icon: "✉️",
    title: "Writes emails that don't sound like AI",
    sub: "6-agent pipeline. Provenance check. Voice matching.",
  },
  {
    icon: "🧠",
    title: "Learns from every reply",
    sub: "Memory agent updates strategy after every outcome",
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
      className="relative min-h-screen w-full overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #0f0f1a 0%, #0d1117 50%, #0a0f1e 100%)",
      }}
    >
      <style>{`
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
        .wl-row { animation: fadeInUp .5s ease both; }
      `}</style>

      <SahayakDemoBg />

      <div className="relative z-10 flex min-h-screen w-full flex-col md:flex-row">
        {/* ── LEFT: brand + features + live stat ─────────────── */}
        <div className="flex flex-1 flex-col justify-center gap-10 px-8 py-16 sm:px-[60px]">
          <div>
            <div className="flex items-center gap-3">
              <div
                className="grid h-8 w-8 place-items-center rounded-lg text-[15px] font-bold text-white"
                style={{ background: "linear-gradient(135deg, #14b8a6, #6366f1)" }}
              >
                S
              </div>
              <span className="text-[32px] font-bold leading-none text-white">Sahayak</span>
            </div>
            <p className="mt-3 text-[16px] text-white/60">Your outbound motion. Automated.</p>
          </div>

          <div className="hidden flex-col gap-8 sm:flex">
            {FEATURES.map((f, i) => (
              <div
                key={f.title}
                className="wl-row flex items-start gap-3"
                style={{ animationDelay: `${0.2 + i * 0.2}s` }}
              >
                <span className="text-xl leading-none">{f.icon}</span>
                <div>
                  <div className="text-[15px] font-semibold text-white">{f.title}</div>
                  <div className="mt-0.5 text-[13px] text-white/45">{f.sub}</div>
                </div>
              </div>
            ))}
          </div>

          <LiveStat />
        </div>

        {/* ── RIGHT: sign-in panel ───────────────────────────── */}
        <div className="flex flex-1 items-center justify-center px-8 py-16">
          <div
            className="w-full"
            style={{
              maxWidth: "420px",
              margin: "0 auto",
              padding: "48px",
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "16px",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              boxShadow: "0 0 0 1px rgba(255,255,255,0.05), 0 20px 40px rgba(0,0,0,0.4)",
            }}
          >
            <p className="mb-4 text-[13px] text-white/40">Welcome back</p>
            <SignIn
              routing="hash"
              fallbackRedirectUrl="/"
              signUpForceRedirectUrl="/onboarding"
              appearance={{
                variables: {
                  // Clerk v7 variable names (renamed from the core-1 set):
                  //   colorText->colorForeground, colorTextSecondary->colorMutedForeground,
                  //   colorInputBackground->colorInput, colorInputText->colorInputForeground.
                  colorBackground: "transparent",
                  colorForeground: "#ffffff",
                  colorMutedForeground: "rgba(255,255,255,0.5)",
                  colorInput: "rgba(255,255,255,0.05)",
                  colorInputForeground: "#ffffff",
                  colorPrimary: "#14b8a6",
                  borderRadius: "8px",
                },
                elements: {
                  card: "shadow-none bg-transparent p-0 w-full",
                  cardBox: "w-full shadow-none",
                  rootBox: "w-full",
                  headerTitle: "text-white text-xl font-semibold",
                  headerSubtitle: "text-white/50 text-sm",
                  socialButtonsBlockButton:
                    "border border-white/10 bg-white/5 text-white hover:bg-white/10",
                  formFieldInput:
                    "bg-white/5 border-white/10 text-white placeholder:text-white/30",
                  footerActionLink: "text-teal-400 hover:text-teal-300",
                  dividerLine: "bg-white/10",
                  dividerText: "text-white/30",
                  formButtonPrimary: "bg-teal-500 hover:bg-teal-400 text-white font-medium",
                  // Clerk's footer has its own solid background that bled past
                  // the panel — make it (and its inner card) transparent.
                  footer: "bg-transparent bg-none",
                  footerAction: "bg-transparent",
                  footerActionText: "text-white/50",
                },
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
