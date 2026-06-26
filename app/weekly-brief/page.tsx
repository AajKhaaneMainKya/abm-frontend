"use client";

import { XpWindow } from "@/components/xp";
import WeeklyBriefApp from "@/components/apps/weekly-brief-app";

export default function WeeklyBriefPage() {
  return (
    <div className="mx-auto max-w-5xl">
      <XpWindow title="Weekly Intelligence Brief">
        <WeeklyBriefApp />
      </XpWindow>
    </div>
  );
}
