"use client";

/**
 * Sahayak splash + sign-in. Full-screen XP teal desktop. Left column = value
 * props (beveled XP windows, staggered fade-in via pure CSS). Right column = an
 * XP dialog framing Clerk's <SignIn/> (hash routing, so no catch-all route is
 * needed). Already-signed-in visitors skip straight to the desktop.
 *
 * Note: we embed Clerk's prebuilt <SignIn/> rather than hand-rolled "Continue
 * with Google / Email" buttons — it renders whatever providers are enabled in
 * the Clerk dashboard and is far more robust. See SETUP_AUTH.md to switch to
 * custom OAuth buttons via useSignIn().
 */

import { useEffect } from "react";
import { useRouter } from "next/navigation";
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
      className="flex min-h-screen w-full items-center justify-center p-6"
      style={{ background: "#008080" }}
    >
      <style>{`
        @keyframes xpFadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes xpSlideIn {
          from { opacity: 0; transform: translateX(28px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>

      <div className="grid w-full max-w-5xl gap-8 md:grid-cols-2 md:items-center">
        {/* LEFT — wordmark + value props */}
        <div className="text-white">
          <h1
            className="font-bold tracking-tight"
            style={{
              fontFamily: "Tahoma, Verdana, sans-serif",
              fontSize: "44px",
              textShadow: "2px 2px 0 rgba(0,0,0,0.35)",
              animation: "xpFadeUp .5s ease both",
            }}
          >
            Sahayak
          </h1>
          <p
            className="mb-6 text-white/90"
            style={{ animation: "xpFadeUp .5s ease both", animationDelay: "80ms" }}
          >
            Your outbound motion. Automated.
          </p>

          <div className="space-y-3">
            {VALUE_PROPS.map((v, i) => (
              <div
                key={v.title}
                className="xp-os-window p-3 text-neutral-800"
                style={{
                  animation: "xpFadeUp .5s ease both",
                  animationDelay: `${200 + i * 200}ms`,
                }}
              >
                <div className="flex items-start gap-3">
                  <span className="text-xl leading-none">{v.icon}</span>
                  <div>
                    <div className="text-[13px] font-bold">{v.title}</div>
                    <div className="text-[12px] text-neutral-600">{v.body}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT — sign-in dialog */}
        <div
          className="flex justify-center"
          style={{ animation: "xpSlideIn .5s ease both", animationDelay: "300ms" }}
        >
          <div className="xp-os-window w-full max-w-sm">
            <div className="xp-os-window__titlebar flex items-center gap-2 px-3 py-1 text-white"
                 style={{ background: "var(--xp-blue, #0a51c9)" }}>
              <span>🖥️</span>
              <span className="text-[13px] font-semibold">Welcome to Sahayak</span>
            </div>
            <div className="flex justify-center p-4">
              <SignIn routing="hash" fallbackRedirectUrl="/" signUpForceRedirectUrl="/onboarding" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
