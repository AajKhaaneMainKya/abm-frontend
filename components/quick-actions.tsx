"use client";

import { useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Play, RotateCw, Check, ChevronDown } from "lucide-react";
import { useClientList } from "@/components/client-select";
import { useActiveClient } from "@/components/active-client";
import { triggerOrchestrator } from "@/lib/api";

/** Persistent bar below the title bar — client picker + Trigger + Refresh, always visible. */
export function QuickActionsBar() {
  const { data: clients } = useClientList();
  const { activeClientId, setActiveClientId } = useActiveClient();
  const qc = useQueryClient();

  const effective = activeClientId ?? clients?.[0]?.id ?? "";
  const [flash, setFlash] = useState(false);
  const [busy, setBusy] = useState(false);

  const trigger = useCallback(async () => {
    if (!effective || busy) return;
    setBusy(true);
    try {
      await triggerOrchestrator(effective);
      setFlash(true);
      setTimeout(() => setFlash(false), 1500);
    } catch {
      /* surfaced elsewhere */
    } finally {
      setBusy(false);
    }
  }, [effective, busy]);

  const refresh = () => qc.invalidateQueries();

  return (
    <div className="flex items-center gap-2 border-b border-[#aca899] bg-[#ece9d8] px-3 py-1.5 shadow-sm">
      <span className="text-[12px] font-bold text-neutral-700">Client:</span>
      <span className="relative inline-block">
        <select
          value={effective}
          onChange={(e) => setActiveClientId(e.target.value)}
          className="xp-inset min-w-[160px] appearance-none rounded-sm py-1 pl-2 pr-7 text-[12px] text-neutral-800"
        >
          {(!clients || clients.length === 0) && <option value="">No clients</option>}
          {clients?.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <ChevronDown
          size={13}
          className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-neutral-600"
        />
      </span>

      <button
        type="button"
        onClick={trigger}
        disabled={!effective || busy}
        className={`xp-btn ${flash ? "xp-btn--green" : "xp-btn--primary"} inline-flex items-center gap-1 disabled:opacity-50`}
        title="Trigger orchestrator now"
      >
        {flash ? <Check size={13} /> : <Play size={13} />}
        {flash ? "Triggered" : busy ? "Triggering…" : "Trigger"}
      </button>

      <button
        type="button"
        onClick={refresh}
        className="xp-btn inline-flex items-center gap-1"
        title="Refresh data on the current page"
      >
        <RotateCw size={13} /> Refresh
      </button>
    </div>
  );
}

/** Floating action button — bottom-right above the taskbar. Trigger is always one click away. */
export function TriggerFab() {
  const { data: clients } = useClientList();
  const { activeClientId } = useActiveClient();
  const effective = activeClientId ?? clients?.[0]?.id ?? "";
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  const onClick = async () => {
    if (!effective || busy) return;
    setBusy(true);
    try {
      await triggerOrchestrator(effective);
      setDone(true);
      setTimeout(() => setDone(false), 3000);
    } catch {
      /* ignore */
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!effective || busy}
      title="Trigger orchestrator for the active client"
      className={`fixed bottom-12 right-5 z-40 grid h-14 w-14 place-items-center rounded-full border-2 text-white shadow-lg transition-transform active:scale-95 disabled:opacity-50 ${
        done
          ? "border-[#1d5c1d] bg-[#2d7a2d]"
          : "border-[#0a3d91] bg-gradient-to-b from-[#3a8dde] to-[#1b5dbf] hover:from-[#48a0f0]"
      }`}
    >
      {done ? <Check size={26} strokeWidth={3} /> : <Play size={26} strokeWidth={2.5} className="ml-0.5" />}
    </button>
  );
}
