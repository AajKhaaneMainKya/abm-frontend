"use client";

/**
 * App shell — the OS chrome around the windowed desktop:
 *  - left sidebar (Start-menu style) opens app windows
 *  - main area = XP desktop (icons) with the live WindowLayer on top
 *  - bottom taskbar shows every open window; click to focus / minimize
 */
import { useEffect, useState } from "react";
import { Monitor, Cpu } from "lucide-react";
import {
  useWindowManager,
  WindowLayer,
  APPS,
  DESKTOP_APPS,
} from "@/components/window-manager";

function Clock() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000 * 30);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="xp-clock tabular-nums">
      {now ? now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "--:--"}
    </div>
  );
}

export default function Shell({ children }: { children: React.ReactNode }) {
  const wm = useWindowManager();
  const open = wm.windows.filter((w) => !w.closing);

  return (
    <div className="flex h-screen flex-col">
      <div className="relative flex min-h-0 flex-1">
        {/* Sidebar (Start-menu style) — items open windows */}
        <aside className="xp-sidebar z-20 hidden flex-col md:flex">
          <div className="xp-sidebar__header flex items-center gap-2">
            <Cpu size={18} />
            <div className="leading-tight">
              <div className="text-[14px]">ABM System</div>
              <div className="text-[10px] font-normal opacity-80">Account-Based Marketing</div>
            </div>
          </div>
          <nav className="flex-1 overflow-y-auto">
            {DESKTOP_APPS.map((id) => {
              const def = APPS[id];
              const Icon = def.icon;
              const isOpen = open.some((w) => w.appId === id && !w.isMinimized);
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => wm.open(id)}
                  className={`xp-sidebar__item w-full text-left ${isOpen ? "xp-sidebar__item--active" : ""}`}
                >
                  <Icon size={16} />
                  {def.title}
                </button>
              );
            })}
          </nav>
          <div className="border-t border-[#dfe6f0] px-4 py-3 text-[10px] text-neutral-500">
            v1.0 · Agentic ABM
          </div>
        </aside>

        {/* Desktop (icons) + windows */}
        <main className="xp-desktop relative min-w-0 flex-1 overflow-hidden">
          {children}
          <WindowLayer />
        </main>
      </div>

      {/* Taskbar */}
      <footer className="xp-taskbar z-30">
        <button type="button" className="xp-start" onClick={() => wm.open("dashboard")}>
          <Monitor size={16} />
          start
        </button>
        <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto">
          {open.map((w) => {
            const Icon = APPS[w.appId].icon;
            const active = wm.activeId === w.id && !w.isMinimized;
            return (
              <button
                key={w.id}
                type="button"
                onClick={() => wm.taskbarClick(w.id)}
                className={`xp-taskbar__item ${active ? "xp-taskbar__item--active" : ""} ${
                  w.isMinimized ? "opacity-75" : ""
                }`}
                title={w.title}
              >
                <Icon size={13} />
                <span className="max-w-[150px] truncate">{w.title}</span>
              </button>
            );
          })}
        </div>
        <Clock />
      </footer>
    </div>
  );
}
