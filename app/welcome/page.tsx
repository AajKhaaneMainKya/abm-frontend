"use client";

/**
 * Sahayak splash + sign-in. A full-screen animated mockup of Sahayak running
 * (components/sahayak-demo-bg) plays behind a centered frosted-glass sign-in
 * panel. The animation is the "story" (replaces the old left column) and is
 * desktop-only; mobile falls back to solid teal with the panel full width.
 *
 * We embed Clerk's prebuilt <SignIn/> (hash routing, no catch-all route needed).
 * See SETUP_AUTH.md to switch to custom OAuth buttons.
 */

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { SignIn, useAuth } from "@clerk/nextjs";
import SahayakDemoBg from "@/components/sahayak-demo-bg";

export default function WelcomePage() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();

  useEffect(() => {
    if (isLoaded && isSignedIn) router.replace("/");
  }, [isLoaded, isSignedIn, router]);

  return (
    <div className="relative min-h-screen w-full overflow-hidden" style={{ background: "#0a0a1a" }}>
      {/* Mobile fallback: solid teal (animation hidden < md) */}
      <div className="absolute inset-0 md:hidden" style={{ background: "#008080" }} />

      {/* Animated "Sahayak running" desktop (desktop only) + dimming overlay */}
      <SahayakDemoBg />

      {/* Sign-in panel — centered, nudged slightly right of centre on desktop */}
      <div className="relative z-10 flex min-h-screen items-center justify-center px-6 md:justify-end md:pr-[10%] lg:pr-[14%]">
        <div className="w-full max-w-[400px]">
          <h1
            className="text-center font-bold tracking-tight text-white"
            style={{
              fontFamily: "Segoe UI, Tahoma, Verdana, sans-serif",
              fontSize: "40px",
              textShadow: "0 2px 16px rgba(0,0,0,0.5)",
            }}
          >
            Sahayak
          </h1>
          <p className="mb-5 text-center text-[15px] font-light text-white/85">
            Your outbound motion. Automated.
          </p>

          <div
            className="overflow-hidden rounded-xl p-5"
            style={{
              background: "rgba(255,255,255,0.95)",
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
              boxShadow: "0 25px 50px rgba(0,0,0,0.5)",
            }}
          >
            <div className="flex justify-center">
              <SignIn
                routing="hash"
                fallbackRedirectUrl="/"
                signUpForceRedirectUrl="/onboarding"
                appearance={{
                  elements: {
                    rootBox: "w-full",
                    cardBox: "w-full shadow-none",
                    card: "w-full border-0 shadow-none p-0 bg-transparent",
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
