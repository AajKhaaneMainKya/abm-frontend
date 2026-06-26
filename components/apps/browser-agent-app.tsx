"use client";

import { useEffect, useRef, useState } from "react";
import { Monitor, Check, SkipForward, Send, Building2 } from "lucide-react";
import { API_HOST } from "@/lib/api";
import { XpButton, XpBadge } from "@/components/xp";

type Status = "idle" | "connecting" | "searching" | "found" | "failed" | "disconnected";

interface FoundContact {
  name?: string;
  title?: string;
  company?: string;
  linkedin_url?: string;
}

const STATUS_META: Record<Status, { label: string; color: string }> = {
  idle: { label: "Idle", color: "#777" },
  connecting: { label: "Connecting", color: "#1b5dbf" },
  searching: { label: "Searching", color: "#c8a020" },
  found: { label: "Found", color: "#2d7a2d" },
  failed: { label: "Failed", color: "#a02020" },
  disconnected: { label: "No session", color: "#777" },
};

export default function BrowserAgentApp() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [log, setLog] = useState<string[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [foundContact, setFoundContact] = useState<FoundContact | null>(null);
  const [instruction, setInstruction] = useState("");
  const wsRef = useRef<WebSocket | null>(null);
  const logRef = useRef<HTMLDivElement>(null);

  const addLog = (t: string) => setLog((p) => [...p, t]);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [log]);

  useEffect(() => {
    if (!sessionId) return;
    setStatus("connecting");
    addLog("Connecting to browser session…");
    let ws: WebSocket;
    try {
      ws = new WebSocket(`wss://${API_HOST}/ws/browser/${sessionId}`);
    } catch {
      setStatus("disconnected");
      addLog("Could not open a WebSocket connection.");
      return;
    }
    wsRef.current = ws;

    ws.onopen = () => { setStatus("searching"); addLog("Connected — browser agent starting…"); };
    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type === "screenshot") setScreenshot(data.image);
        if (data.type === "action") addLog(data.text);
        if (data.type === "found") { setFoundContact(data.contact); setStatus("found"); addLog("Decision maker found."); }
        if (data.type === "failed") { setStatus("failed"); addLog("Agent could not find a decision maker."); }
      } catch { /* ignore malformed frame */ }
    };
    ws.onerror = () => { setStatus("disconnected"); addLog("Connection error — no live browser session is available."); };
    ws.onclose = () => setStatus((s) => (s === "found" ? s : "disconnected"));

    return () => ws.close();
  }, [sessionId]);

  const start = () => {
    setScreenshot(null);
    setFoundContact(null);
    setLog([]);
    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `sess-${Date.now()}`;
    setSessionId(id);
  };

  const sendInstruction = () => {
    const t = instruction.trim();
    if (!t) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(t);
      addLog(`You: ${t}`);
    } else {
      addLog(`(not connected) ${t}`);
    }
    setInstruction("");
  };

  const closeSession = (reason: string) => {
    addLog(reason);
    wsRef.current?.close();
    setStatus("idle");
    setSessionId(null);
  };

  const meta = STATUS_META[status];

  return (
    <div className="grid h-full grid-cols-1 gap-3 p-4 lg:grid-cols-[3fr_2fr]">
      {/* Left — live screenshot */}
      <div className="xp-window !rounded-md">
        <div className="flex items-center gap-2 bg-[#d4d0c8] px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-[#0a246a]">
          <Monitor size={13} /> Live Browser
          <XpButton className="ml-auto !py-0.5 !text-[11px]" onClick={start}>
            {status === "idle" || status === "disconnected" ? "Start session" : "Restart"}
          </XpButton>
        </div>
        <div className="grid min-h-[320px] place-items-center bg-[#1d1d1d] p-2">
          {screenshot ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={`data:image/jpeg;base64,${screenshot}`} alt="browser" className="max-h-full max-w-full" />
          ) : (
            <div className="text-center text-[12px] text-neutral-400">
              <Monitor size={40} className="mx-auto mb-2 opacity-40" />
              {status === "connecting" || status === "searching"
                ? "Waiting for first frame…"
                : "No active session. Click “Start session” to launch the browser agent."}
            </div>
          )}
        </div>
      </div>

      {/* Right — controls */}
      <div className="flex flex-col gap-3">
        <div className="xp-window !rounded-md">
          <div className="flex items-center gap-2 bg-[#d4d0c8] px-3 py-1.5">
            <Building2 size={13} className="text-[#0a246a]" />
            <span className="text-[12px] font-bold text-[#0a246a]">
              {foundContact?.company ?? "Current account"}
            </span>
            <XpBadge color={meta.color} className="ml-auto uppercase">{meta.label}</XpBadge>
          </div>
          <div className="bg-white px-4 py-3 text-[12px]">
            {foundContact ? (
              <div className="space-y-0.5">
                <div className="font-bold text-neutral-800">{foundContact.name ?? "—"}</div>
                <div className="text-neutral-500">{foundContact.title ?? ""}</div>
                {foundContact.linkedin_url && (
                  <a href={foundContact.linkedin_url} target="_blank" rel="noreferrer" className="text-[#1b5dbf] underline">
                    {foundContact.linkedin_url}
                  </a>
                )}
              </div>
            ) : (
              <div className="text-neutral-400">Searching for a decision maker…</div>
            )}
          </div>
        </div>

        {/* Activity log */}
        <div className="xp-window !rounded-md flex min-h-[140px] flex-1 flex-col">
          <div className="bg-[#d4d0c8] px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-[#0a246a]">Activity</div>
          <div ref={logRef} className="xp-scroll flex-1 overflow-y-auto bg-white px-3 py-2 font-mono text-[11px] leading-relaxed text-neutral-700">
            {log.length === 0 ? (
              <div className="text-neutral-400">No activity yet.</div>
            ) : (
              log.map((l, i) => <div key={i}>· {l}</div>)
            )}
          </div>
        </div>

        {/* Instruction input */}
        <div className="flex gap-1.5">
          <input
            className="flex-1 xp-inset rounded-sm bg-white px-2 py-1.5 text-[12px] outline-none focus:ring-1 focus:ring-[#316ac5]"
            placeholder="Type to redirect… e.g. 'Try the team page'"
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") sendInstruction(); }}
          />
          <XpButton onClick={sendInstruction}><Send size={13} /></XpButton>
        </div>

        {/* Accept / Skip */}
        <div className="flex gap-2">
          <XpButton variant="green" className="flex-1" disabled={!foundContact} onClick={() => closeSession("✓ Contact accepted.")}>
            <span className="inline-flex items-center justify-center gap-1"><Check size={13} /> Accept Contact</span>
          </XpButton>
          <XpButton className="flex-1" onClick={() => closeSession("Skipped — falling back to email guessing.")}>
            <span className="inline-flex items-center justify-center gap-1"><SkipForward size={13} /> Skip — guess email</span>
          </XpButton>
        </div>
      </div>
    </div>
  );
}
