"use client";

/**
 * OnboardingTour — a 7-step guided setup for first-time users.
 *
 * Shows once per browser (guarded by localStorage 'sahayak_onboarding_complete').
 * Step 1 is a full-screen welcome modal; steps 2-6 spotlight a real element on
 * screen (dimming the rest via the box-shadow "hole" technique) with a tooltip;
 * step 7 is a completion toast with confetti that auto-dismisses.
 *
 * Spotlight steps target elements by [data-tour="…"]. Targets are resilient:
 * if the element isn't on screen yet (e.g. a wizard hasn't reached that field),
 * the tooltip falls back to screen-center so the tour never gets stuck.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const STORAGE_KEY = "sahayak_onboarding_complete";
const TOTAL_STEPS = 7;

type Rect = { top: number; left: number; width: number; height: number };

interface SpotlightStep {
  kind: "spotlight";
  target: string;
  title: string;
  body: string;
  cta: string;
}
interface ModalStep {
  kind: "modal";
}
interface ToastStep {
  kind: "toast";
}
type Step = ModalStep | SpotlightStep | ToastStep;

const STEPS: Step[] = [
  { kind: "modal" }, // 1 — welcome
  {
    kind: "spotlight",
    target: '[data-tour="nav-new-client"]',
    title: "Start here",
    body: "Create your first client — the company you're running outbound for.",
    cta: "Create a client →",
  }, // 2
  {
    kind: "spotlight",
    target: '[data-tour="icp-section"]',
    title: "Define your ICP",
    body: "Be specific with your ICP. Industry, company size, job titles. The more specific, the better Sahayak targets.",
    cta: "Got it →",
  }, // 3
  {
    kind: "spotlight",
    target: '[data-tour="voice-anchor"]',
    title: "Match your voice",
    body: "Paste a sample of how you write. Sahayak matches your tone — not a generic template.",
    cta: "Got it →",
  }, // 4
  {
    kind: "spotlight",
    target: '[data-tour="trigger-now"]',
    title: "Launch the campaign",
    body: "Hit this to start your campaign. Sahayak will find companies, enrich contacts, and draft emails.",
    cta: "Trigger Now →",
  }, // 5
  {
    kind: "spotlight",
    target: '[data-tour="nav-queue"]',
    title: "Review before send",
    body: "Every email lands here before sending. You approve or reject. You stay in control.",
    cta: "Got it →",
  }, // 6
  { kind: "toast" }, // 7 — completion
];

function useTargetRect(selector: string | null, active: boolean): Rect | null {
  const [rect, setRect] = useState<Rect | null>(null);

  useEffect(() => {
    if (!active || !selector) return;
    let raf = 0;
    const measure = () => {
      const el = document.querySelector(selector) as HTMLElement | null;
      if (el) {
        const r = el.getBoundingClientRect();
        setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
      } else {
        setRect(null);
      }
    };
    // Poll briefly so targets that appear after a navigation get picked up.
    measure();
    const interval = setInterval(measure, 200);
    const onScrollResize = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(measure);
    };
    window.addEventListener("resize", onScrollResize);
    window.addEventListener("scroll", onScrollResize, true);
    return () => {
      clearInterval(interval);
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onScrollResize);
      window.removeEventListener("scroll", onScrollResize, true);
    };
  }, [selector, active]);

  return rect;
}

function ProgressDots({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
        <span
          key={i}
          className="h-1.5 w-1.5 rounded-full"
          style={{ background: i <= current ? "#0f766e" : "#d1d5db" }}
        />
      ))}
    </div>
  );
}

export default function OnboardingTour() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [tooltipH, setTooltipH] = useState(180);

  // First-run check (client-only to avoid hydration mismatch). Reading
  // localStorage requires the browser, so this must run after mount.
  useEffect(() => {
    let firstRun = true;
    try {
      firstRun = localStorage.getItem(STORAGE_KEY) !== "1";
    } catch {
      firstRun = true;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- mount-time bootstrap
    setMounted(true);
    if (firstRun) setVisible(true);
  }, []);

  const current = STEPS[step];
  const isSpotlight = current?.kind === "spotlight";
  const rect = useTargetRect(
    isSpotlight ? (current as SpotlightStep).target : null,
    visible && isSpotlight,
  );

  // Measure tooltip height so we can flip above/below the target.
  useEffect(() => {
    if (tooltipRef.current) setTooltipH(tooltipRef.current.offsetHeight);
  }, [step, rect]);

  const finish = useCallback(
    (celebrate: boolean) => {
      try {
        localStorage.setItem(STORAGE_KEY, "1");
      } catch {
        /* ignore */
      }
      if (celebrate) {
        import("canvas-confetti")
          .then((m) =>
            m.default({
              particleCount: 140,
              spread: 75,
              origin: { x: 0.9, y: 0.9 },
              colors: ["#0f766e", "#14b8a6", "#99f6e4", "#f59e0b"],
            }),
          )
          .catch(() => {});
      }
    },
    [],
  );

  const close = useCallback(() => {
    setVisible(false);
  }, []);

  const skip = useCallback(() => {
    finish(false);
    close();
  }, [finish, close]);

  const next = useCallback(() => {
    const cur = STEPS[step];
    if (cur.kind === "spotlight" && cur.target === '[data-tour="nav-new-client"]') {
      router.push("/clients/new");
    }
    if (cur.kind === "spotlight" && cur.target === '[data-tour="trigger-now"]') {
      // Actually fire the campaign by clicking the real Trigger Now button.
      const btn = document.querySelector('[data-tour="trigger-now"]') as HTMLButtonElement | null;
      btn?.click();
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }, [step, router]);

  // Entering the completion step: persist + confetti, then auto-dismiss.
  useEffect(() => {
    if (!visible) return;
    if (STEPS[step]?.kind !== "toast") return;
    finish(true);
    const t = setTimeout(close, 5000);
    return () => clearTimeout(t);
  }, [visible, step, finish, close]);

  if (!mounted || !visible) return null;

  const stepLabel = `Step ${step + 1} of ${TOTAL_STEPS}`;

  /* ---------------- Welcome modal (step 1) ---------------- */
  if (current.kind === "modal") {
    return (
      <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 p-4">
        <div className="w-[480px] max-w-full rounded-xl bg-white p-8 shadow-[0_20px_60px_rgba(0,0,0,0.3)]">
          <div className="mb-4 flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-[#0f766e] text-[15px] font-bold text-white">
              S
            </span>
            <ProgressDots current={0} />
          </div>
          <h2 className="text-[22px] font-semibold text-[#111827]">Welcome to Sahayak 👋</h2>
          <p className="mt-2 text-[14px] leading-relaxed text-[#6b7280]">
            Your agentic ABM system is ready. Let&apos;s get you set up in 3 minutes.
          </p>
          <button
            type="button"
            onClick={next}
            className="mt-6 w-full rounded-md bg-[#0f766e] px-4 py-2.5 text-[14px] font-medium text-white transition-colors hover:bg-[#0d6960]"
          >
            Get started →
          </button>
          <button
            type="button"
            onClick={skip}
            className="mt-3 block w-full text-center text-[13px] text-[#6b7280] hover:text-[#111827]"
          >
            Skip tour
          </button>
        </div>
      </div>
    );
  }

  /* ---------------- Completion toast (step 7) ---------------- */
  if (current.kind === "toast") {
    return (
      <div className="fixed bottom-5 right-5 z-[10000] w-[360px] max-w-[calc(100vw-2.5rem)] rounded-lg border border-[#e5e7eb] bg-white p-4 shadow-[0_10px_40px_rgba(0,0,0,0.18)]">
        <div className="flex items-start gap-3">
          <span className="text-[22px] leading-none">🎉</span>
          <div className="flex-1">
            <div className="text-[14px] font-semibold text-[#111827]">You&apos;re all set.</div>
            <div className="mt-0.5 text-[13px] text-[#6b7280]">
              Sahayak is running your outbound.
            </div>
          </div>
          <button
            type="button"
            onClick={close}
            className="text-[13px] text-[#9ca3af] hover:text-[#111827]"
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
      </div>
    );
  }

  /* ---------------- Spotlight steps (2-6) ---------------- */
  const spot = current as SpotlightStep;
  const pad = 6;
  const vw = typeof window !== "undefined" ? window.innerWidth : 1280;
  const vh = typeof window !== "undefined" ? window.innerHeight : 800;
  const TOOLTIP_W = 320;

  // Where does the highlight sit? (fall back to screen-center if not found)
  const hole: Rect | null = rect
    ? {
        top: rect.top - pad,
        left: rect.left - pad,
        width: rect.width + pad * 2,
        height: rect.height + pad * 2,
      }
    : null;

  // Tooltip placement: below the target if there's room, else above.
  let tipTop: number;
  let tipLeft: number;
  let arrow: "up" | "down" | null = "up";
  if (hole) {
    const below = hole.top + hole.height + 12;
    const above = hole.top - tooltipH - 12;
    if (below + tooltipH <= vh - 8) {
      tipTop = below;
      arrow = "up";
    } else {
      tipTop = Math.max(8, above);
      arrow = "down";
    }
    const centered = hole.left + hole.width / 2 - TOOLTIP_W / 2;
    tipLeft = Math.min(Math.max(12, centered), vw - TOOLTIP_W - 12);
  } else {
    tipTop = vh / 2 - tooltipH / 2;
    tipLeft = vw / 2 - TOOLTIP_W / 2;
    arrow = null;
  }

  const arrowLeft = hole
    ? Math.min(Math.max(20, hole.left + hole.width / 2 - tipLeft), TOOLTIP_W - 28)
    : 0;

  const arrowStyle: React.CSSProperties = {
    left: arrowLeft,
    boxShadow:
      arrow === "up"
        ? "-2px -2px 3px rgba(0,0,0,0.04)"
        : "2px 2px 3px rgba(0,0,0,0.04)",
  };
  if (arrow === "up") arrowStyle.top = -6;
  else arrowStyle.bottom = -6;

  return (
    <div className="fixed inset-0 z-[10000]">
      {/* Click-blocker so the dimmed background is inert during the tour. */}
      <div className="absolute inset-0" style={{ background: hole ? "transparent" : "rgba(0,0,0,0.5)" }} />

      {/* Spotlight "hole" — dims everything except the target via a huge shadow. */}
      {hole && (
        <div
          className="pointer-events-none absolute transition-all duration-200"
          style={{
            top: hole.top,
            left: hole.left,
            width: hole.width,
            height: hole.height,
            borderRadius: 8,
            boxShadow: "0 0 0 9999px rgba(0,0,0,0.5)",
          }}
        />
      )}

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className="absolute w-[320px] rounded-lg bg-white p-4 shadow-[0_4px_20px_rgba(0,0,0,0.15)]"
        style={{ top: tipTop, left: tipLeft }}
      >
        {arrow && (
          <span className="absolute h-3 w-3 rotate-45 bg-white" style={arrowStyle} />
        )}
        <div className="mb-2 flex items-center justify-between">
          <ProgressDots current={step} />
          <span className="text-[11px] font-medium text-[#9ca3af]">{stepLabel}</span>
        </div>
        <div className="text-[14px] font-semibold text-[#111827]">{spot.title}</div>
        <p className="mt-1 text-[13px] leading-relaxed text-[#6b7280]">{spot.body}</p>
        <div className="mt-4 flex items-center justify-between">
          <button
            type="button"
            onClick={skip}
            className="text-[12px] text-[#9ca3af] hover:text-[#111827]"
          >
            Skip
          </button>
          <button
            type="button"
            onClick={next}
            className="rounded-md bg-[#0f766e] px-3.5 py-2 text-[13px] font-medium text-white transition-colors hover:bg-[#0d6960]"
          >
            {spot.cta}
          </button>
        </div>
      </div>
    </div>
  );
}
