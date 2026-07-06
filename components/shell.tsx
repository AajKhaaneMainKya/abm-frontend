"use client";

/**
 * App shell — modern SaaS layout:
 *  - fixed left sidebar (240px) with route-based navigation (ABM, Job Search,
 *    or Hiring Manager, chosen by the user's permanent DB-backed role)
 *  - top bar (56px): page title, global client selector, Trigger Now, user menu
 *  - main content area (white, scrolls)
 *  - first-login role selector (see components/role-selector.tsx) — shown
 *    once, before user_role is set; never a switchable preference after that
 */
import { useCallback, useEffect, useState } from "react";
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
  MessageSquare,
  Network,
  CheckSquare,
  Play,
  Check,
  ChevronDown,
  LogOut,
  User,
  type LucideIcon,
} from "lucide-react";
import DemoBanner from "@/components/demo-banner";
import OnboardingTour from "@/components/onboarding-tour";
import RoleSelector from "@/components/role-selector";
import { useClientList } from "@/components/client-select";
import { useActiveClient } from "@/components/active-client";
import { triggerOrchestrator, getMe, type UserRole } from "@/lib/api";

// Auth/splash routes render bare — no app chrome.
const BARE_ROUTES = ["/welcome", "/sign-in", "/sign-up", "/onboarding"];

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  tour?: string;
}

const ABM_NAV: NavItem[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/clients", label: "Clients", icon: Building2 },
  { href: "/queue", label: "Queue", icon: Inbox, tour: "nav-queue" },
  { href: "/decisions", label: "Decisions", icon: ScrollText },
  { href: "/weekly-brief", label: "Weekly Brief", icon: FileText },
  { href: "/browser-agent", label: "Browser Agent", icon: Globe },
  { href: "/clients/new", label: "New Client", icon: UserPlus, tour: "nav-new-client" },
];

const JOB_NAV: NavItem[] = [
  { href: "/job-search", label: "Dashboard", icon: LayoutDashboard },
  { href: "/job-search/companies", label: "Companies", icon: Building2 },
  { href: "/job-search/queue", label: "Outreach Queue", icon: Inbox },
  { href: "/job-search/replies", label: "Replies", icon: MessageSquare },
  { href: "/job-search/graph", label: "Mind Map", icon: Network },
  { href: "/job-search/actions", label: "Actions", icon: CheckSquare },
  { href: "/job-search/profile", label: "My Profile", icon: User },
];

const HIRING_NAV: NavItem[] = [
  { href: "/hiring", label: "Dashboard", icon: LayoutDashboard },
];

/** The single best-matching nav href for the current path (longest wins). */
function bestMatch(pathname: string | null, nav: NavItem[]): string | null {
  if (!pathname) return null;
  let best: string | null = null;
  for (const { href } of nav) {
    const hit = href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
    if (hit && (best === null || href.length > best.length)) best = href;
  }
  return best;
}

function pageTitle(pathname: string | null, nav: NavItem[]): string {
  if (!pathname) return "Sahayak";
  // Friendly titles for ABM client detail/edit (no dedicated nav entries).
  if (pathname === "/clients/new") return "New Client";
  if (pathname.startsWith("/clients/") && pathname.endsWith("/edit")) return "Edit Client";
  if (pathname.startsWith("/clients/") && pathname !== "/clients") return "Client";
  const best = bestMatch(pathname, nav);
  return nav.find((n) => n.href === best)?.label ?? "Sahayak";
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

function Sidebar({
  pathname,
  nav,
}: {
  pathname: string | null;
  nav: NavItem[];
}) {
  const { user } = useUser();
  const { signOut } = useClerk();
  const name = user?.fullName || user?.firstName || user?.primaryEmailAddress?.emailAddress || "Account";
  const active = bestMatch(pathname, nav);

  return (
    <aside className="sk-sidebar hidden md:flex">
      <Logo />
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
        {nav.map(({ href, label, icon: Icon, tour }) => (
          <Link
            key={href}
            href={href}
            data-tour={tour}
            className={`nav-item ${href === active ? "nav-item--active" : ""}`}
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

function TopBar({
  pathname,
  nav,
  showClientSelector,
}: {
  pathname: string | null;
  nav: NavItem[];
  showClientSelector: boolean;
}) {
  return (
    <header className="flex h-14 shrink-0 items-center gap-4 border-b border-[var(--border)] bg-white px-6">
      <h1 className="text-[15px] font-semibold text-[var(--foreground)]">{pageTitle(pathname, nav)}</h1>
      <div className="flex flex-1 justify-center">
        {/* Client selector is ABM-only — job search and hiring have no per-client concept. */}
        {showClientSelector && <ClientSelector />}
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
  const { isLoaded, isSignedIn } = useUser();
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [roleLoading, setRoleLoading] = useState(true);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    let cancelled = false;
    getMe()
      .then((me) => {
        if (!cancelled) setUserRole(me.user_role ?? null);
      })
      .catch(() => {
        if (!cancelled) setUserRole(null);
      })
      .finally(() => {
        if (!cancelled) setRoleLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn]);

  const nav =
    userRole === "candidate" ? JOB_NAV
    : userRole === "hiring_manager" ? HIRING_NAV
    : ABM_NAV; // default for 'abm' and null (role not yet set)

  // Bare (no app chrome): auth/splash routes and the full-screen launching page.
  if (BARE_ROUTES.some((p) => pathname?.startsWith(p)) || pathname?.endsWith("/launching")) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen flex-col">
      <DemoBanner mode={userRole === "candidate" ? "job_search" : "abm"} />
      <div className="flex min-h-0 flex-1">
        <Sidebar pathname={pathname} nav={nav} />
        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar pathname={pathname} nav={nav} showClientSelector={userRole !== "candidate" && userRole !== "hiring_manager"} />
          <main className="sk-scroll min-h-0 flex-1 overflow-y-auto bg-white p-6">
            {children}
          </main>
        </div>
      </div>
      <OnboardingTour />
      {!roleLoading && !userRole && (
        <RoleSelector onComplete={() => window.location.reload()} />
      )}
    </div>
  );
}
