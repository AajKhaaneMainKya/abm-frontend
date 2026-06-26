"use client";

/**
 * XP UI primitives — the chrome accents that give the dashboard its
 * Windows-XP feel: windows with title bars, beveled buttons, chunky
 * progress bars, tabs, badges. Everything else stays clean & modern.
 */
import * as React from "react";
import * as RadixTabs from "@radix-ui/react-tabs";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Minus, Square, Copy } from "lucide-react";

/* ---------------- Functional window title bar (window manager) ---------------- */

export function XpTitleBar({
  title,
  icon,
  active = true,
  isMaximized = false,
  onMinimize,
  onMaximize,
  onClose,
  onPointerDown,
  onDoubleClick,
}: {
  title: string;
  icon?: React.ReactNode;
  active?: boolean;
  isMaximized?: boolean;
  onMinimize?: () => void;
  onMaximize?: () => void;
  onClose?: () => void;
  onPointerDown?: (e: React.PointerEvent) => void;
  onDoubleClick?: () => void;
}) {
  // Stop drag from starting when a control button is pressed.
  const stop = (e: React.PointerEvent) => e.stopPropagation();
  return (
    <div
      className={`xp-titlebar ${active ? "" : "xp-titlebar--inactive"}`}
      onPointerDown={onPointerDown}
      onDoubleClick={onDoubleClick}
      style={{ cursor: "default", touchAction: "none" }}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span className="xp-titlebar__title">{title}</span>
      <span className="xp-titlebar__btns" onPointerDown={stop}>
        <button
          type="button"
          className="xp-titlebar__btn"
          title="Minimize"
          onClick={onMinimize}
        >
          <Minus size={11} strokeWidth={3} />
        </button>
        <button
          type="button"
          className="xp-titlebar__btn"
          title={isMaximized ? "Restore" : "Maximize"}
          onClick={onMaximize}
        >
          {isMaximized ? <Copy size={10} strokeWidth={3} /> : <Square size={9} strokeWidth={3} />}
        </button>
        <button
          type="button"
          className="xp-titlebar__btn xp-titlebar__btn--close"
          title="Close"
          onClick={onClose}
        >
          <X size={12} strokeWidth={3} />
        </button>
      </span>
    </div>
  );
}

/* ---------------- Window + title bar ---------------- */

export function XpWindow({
  title,
  children,
  icon,
  headerRight,
  className = "",
  bodyClassName = "",
  bodyStyle,
}: {
  title: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  headerRight?: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  bodyStyle?: React.CSSProperties;
}) {
  return (
    <section className={`xp-window ${className}`}>
      <div className="xp-titlebar">
        {icon && <span className="shrink-0">{icon}</span>}
        <span className="xp-titlebar__title">{title}</span>
        {headerRight}
        <span className="xp-titlebar__btns">
          <span className="xp-titlebar__btn" aria-hidden title="Minimize">
            <Minus size={11} strokeWidth={3} />
          </span>
          <span className="xp-titlebar__btn" aria-hidden title="Maximize">
            <Square size={9} strokeWidth={3} />
          </span>
          <span
            className="xp-titlebar__btn xp-titlebar__btn--close"
            aria-hidden
            title="Close"
          >
            <X size={12} strokeWidth={3} />
          </span>
        </span>
      </div>
      <div className={`xp-window__body ${bodyClassName}`} style={bodyStyle}>
        {children}
      </div>
    </section>
  );
}

/* ---------------- Button ---------------- */

type ButtonVariant = "default" | "green" | "red" | "primary";

export function XpButton({
  variant = "default",
  className = "",
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  const v =
    variant === "green"
      ? "xp-btn--green"
      : variant === "red"
        ? "xp-btn--red"
        : variant === "primary"
          ? "xp-btn--primary"
          : "";
  return (
    <button className={`xp-btn ${v} ${className}`} {...props}>
      {children}
    </button>
  );
}

/* ---------------- Progress bar (chunky XP style) ---------------- */

export function XpProgress({
  value,
  tone = "green",
  showValue = false,
  className = "",
}: {
  value: number; // 0..100
  tone?: "green" | "teal" | "amber";
  showValue?: boolean;
  className?: string;
}) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  const fillClass =
    tone === "teal"
      ? "xp-progress__fill--teal"
      : tone === "amber"
        ? "xp-progress__fill--amber"
        : "";
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="xp-progress flex-1">
        <div className={`xp-progress__fill ${fillClass}`} style={{ width: `${pct}%` }} />
      </div>
      {showValue && (
        <span className="w-9 text-right text-[11px] font-bold tabular-nums text-neutral-700">
          {pct}%
        </span>
      )}
    </div>
  );
}

