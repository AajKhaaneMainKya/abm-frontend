"use client";

import { useQuery } from "@tanstack/react-query";
import { getClients, type ClientSummary } from "@/lib/api";
import { ChevronDown } from "lucide-react";

export function useClientList() {
  return useQuery({ queryKey: ["clients"], queryFn: getClients });
}

/** XP-style sunken <select> for choosing the active client. */
export function ClientSelect({
  clients,
  value,
  onChange,
}: {
  clients: ClientSummary[];
  value: string | null;
  onChange: (id: string) => void;
}) {
  return (
    <label className="relative inline-flex items-center">
      <span className="mr-2 text-[12px] font-bold text-white/90">Client:</span>
      <span className="relative inline-block">
        <select
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className="xp-inset appearance-none rounded-sm py-1 pl-2 pr-7 text-[12px] text-neutral-800"
        >
          {clients.length === 0 && <option value="">No clients</option>}
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <ChevronDown
          size={14}
          className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-neutral-600"
        />
      </span>
    </label>
  );
}
