"use client";

/**
 * Animated "Sahayak running" desktop — a pure-CSS/JS mockup shown behind the
 * /welcome sign-in panel. No backend calls; everything is fake, driven by
 * timers. Desktop only (hidden on mobile — the page falls back to solid teal).
 *
 * Lint note: this repo errors on react-hooks/set-state-in-effect, so every
 * setState here runs inside a timer callback — never synchronously in an effect
 * body. Initial values come from useState initializers. Counters use setInterval
 * (right tool for discrete multi-second ticks; rAF at 60fps to bump an 8s
 * counter would just burn cycles). All motion is opacity/transform only.
 */

import { useEffect, useState } from "react";
import { Monitor, Cpu, Inbox } from "lucide-react";

const DECISIONS = [
  "► Discovering accounts for TenarAI — 30-day goal: 5 calls",
  "► Signal detected: Rocketlane raised Series B — triggering email",
  "► 3 accounts enriched — routing to Personalizer",
  "► Email scored 8.2/10 — confidence 81 — auto-sending",
  "► Memory updated — proof_point angle outperforming",
  "► Gap analysis: missing Fintech segment — searching...",
];

const COMPANIES = [
  "Rocketlane", "Clueso", "Groww", "Razorpay",
  "Chargebee", "Freshworks", "Zoho", "Postman",
];

function WindowFrame({
  title,
  icon,
  className,
  style,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`overflow-hidden rounded-lg border border-black/50 bg-[#ece9d8] shadow-2xl ${className ?? ""}`}
      style={style}
    >
      <div
        className="flex items-center gap-2 px-3 py-1.5 text-[12px] font-semibold text-white"
        style={{ background: "linear-gradient(to right, #0a246a, #1b5dbf)" }}
      >
        {icon}
        <span>{title}</span>
      </div>
      <div className="p-3">{children}</div>
    </div>
  );
}

/* ── Window 1: Orchestrator — typewriter decisions ──────────── */
function OrchestratorWindow() {
  const [typed, setTyped] = useState("");

  useEffect(() => {
    let charTimer: ReturnType<typeof setInterval>;
    let holdTimer: ReturnType<typeof setTimeout>;

    function playLine(i: number) {
      const text = DECISIONS[i];
      let pos = 0;
      charTimer = setInterval(() => {
        pos += 1;
        setTyped(text.slice(0, pos));
        if (pos >= text.length) {
          clearInterval(charTimer);
          holdTimer = setTimeout(() => {
            setTyped("");
            playLine((i + 1) % DECISIONS.length);
          }, 3000);
        }
      }, 26);
    }

    playLine(0);
    return () => {
      clearInterval(charTimer);
      clearTimeout(holdTimer);
    };
  }, []);

  return (
    <WindowFrame
      title="Orchestrator"
      icon={<Cpu size={13} />}
      className="w-[400px]"
      style={{ position: "absolute", left: "4%", top: "9%" }}
    >
      <div className="min-h-[64px] rounded bg-[#0b1020] p-3 font-mono text-[12px] leading-relaxed text-emerald-300">
        <span>{typed}</span>
        <span className="sd-cursor">▋</span>
      </div>
    </WindowFrame>
  );
}

/* ── Window 2: Pipeline — incrementing counters ─────────────── */
function CounterRow({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center justify-between border-b border-black/10 py-1 last:border-0">
      <span className="text-[12px] font-medium text-neutral-600">{label}</span>
      {/* key changes on value → remount runs the flash animation */}
      <span key={value} className="sd-tick rounded px-1.5 text-[13px] font-bold tabular-nums" style={{ color }}>
        {value}
      </span>
    </div>
  );
}

