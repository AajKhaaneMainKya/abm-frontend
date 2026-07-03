"use client";

import { useMemo, useState } from "react";
import { X } from "lucide-react";

/**
 * XP-styled tag input. Type + Enter (or comma) to add a tag.
 * - validate(tag): return an error string to mark the tag invalid (red + tooltip),
 *   or null for a valid tag (green).
 * - suggestions: shows a dropdown of matches as the user types.
 * - minChars/maxChars: per-tag length guard + a live counter on the input.
 */
export function TagInput({
  value,
  onChange,
  placeholder,
  validate,
  suggestions,
  minChars,
  maxChars,
}: {
  value: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
  validate?: (s: string) => string | null;
  suggestions?: string[];
  minChars?: number;
  maxChars?: number;
}) {
  const [draft, setDraft] = useState("");
  const [focused, setFocused] = useState(false);

  const add = (raw: string) => {
    const t = raw.trim();
    if (!t) return;
    if (maxChars && t.length > maxChars) return;
    if (!value.includes(t)) onChange([...value, t]);
    setDraft("");
  };

  const remove = (t: string) => onChange(value.filter((x) => x !== t));

  const matches = useMemo(() => {
    if (!suggestions || !draft.trim()) return [];
    const d = draft.toLowerCase();
    return suggestions.filter((s) => s.toLowerCase().includes(d) && !value.includes(s)).slice(0, 6);
  }, [suggestions, draft, value]);

  const counterTone =
    maxChars && draft.length > maxChars
      ? "text-[#dc2626]"
      : minChars && draft.length > 0 && draft.length < minChars
        ? "text-[#b45309]"
        : "text-[var(--text-secondary)]";

  return (
    <div className="relative">
      <div className="flex flex-wrap items-center gap-1.5 xp-inset rounded-sm bg-white px-2 py-1.5">
        {value.map((t) => {
          const err = validate ? validate(t) : null;
          const tone = !validate
            ? "border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)]"
            : err
              ? "border-[#fecaca] bg-[var(--danger-soft)] text-[#991b1b]"
              : "border-[#bbf7d0] bg-[var(--success-soft)] text-[#166534]";
          return (
            <span
              key={t}
              title={err ?? undefined}
              className={`inline-flex items-center gap-1 rounded-sm border px-1.5 py-0.5 text-[11px] font-semibold ${tone}`}
            >
              {t}
              <button type="button" onClick={() => remove(t)} className="opacity-60 hover:opacity-100">
                <X size={10} strokeWidth={3} />
              </button>
            </span>
          );
        })}
        <input
          className="min-w-[100px] flex-1 bg-transparent text-[13px] text-neutral-800 outline-none"
          value={draft}
          placeholder={value.length === 0 ? placeholder : ""}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setTimeout(() => setFocused(false), 120);
            if (draft.trim()) add(draft);
          }}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              add(draft);
            } else if (e.key === "Backspace" && !draft && value.length) {
              remove(value[value.length - 1]);
            }
          }}
        />
        {(minChars || maxChars) && draft.length > 0 && (
          <span className={`text-[10px] tabular-nums ${counterTone}`}>
            {draft.length}
            {maxChars ? `/${maxChars}` : ""}
          </span>
        )}
      </div>

      {focused && matches.length > 0 && (
        <div className="xp-context-menu absolute left-0 right-0 top-full z-20 mt-0.5">
          {matches.map((m) => (
            <button
              key={m}
              type="button"
              className="xp-context-menu__item"
              onMouseDown={(e) => {
                e.preventDefault();
                add(m);
              }}
            >
              {m}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
