"use client";

import { XpWindow } from "@/components/xp";
import BrowserAgentApp from "@/components/apps/browser-agent-app";

export default function BrowserAgentPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <XpWindow title="Browser Agent — Live Enrichment" bodyStyle={{ height: "78vh" }}>
        <BrowserAgentApp />
      </XpWindow>
    </div>
  );
}