/* ---------------- Badge ---------------- */

export function XpBadge({
  children,
  color = "#316ac5",
  className = "",
}: {
  children: React.ReactNode;
  color?: string;
  className?: string;
}) {
  return (
    <span
      className={`xp-badge ${className}`}
      style={{ background: `${color}1a`, color, borderColor: `${color}55` }}
    >
      {children}
    </span>
  );
}

/* ---------------- Stat card (XP window mini) ---------------- */

export function StatCard({
  label,
  value,
  accent = "#1b5dbf",
  icon,
}: {
  label: string;
  value: React.ReactNode;
  accent?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="xp-window !rounded-md">
      <div
        className="flex items-center gap-2 px-3 py-1.5 text-[11px] font-bold text-white"
        style={{ background: `linear-gradient(180deg, ${accent} 0%, ${accent}cc 100%)` }}
      >
        {icon}
        <span className="truncate uppercase tracking-wide">{label}</span>
      </div>
      <div className="bg-white px-3 py-3">
        <div className="text-3xl font-bold tabular-nums text-neutral-800">{value}</div>
      </div>
    </div>
  );
}

/* ---------------- Tabs (radix, XP styling) ---------------- */

export function XpTabs({
  tabs,
  value,
  onValueChange,
  children,
}: {
  tabs: { value: string; label: string }[];
  value: string;
  onValueChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <RadixTabs.Root value={value} onValueChange={onValueChange}>
      <RadixTabs.List className="xp-tabs">
        {tabs.map((t) => (
          <RadixTabs.Trigger key={t.value} value={t.value} className="xp-tab">
            {t.label}
          </RadixTabs.Trigger>
        ))}
      </RadixTabs.List>
      <div className="border border-t-0 border-[#919b9c] bg-[#ece9d8] p-3">
        {children}
      </div>
    </RadixTabs.Root>
  );
}

export const XpTabPanel = RadixTabs.Content;

/* ---------------- Dialog (XP window style) ---------------- */

export function XpDialog({
  open,
  onOpenChange,
  title,
  children,
  footer,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[440px] max-w-[92vw] -translate-x-1/2 -translate-y-1/2 xp-window">
          <div className="xp-titlebar">
            <Dialog.Title className="xp-titlebar__title">{title}</Dialog.Title>
            <span className="xp-titlebar__btns">
              <Dialog.Close
                className="xp-titlebar__btn xp-titlebar__btn--close"
                aria-label="Close"
              >
                <X size={12} strokeWidth={3} />
              </Dialog.Close>
            </span>
          </div>
          <div className="bg-[#ece9d8] px-5 py-5 text-[13px] text-neutral-800">
            {children}
          </div>
          {footer && (
            <div className="flex justify-end gap-2 border-t border-[#c9c4b4] bg-[#ece9d8] px-5 py-3">
              {footer}
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/* ---------------- Small helpers ---------------- */

export function Loading({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 p-4 text-[13px] text-neutral-600">
      <span className="inline-block h-3 w-3 animate-pulse rounded-full bg-[#1b5dbf]" />
      {label}
    </div>
  );
}

export function ErrorNote({ error }: { error: unknown }) {
  const msg =
    (error as { message?: string })?.message ?? "Could not reach the ABM API.";
  return (
    <div className="m-1 border border-[#a02020] bg-[#fdeaea] px-3 py-2 text-[12px] text-[#7a1818]">
      <strong>Connection error.</strong> {msg}
      <div className="mt-1 text-[11px] text-[#a05050]">
        Check that NEXT_PUBLIC_API_URL points at the running backend.
      </div>
    </div>
  );
}
