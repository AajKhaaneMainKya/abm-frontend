"use client";

/**
 * App shell — XP desktop chrome around every page:
 *  - left sidebar styled as an XP Start-menu panel
 *  - main content area on an XP desktop background
 *  - bottom taskbar with Start button, active-window pill, and a live clock
 */
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Inbox,
  ScrollText,
  UserPlus,
  Monitor,
  Cpu,
} from "lucide-react";

const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/queue", label: "Review Queue", icon: Inbox },
  { href: "/decisions", label: "Orchestrator Log", icon: ScrollText },
  { href: "/clients/new", label: "New Client", icon: UserPlus },
];

function pageTitle(pathname: string): string {
  if (pathname === "/") return "Dashboard";
  if (pathname.startsWith("/queue")) return "Review Queue";
  if (pathname.startsWith("/decisions")) return "Orchestrator Log";
  if (pathname.startsWith("/clients/new")) return "New Client Setup";
  if (pathname.startsWith("/clients/")) return "Client Workspace";
  return "ABM System";
}

function Clock() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000 * 30);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="xp-clock tabular-nums">
      {now
        ? now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        : "--:--"}
    </div>
  );
}

export default function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <div className="flex h-screen flex-col">
      {/* desktop = sidebar + content */}
      <div className="flex min-h-0 flex-1">
        {/* Sidebar (Start-menu style) */}
        <aside className="xp-sidebar hidden flex-col md:flex">
          <div className="xp-sidebar__header flex items-center gap-2">
            <Cpu size={18} />
            <div className="leading-tight">
              <div className="text-[14px]">ABM System</div>
              <div className="text-[10px] font-normal opacity-80">
                Account-Based Marketing
              </div>
            </div>
          </div>
          <nav className="flex-1 overflow-y-auto">
            {NAV.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={`xp-sidebar__item ${
                  isActive(href) ? "xp-sidebar__item--active" : ""
                }`}
              >
                <Icon size={16} />
                {label}
              </Link>
            ))}
          </nav>
          <div className="border-t border-[#dfe6f0] px-4 py-3 text-[10px] text-neutral-500">
            v1.0 · Agentic ABM
          </div>
        </aside>

        {/* Main content on XP desktop */}
        <main className="xp-desktop xp-scroll min-w-0 flex-1 overflow-y-auto p-4 md:p-6">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>

      {/* Taskbar */}
      <footer className="xp-taskbar">
        <Link href="/" className="xp-start">
          <Monitor size={16} />
          start
        </Link>
        <div className="xp-taskbar__item xp-taskbar__item--active">
          <Cpu size={13} />
          {pageTitle(pathname)}
        </div>
        <Clock />
      </footer>
    </div>
  );
}
