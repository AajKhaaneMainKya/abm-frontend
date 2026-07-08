"use client";

import { useEffect, useState } from "react";
import { generateTelegramToken, getTelegramStatus, disconnectTelegram } from "@/lib/api";
import { Check, MessageCircle } from "lucide-react";

interface TelegramStatus {
  connected: boolean;
  chat_id?: string | null;
}

interface ConnectData {
  deep_link: string;
  instructions: string;
  token: string;
  bot_username: string;
}

export default function TelegramConnect() {
  const [status, setStatus] = useState<TelegramStatus>({ connected: false });
  const [connectData, setConnectData] = useState<ConnectData | null>(null);
  const [loading, setLoading] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    getTelegramStatus()
      .then(setStatus)
      .catch(() => {})
      .finally(() => setChecking(false));
  }, []);

  const handleConnect = async () => {
    setLoading(true);
    try {
      const data = await generateTelegramToken();
      setConnectData(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setDisconnecting(true);
    try {
      await disconnectTelegram();
      setStatus({ connected: false });
      setConnectData(null);
    } catch (e) {
      console.error(e);
    } finally {
      setDisconnecting(false);
    }
  };

  // Poll for connection after showing instructions
  useEffect(() => {
    if (!connectData) return;
    const interval = setInterval(async () => {
      try {
        const res = await getTelegramStatus();
        if (res.connected) {
          setStatus(res);
          setConnectData(null);
          clearInterval(interval);
        }
      } catch {
        // ignore transient poll failures
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [connectData]);

  if (checking) return null;

  if (status.connected) {
    return (
      <div className="flex items-center justify-between rounded-lg border border-[var(--success)]/30 bg-[var(--success)]/10 px-4 py-3.5">
        <div className="flex items-center gap-2.5">
          <Check size={18} className="text-[var(--success)]" />
          <div>
            <div className="text-[13px] font-semibold text-[var(--foreground)]">Telegram connected</div>
            <div className="text-[12px] text-[var(--text-secondary)]">Instant notifications via @SahayakHQBot</div>
          </div>
        </div>
        <button
          onClick={handleDisconnect}
          disabled={disconnecting}
          className="rounded-md border border-[var(--border)] px-3 py-1.5 text-[12px] text-[var(--text-secondary)] hover:text-[var(--foreground)]"
        >
          {disconnecting ? "..." : "Disconnect"}
        </button>
      </div>
    );
  }

  if (connectData) {
    return (
      <div className="card p-4">
        <div className="mb-1.5 text-[13px] font-semibold text-[var(--foreground)]">Connect Telegram</div>
        <p className="mb-3 text-[13px] text-[var(--text-secondary)]">
          Tap below to open Telegram and connect your account:
        </p>
        <a
          href={connectData.deep_link}
          target="_blank"
          rel="noopener noreferrer"
          className="mb-3 flex items-center justify-center gap-2 rounded-lg bg-[#229ED9] px-4 py-2.5 text-[14px] font-semibold text-white no-underline hover:opacity-90"
        >
          <MessageCircle size={16} /> Open @SahayakHQBot
        </a>
        <p className="text-center text-[12px] text-[var(--text-secondary)]">Waiting for connection…</p>
      </div>
    );
  }

  return (
    <div className="card flex items-center justify-between p-4">
      <div className="flex items-center gap-2.5">
        <MessageCircle size={18} className="text-[#229ED9]" />
        <div>
          <div className="text-[13px] font-semibold text-[var(--foreground)]">Connect Telegram</div>
          <div className="text-[12px] text-[var(--text-secondary)]">Get instant notifications on your phone</div>
        </div>
      </div>
      <button
        onClick={handleConnect}
        disabled={loading}
        className="rounded-md bg-[#229ED9] px-4 py-2 text-[13px] font-semibold text-white hover:opacity-90 disabled:opacity-60"
      >
        {loading ? "..." : "Connect →"}
      </button>
    </div>
  );
}
