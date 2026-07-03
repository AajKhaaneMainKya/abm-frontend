"use client";

/**
 * Shared UI primitives — modern SaaS styling (Notion / Linear / Vercel feel).
 * These keep their historical export names (XpWindow, XpButton, …) so every
 * consumer picks up the new look without churn, but they render clean, chromeless
 * components: cards with light headers, flat buttons, thin progress bars, pills.
 */
import * as React from "react";
import * as RadixTabs from "@radix-ui/react-tabs";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";

/* ---------------- Card ("window") ---------------- */

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
    <section className={`card-flush ${className}`}>
      <div className="card-header">
        {icon && <span className="shrink-0 text-[var(--text-secondary)]">{icon}</span>}
        <span className="flex-1 truncate text-[13px] font-semibold text-[var(--foreground)]">
          {title}
        </span>
        {headerRight}
      </div>
      <div className={`p-4 ${bodyClassName}`} style={bodyStyle}>
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
      ? "btn-success"
      : variant === "red"
        ? "btn-danger"
        : variant === "primary"
          ? "btn-primary"
          : "btn-secondary";
  return (
    <button className={`btn ${v} ${className}`} {...props}>
      {children}
    </button>
  );
}

/* ---------------- Progress bar ---------------- */

const TONE_COLOR: Record<string, string> = {
  green: "var(--success)",
  teal: "var(--accent)",
  amber: "var(--warning)",
};

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
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="sk-progress flex-1">
        <div
          className="sk-progress__fill"
          style={{ width: `${pct}%`, background: TONE_COLOR[tone] ?? TONE_COLOR.green }}
        />
      </div>
      {showValue && (
        <span className="w-9 text-right text-[11px] font-semibold tabular-nums text-[var(--text-secondary)]">
          {pct}%
        </span>
      )}
    </div>
  );
}

/* ---------------- Badge / pill ---------------- */

export function XpBadge({
  children,
  color = "#0f766e",
  className = "",
}: {
  children: React.ReactNode;
  color?: string;
  className?: string;
}) {
  return (
    <span
      className={`sk-badge ${className}`}
      style={{ background: `${color}14`, color, borderColor: `${color}33` }}
    >
      {children}
    </span>
  );
}

/* ---------------- Stat card ---------------- */

export function StatCard({
  label,
  value,
  accent = "#0f766e",
  icon,
}: {
  label: string;
  value: React.ReactNode;
  accent?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="card p-4">
      <div className="flex items-center gap-2 text-[12px] font-medium text-[var(--text-secondary)]">
        {icon && (
          <span
            className="grid h-6 w-6 place-items-center rounded-md"
            style={{ background: `${accent}14`, color: accent }}
          >
            {icon}
          </span>
        )}
        <span className="truncate">{label}</span>
      </div>
      <div className="mt-2 text-2xl font-semibold tabular-nums text-[var(--foreground)]">
        {value}
      </div>
    </div>
  );
}

/* ---------------- Tabs (underline) ---------------- */

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
      <RadixTabs.List className="sk-tabs">
        {tabs.map((t) => (
          <RadixTabs.Trigger key={t.value} value={t.value} className="sk-tab">
            {t.label}
          </RadixTabs.Trigger>
        ))}
      </RadixTabs.List>
      <div className="pt-4">{children}</div>
    </RadixTabs.Root>
  );
}

export const XpTabPanel = RadixTabs.Content;

/* ---------------- Dialog (modal) ---------------- */

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
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
        <Dialog.Content className="card-flush fixed left-1/2 top-1/2 z-50 w-[460px] max-w-[92vw] -translate-x-1/2 -translate-y-1/2 shadow-[0_20px_60px_rgba(0,0,0,0.25)]">
          <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-3">
            <Dialog.Title className="text-[15px] font-semibold text-[var(--foreground)]">
              {title}
            </Dialog.Title>
            <Dialog.Close
              className="grid h-7 w-7 place-items-center rounded-md text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]"
              aria-label="Close"
            >
              <X size={16} />
            </Dialog.Close>
          </div>
          <div className="px-5 py-4 text-[13px] text-[var(--foreground)]">{children}</div>
          {footer && (
            <div className="flex justify-end gap-2 border-t border-[var(--border)] bg-[var(--surface)] px-5 py-3">
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
    <div className="flex items-center gap-2 p-4 text-[13px] text-[var(--text-secondary)]">
      <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--accent)]" />
      {label}
    </div>
  );
}

export function ErrorNote({ error }: { error: unknown }) {
  const msg =
    (error as { message?: string })?.message ?? "Could not reach the Sahayak API.";
  return (
    <div className="rounded-md border border-[#fecaca] bg-[var(--danger-soft)] px-3 py-2 text-[12px] text-[#991b1b]">
      <strong>Connection error.</strong> {msg}
      <div className="mt-1 text-[11px] text-[#b45454]">
        Check that NEXT_PUBLIC_API_URL points at the running backend.
      </div>
    </div>
  );
}
