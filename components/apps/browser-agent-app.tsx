"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Monitor, Check, SkipForward, Send, Building2, ChevronDown } from "lucide-react";
import { useClientList } from "@/components/client-select";
import { getAccounts, startBrowse, browserWsUrl } from "@/lib/api";
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
  connecting: { label: "Connecting", color: "#2563eb" },
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

  // Pick the account to enrich. Component takes no props (rendered bare by the
  // route page and the desktop window-manager), so it self-selects a client.
  const { data: clients } = useClientList();
  const [pickedClient, setPickedClient] = useState<string>("");
  const activeClientId = pickedClient || clients?.[0]?.id || "";
  const { data: accounts } = useQuery({
    queryKey: ["accounts", activeClientId, "browseable"],
    queryFn: () => getAccounts(activeClientId, ["DISCOVERED", "ENRICHED"]),
    enabled: !!activeClientId,
  });
  const [accountId, setAccountId] = useState<string>("");
  const [starting, setStarting] = useState(false);

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
      ws = new WebSocket(browserWsUrl(sessionId));
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
        if (data.type === "screenshot") {
          setScreenshot(data.image);
          if (data.action) addLog(data.action);
        }
        if (data.type === "action") addLog(data.text);
        if (data.type === "found") { setFoundContact(data.contact); setStatus("found"); addLog("Decision maker found."); }
        if (data.type === "failed") { setStatus("failed"); addLog("Agent could not find a decision maker."); }
      } catch { /* ignore malformed frame */ }
    };
    ws.onerror = () => { setStatus("disconnected"); addLog("Connection error — no live browser session is available."); };
    ws.onclose = () => setStatus((s) => (s === "found" ? s : "disconnected"));

    return () => ws.close();
  }, [sessionId]);

  const start = async () => {
    if (!activeClientId || !accountId) return;
    setScreenshot(null);
    setFoundContact(null);
    setLog([]);
    setStarting(true);
    try {
      // Ask the backend to launch the run; it returns the real session_id the
      // Browser Agent publishes screenshots under.
      const { session_id } = await startBrowse(activeClientId, accountId);
      addLog("Browser enrichment requested — launching agent…");
      setSessionId(session_id);
    } catch {
      setStatus("failed");
      addLog("Could not start the browser session (API error).");
    } finally {
      setStarting(false);
    }
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
  const running = status === "connecting" || status === "searching";
  const accountList = accounts ?? [];

  return (
    <div className="grid h-full grid-cols-1 gap-3 p-4 lg:grid-cols-[3fr_2fr]">
      {/* Left — live screenshot */}
      <div className="card-flush">
        <div className="card-header">
          <Monitor size={14} /> Live Browser
        </div>
        {/* Account selector — pick a DISCOVERED / ENRICHED account to enrich. */}
        <div className="flex flex-wrap items-center gap-2 border-b border-[var(--border)] bg-[var(--surface)] px-3 py-2">
          {clients && clients.length > 1 && (
            <Picker value={activeClientId} onChange={setPickedClient} disabled={running}>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Picker>
          )}
          <Picker
            value={accountId}
            onChange={setAccountId}
            disabled={running || accountList.length === 0}
            minWidth={220}
          >
            <option value="">
              {accountList.length === 0
                ? "No DISCOVERED / ENRICHED accounts"
                : "Select an account…"}
            </option>
            {accountList.map((a) => (
              <option key={a.id} value={a.id}>
                {a.company} — {a.state}
                {a.domain ? ` (${a.domain})` : ""}
              </option>
            ))}
          </Picker>
          <XpButton
            className="!py-0.5 !text-[11px]"
            onClick={start}
            disabled={!accountId || running || starting}
          >
            {starting
              ? "Starting…"
              : status === "idle" || status === "disconnected"
                ? "Start session"
                : "Restart"}
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
        <div className="card-flush">
          <div className="flex items-center gap-2 border-b border-[var(--border)] px-4 py-2.5">
            <Building2 size={14} className="text-[var(--accent)]" />
            <span className="text-[13px] font-semibold text-[var(--foreground)]">
              {foundContact?.company ?? "Current account"}
            </span>
            <XpBadge color={meta.color} className="ml-auto uppercase">{meta.label}</XpBadge>
          </div>
          <div className="px-4 py-3 text-[12px]">
            {foundContact ? (
              <div className="space-y-0.5">
                <div className="font-semibold text-[var(--foreground)]">{foundContact.name ?? "—"}</div>
                <div className="text-[var(--text-secondary)]">{foundContact.title ?? ""}</div>
                {foundContact.linkedin_url && (
                  <a href={foundContact.linkedin_url} target="_blank" rel="noreferrer" className="text-[var(--accent)] underline">
                    {foundContact.linkedin_url}
                  </a>
                )}
              </div>
            ) : (
              <div className="text-[var(--text-secondary)]">Searching for a decision maker…</div>
            )}
          </div>
        </div>

        {/* Activity log */}
        <div className="card-flush flex min-h-[140px] flex-1 flex-col">
          <div className="card-header">Activity</div>
          <div ref={logRef} className="sk-scroll flex-1 overflow-y-auto bg-white px-3 py-2 font-mono text-[11px] leading-relaxed text-[var(--foreground)]">
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
            className="input flex-1"
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

/** XP-style sunken <select> (matches ClientSelect) for the toolbar pickers. */
function Picker({
  value,
  onChange,
  disabled,
  minWidth,
  children,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  minWidth?: number;
  children: React.ReactNode;
}) {
  return (
    <span className="relative inline-block">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        style={minWidth ? { minWidth } : undefined}
        className="select appearance-none py-1.5 pl-2 pr-7 text-[12px] disabled:opacity-60"
      >
        {children}
      </select>
      <ChevronDown
        size={14}
        className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]"
      />
    </span>
  );
}