function PipelineWindow() {
  const [discovered, setDiscovered] = useState(12);
  const [enriched, setEnriched] = useState(7);
  const [sent, setSent] = useState(3);

  useEffect(() => {
    const d = setInterval(() => setDiscovered((n) => n + 1), 8000);
    const e = setInterval(() => setEnriched((n) => n + 1), 12000);
    const s = setInterval(() => setSent((n) => n + 1), 20000);
    return () => {
      clearInterval(d);
      clearInterval(e);
      clearInterval(s);
    };
  }, []);

  return (
    <WindowFrame
      title="Pipeline"
      icon={<Monitor size={13} />}
      className="w-[300px]"
      style={{ position: "absolute", left: "6%", bottom: "9%" }}
    >
      <div className="rounded bg-white/70 px-2 py-1">
        <CounterRow label="DISCOVERED" value={discovered} color="#0a51c9" />
        <CounterRow label="ENRICHED" value={enriched} color="#0a51c9" />
        <CounterRow label="SENT" value={sent} color="#1a7f37" />
        <CounterRow label="REPLIED" value={1} color="#1a7f37" />
      </div>
    </WindowFrame>
  );
}

/* ── Window 3: Draft Queue — card appears then approves ─────── */
function DraftQueueWindow() {
  const [idx, setIdx] = useState(0);
  const [approved, setApproved] = useState(false);

  useEffect(() => {
    let approveT: ReturnType<typeof setTimeout>;
    let nextT: ReturnType<typeof setTimeout>;

    function schedule(i: number) {
      approveT = setTimeout(() => setApproved(true), 8000);
      nextT = setTimeout(() => {
        setApproved(false);
        setIdx((i + 1) % COMPANIES.length);
        schedule((i + 1) % COMPANIES.length);
      }, 15000);
    }

    schedule(0); // effect body only schedules timers — no synchronous setState
    return () => {
      clearTimeout(approveT);
      clearTimeout(nextT);
    };
  }, []);

  const company = COMPANIES[idx];

  return (
    <WindowFrame
      title="Draft Queue"
      icon={<Inbox size={13} />}
      className="w-[340px]"
      style={{ position: "absolute", right: "-48px", top: "50%", transform: "translateY(-50%)" }}
    >
      {/* key on idx → card remounts and fades in fresh each cycle */}
      <div key={idx} className="sd-card rounded-md border border-black/10 bg-white p-3 shadow">
        <div className="flex items-start justify-between gap-2">
          <div className="text-[13px] font-bold text-neutral-900">{company}</div>
          <span className="shrink-0 rounded bg-emerald-100 px-1.5 py-0.5 text-[11px] font-bold text-emerald-700">
            8.4 ✓
          </span>
        </div>
        <div className="mt-1 text-[12px] italic text-neutral-500">
          &ldquo;scaling outbound without a hire&rdquo;
        </div>
        <div className="mt-2 h-[20px]">
          {approved && (
            <span className="sd-approve inline-block rounded bg-emerald-600 px-2 py-0.5 text-[11px] font-bold text-white">
              Approved ✓
            </span>
          )}
        </div>
      </div>
    </WindowFrame>
  );
}

export default function SahayakDemoBg() {
  return (
    <div className="pointer-events-none absolute inset-0 hidden overflow-hidden md:block" aria-hidden="true">
      <style>{`
        @keyframes sdBlink { 0%,49%{opacity:1} 50%,100%{opacity:0} }
        .sd-cursor { animation: sdBlink 1s steps(1) infinite; }
        @keyframes sdFlash { from { background:#fde047; color:#111; } to { background:transparent; } }
        .sd-tick { animation: sdFlash .7s ease; }
        @keyframes sdCardIn { from { opacity:0; transform: translateY(10px); } to { opacity:1; transform:none; } }
        .sd-card { animation: sdCardIn .5s ease both; }
        @keyframes sdApprove { from { opacity:0; transform: scale(.9); } to { opacity:1; transform:none; } }
        .sd-approve { animation: sdApprove .4s ease both; }
      `}</style>

      {/* faint desktop wash so the windows read as "on a screen" */}
      <div
        className="absolute inset-0 opacity-[0.5]"
        style={{ background: "radial-gradient(1200px 600px at 30% 40%, #142a4a 0%, #0a0a1a 70%)" }}
      />

      <OrchestratorWindow />
      <PipelineWindow />
      <DraftQueueWindow />

      {/* dimming overlay so the sign-in panel pops */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(135deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.7) 100%)",
        }}
      />
    </div>
  );
}
