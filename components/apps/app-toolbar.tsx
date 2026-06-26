"use client";

import type { ReactNode } from "react";
import type { ClientSummary } from "@/lib/api";

/** Light-themed toolbar with a client picker, used at the top of windowed apps. */
export function AppToolbar({
  clients,
  value,
  onChange,
  right,
}: {
  clients: ClientSummary[];
  value: string | null;
  onChange: (id: string) => void;
  right?: ReactNode;
}) {
  return (
    <div className="xp-app-toolbar">
      <label className="flex items-center gap-2 text-[12px] font-bold text-neutral-700">
        Client:
        <select
          className="xp-app-select"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
        >
          {clients.length === 0 && <option value="">No clients</option>}
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>
      {right && <div className="ml-auto flex items-center gap-2">{right}</div>}
    </div>
  );
}
