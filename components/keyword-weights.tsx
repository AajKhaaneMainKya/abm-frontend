"use client";

import { useState } from "react";
import { X } from "lucide-react";
import type { CustomKeyword } from "@/lib/api";

interface KeywordWeightsProps {
  value: CustomKeyword[];
  onChange: (next: CustomKeyword[]) => void;
}

const DEFAULT_WEIGHT = 0.1;

export default function KeywordWeights({ value, onChange }: KeywordWeightsProps) {
  const [draft, setDraft] = useState("");

  const add = () => {
    const keyword = draft.trim();
    const key = keyword.toLowerCase();
    if (!keyword || value.some((k) => k.keyword === key)) {
      setDraft("");
      return;
    }
    onChange([...value, { keyword: key, weight: DEFAULT_WEIGHT, label: keyword }]);
    setDraft("");
  };

  const remove = (keyword: string) => onChange(value.filter((k) => k.keyword !== keyword));

  const setWeight = (keyword: string, pct: number) =>
    onChange(value.map((k) => (k.keyword === keyword ? { ...k, weight: pct / 100 } : k)));

  return (
    <div>
      <div className="flex gap-2">
        <input
          className="input flex-1"
          placeholder="e.g. worked at a YC startup"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
        />
        <button type="button" onClick={add} disabled={!draft.trim()} className="btn btn-secondary">
          Add
        </button>
      </div>

      {value.length > 0 && (
        <div className="mt-3 space-y-2">
          {value.map((k) => {
            const pct = Math.round(k.weight * 100);
            return (
              <div
                key={k.keyword}
                className="flex items-center gap-3 rounded-md border border-[var(--border)] px-3 py-2"
              >
                <span className="flex-1 truncate text-[13px] font-medium text-[var(--foreground)]">
                  {k.label}
                </span>
                <input
                  type="range"
                  min={1}
                  max={30}
                  value={pct}
                  onChange={(e) => setWeight(k.keyword, Number(e.target.value))}
                  className="h-1.5 w-28 accent-[#7c3aed]"
                  aria-label={`Weight for ${k.label}`}
                />
                <span className="w-9 shrink-0 text-right text-[12px] font-semibold tabular-nums text-[var(--text-secondary)]">
                  {pct}%
                </span>
                <button
                  type="button"
                  onClick={() => remove(k.keyword)}
                  className="shrink-0 text-[var(--text-secondary)] hover:text-red-600"
                  aria-label={`Remove ${k.label}`}
                >
                  <X size={14} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
