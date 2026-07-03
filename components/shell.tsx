"use client";

/**
 * App shell — modern SaaS layout:
 *  - fixed left sidebar (240px) with route-based navigation
 *  - top bar (56px): page title, global client selector, Trigger Now, user menu
 *  - main content area (white, scrolls)
 */
import { useCallback, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton, useUser, useClerk } from "@clerk/nextjs";
import {
  LayoutDashboard,
  Building2,
  Inbox,
  ScrollText,
  FileText,
  Globe,
  UserPlus,
  Play,
  Check,
  ChevronDown,
  LogOut,
  type LucideIcon,
} from "lucide-react";
import DemoBanner from "@/components/demo-banner";
import OnboardingTour from "@/components/onboarding-tour";
import { useClientList } from "@/components/client-select";
import { useActiveClient } from "@/components/active-client";
import { triggerOrchestrator } from "@/lib/api";

// Auth/splash routes render bare — no app chrome.
const BARE_ROUTES = ["/welcome", "/sign-in", "/sign-up", "/onboarding"];

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  tour?: string;
}

const NAV: NavItem[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/clients", label: "Clients", icon: Building2 },
  { href: "/queue", label: "Queue", icon: Inbox, tour: "nav-queue" },
  { href: "/decisions", label: "Decisions", icon: ScrollText },
  { href: "/weekly-brief", label: "Weekly Brief", icon: FileText },
  { href: "/browser-agent", label: "Browser Agent", icon: Globe },
  { href: "/clients/new", label: "New Client", icon: UserPlus, tour: "nav-new-client" },
];

function isActive(pathname: string | null, href: string): boolean {
  if (!pathname) return false;
  if (href === "/") return pathname === "/";
  if (href === "/clients") return pathname === "/clients" || (pathname.startsWith("/clients/") && pathname !== "/clients/new");
  return pathname === href || pathname.startsWith(`${href}/`);
}

function pageTitle(pathname: string | null): string {
  if (!pathname) return "Sahayak";
  if (pathname === "/") return "Dashboard";
  if (pathname === "/clients/new") return "New Client";
  if (pathname === "/clients") return "Clients";
  if (pathname.startsWith("/clients/") && pathname.endsWith("/edit")) return "Edit Client";
  if (pathname.startsWith("/clients/")) return "Client";
  const match = NAV.find((n) => n.href !== "/" && pathname.startsWith(n.href));
  return match?.label ?? "Sahayak";
}

function Logo() {
  return (
    <div className="flex items-center gap-2.5 px-3 py-4">
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-[var(--accent)] text-[15px] font-bold text-white">
        S
      </span>
      <span className="text-[16px] font-semibold tracking-tight text-[var(--foreground)]">
        Sahayak
      </span>
    </div>
  );
}

function Sidebar({ pathname }: { pathname: string | null }) {
  const { user } = useUser();
  const { signOut } = useClerk();
  const name = user?.fullName || user?.firstName || user?.primaryEmailAddress?.emailAddress || "Account";

  return (
    <aside className="sk-sidebar hidden md:flex">
      <Logo />
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
        {NAV.map(({ href, label, icon: Icon, tour }) => (
          <Link
            key={href}
            href={href}
            data-tour={tour}
            className={`nav-item ${isActive(pathname, href) ? "nav-item--active" : ""}`}
          >
            <Icon size={18} strokeWidth={2} />
            {label}
          </Link>
        ))}
      </nav>
      <div className="flex items-center gap-2.5 border-t border-[var(--border)] px-3 py-3">
        <UserButton appearance={{ elements: { avatarBox: "h-8 w-8" } }} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13px] font-medium text-[var(--foreground)]">{name}</div>
          <button
            type="button"
            onClick={() => signOut({ redirectUrl: "/welcome" })}
            className="inline-flex items-center gap-1 text-[11px] text-[var(--text-secondary)] hover:text-[var(--foreground)]"
          >
            <LogOut size={11} /> Sign out
          </button>
        </div>
      </div>
    </aside>
  );
}

function ClientSelector() {
  const { data: clients } = useClientList();
  const { activeClientId, setActiveClientId } = useActiveClient();
  const effective = activeClientId ?? clients?.[0]?.id ?? "";

  if (!clients || clients.length === 0) return null;

  return (
    <div className="relative">
      <select
        value={effective}
        onChange={(e) => setActiveClientId(e.target.value)}
        className="select min-w-[180px] appearance-none pr-8"
        aria-label="Active client"
      >
        {clients.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
      <ChevronDown
        size={15}
        className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]"
      />
    </div>
  );
}

function TriggerNowButton() {
  const { data: clients } = useClientList();
  const { activeClientId } = useActiveClient();
  const effective = activeClientId ?? clients?.[0]?.id ?? "";
  const [flash, setFlash] = useState(false);
  const [busy, setBusy] = useState(false);

  const trigger = useCallback(async () => {
    if (!effective || busy) return;
    setBusy(true);
    try {
      await triggerOrchestrator(effective);
      setFlash(true);
      setTimeout(() => setFlash(false), 1800);
    } catch {
      /* surfaced on the page */
    } finally {
      setBusy(false);
    }
  }, [effective, busy]);

  return (
    <button
      type="button"
      onClick={trigger}
      disabled={!effective || busy}
      data-tour="trigger-now"
      className={`btn ${flash ? "btn-success" : "btn-primary"}`}
      title="Trigger the orchestrator for the active client"
    >
      {flash ? <Check size={15} /> : <Play size={15} />}
      {flash ? "Triggered" : busy ? "Triggering…" : "Trigger Now"}
    </button>
  );
}

function TopBar({ pathname }: { pathname: string | null }) {
  return (
    <header className="flex h-14 shrink-0 items-center gap-4 border-b border-[var(--border)] bg-white px-6">
      <h1 className="text-[15px] font-semibold text-[var(--foreground)]">{pageTitle(pathname)}</h1>
      <div className="flex flex-1 justify-center">
        <ClientSelector />
      </div>
      <TriggerNowButton />
      <div className="md:hidden">
        <UserButton appearance={{ elements: { avatarBox: "h-7 w-7" } }} />
      </div>
    </header>
  );
}

export default function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (BARE_ROUTES.some((p) => pathname?.startsWith(p))) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen flex-col">
      <DemoBanner />
      <div className="flex min-h-0 flex-1">
        <Sidebar pathname={pathname} />
        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar pathname={pathname} />
          <main className="sk-scroll min-h-0 flex-1 overflow-y-auto bg-white p-6">
            {children}
          </main>
        </div>
      </div>
      <OnboardingTour />
    </div>
  );
}
