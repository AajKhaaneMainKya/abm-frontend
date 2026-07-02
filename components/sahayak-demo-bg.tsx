"use client";

/**
 * Ambient background + live-stat ticker for the /welcome page.
 *
 * Redesigned to a clean SaaS-login aesthetic (Linear/Vercel/Raycast): a subtle
 * animated grid and two soft floating orbs — pure CSS, no JS. The old floating
 * XP windows are gone. `LiveStat` is the one bit of "live" flavour: fake
 * counters that tick up (setState only in timer callbacks — this repo errors on
 * react-hooks/set-state-in-effect).
 */

import { useEffect, useState } from "react";

/** Full-bleed ambient background: grid + floating orbs. Decorative only. */
export default function SahayakDemoBg() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <style>{`
        @keyframes sdGridDrift { from { background-position: 0 0; } to { background-position: 40px 40px; } }
        @keyframes sdFloatA { 0%,100% { transform: translate(0,0); } 50% { transform: translate(40px,30px); } }
        @keyframes sdFloatB { 0%,100% { transform: translate(0,0); } 50% { transform: translate(-40px,-30px); } }
      `}</style>

      {/* animated grid */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(99,102,241,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.03) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
          animation: "sdGridDrift 6s linear infinite",
        }}
      />

      {/* soft purple orb, top-left */}
      <div
        style={{
          position: "absolute",
          top: "-200px",
          left: "-200px",
          width: "600px",
          height: "600px",
          background: "radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)",
          animation: "sdFloatA 16s ease-in-out infinite",
        }}
      />

      {/* soft teal orb, bottom-right */}
      <div
        style={{
          position: "absolute",
          bottom: "-200px",
          right: "-200px",
          width: "600px",
          height: "600px",
          background: "radial-gradient(circle, rgba(20,184,166,0.08) 0%, transparent 70%)",
          animation: "sdFloatB 18s ease-in-out infinite",
        }}
      />
    </div>
  );
}

/** Fake "live" activity counters for the bottom of the left column. */
export function LiveStat() {
  const [discovered, setDiscovered] = useState(47);
  const [sent, setSent] = useState(12);
  const [replies] = useState(3);

  useEffect(() => {
    const d = setInterval(() => setDiscovered((n) => n + 1), 5000);
    const s = setInterval(() => setSent((n) => n + 1), 16000);
    return () => {
      clearInterval(d);
      clearInterval(s);
    };
  }, []);

  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-white/35">
      <span className="inline-flex items-center gap-1.5">
        <span
          className="inline-block h-2 w-2 rounded-full bg-emerald-400"
          style={{ animation: "pulse 2s ease-in-out infinite" }}
        />
        Live
      </span>
      <span>·</span>
      <span>
        <span className="text-white/60 tabular-nums">{discovered}</span> accounts discovered today
      </span>
      <span>·</span>
      <span>
        <span className="text-white/60 tabular-nums">{sent}</span> emails sent
      </span>
      <span>·</span>
      <span>
        <span className="text-white/60 tabular-nums">{replies}</span> replies
      </span>
    </div>
  );
}
