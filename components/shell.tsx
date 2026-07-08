"use client";

/**
 * App shell — modern SaaS layout:
 *  - fixed left sidebar (240px) with route-based navigation, chosen by the
 *    user's permanent DB-backed role (JOB_NAV / HIRING_NAV / ABM_NAV — see
 *    the explicit per-role baseNav below).
 *  - top bar (56px): page title, global client selector, Trigger Now, user menu
 *  - main content area (white, scrolls)
 *  - first-login role selector (see components/role-selector.tsx) — shown
 *    once, before user_role is set; offers all three roles.
 *  - mode switcher (bottom of sidebar) — admin-only (see isAdmin, sourced
 *    from /api/users/me's server-verified is_admin). Regular users' nav is
 *    permanently locked to their onboarding role with no switcher visible
 *    at all; admins get all three modes via ADMIN_ROLE_OPTIONS, including
 *    'abm', for testing/support.
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
  Play,
  Check,
  ChevronDown,
  LogOut,
  User,
  Users,
  Bell,
  Shield,
  type LucideIcon,
} from "lucide-react";
import DemoBanner from "@/components/demo-banner";
import OnboardingTour from "@/components/onboarding-tour";
import RoleSelector from "@/components/role-selector";
import PaywallModal from "@/components/paywall-modal";
import { useClientList } from "@/components/client-select";
import { useActiveClient } from "@/components/active-client";
import { triggerOrchestrator, getMe, setUserRole, type UserRole, type TrialStatus } from "@/lib/api";
import { paywallStore } from "@/lib/paywall-store";

// Auth/splash routes render bare — no app chrome.
const BARE_ROUTES = ["/welcome", "/waitlist", "/sign-in", "/sign-up", "/onboarding"];

// Regular users never see a mode switcher at all now — nav is locked to
// their onboarding role (see baseNav below). ROLE_OPTIONS is unused as of
// the isAdmin-gated switcher (ADMIN_ROLE_OPTIONS is what actually renders),
// kept only for reference / in case a non-admin switcher comes back.
const ROLE_OPTIONS = [
  { value: "candidate", label: "💼", title: "Job Search" },
  { value: "hiring_manager", label: "🔍", title: "Find Talent" },
] as const;

// Admin-only — the switcher itself is gated on isAdmin (server-verified via
// /api/users/me's is_admin, see Shell below), so only admins ever see this,
// and they get all three modes including ABM.
const ADMIN_ROLE_OPTIONS = [
  { value: "candidate", label: "💼", title: "Job Search" },
  { value: "hiring_manager", label: "🔍", title: "Find Talent" },
  { value: "abm", label: "🎯", title: "ABM" },
] as const;

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

// Minimal candidate nav — old pages (dashboard, companies, outreach queue,
// replies, mind map, actions) still exist, just unreachable from here now.
const JOB_NAV: NavItem[] = [
  { href: "/job-search/profile", label: "My Profile", icon: User },
  { href: "/job-search/matches", label: "My Matches", icon: Users },
  { href: "/job-search/notifications", label: "Notifications", icon: Bell },
];

const HIRING_NAV: NavItem[] = [
  { href: "/hiring/briefs", label: "Briefs", icon: FileText },
  { href: "/hiring/post", label: "Post a Brief", icon: UserPlus },
  { href: "/hiring/shortlist", label: "Shortlist", icon: Users },
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
  if (pathname === "/hiring/shortlist") return "Shortlist";
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

function TrialBanner({
  trialStatus,
  onUpgrade,
}: {
  trialStatus: TrialStatus | null;
  onUpgrade: () => void;
}) {
  const daysLeft = trialStatus?.days_remaining ?? 30;
  const isExpired = trialStatus?.expired ?? false;
  const isPro = trialStatus?.is_pro ?? false;

  if (isPro) return null;

  return (
    <div
      style={{
        margin: "0 12px 8px",
        padding: "10px 12px",
        background: isExpired ? "#fef2f2" : daysLeft <= 7 ? "#fffbeb" : "#f0fdfa",
        border: `1px solid ${isExpired ? "#fecaca" : daysLeft <= 7 ? "#fde68a" : "#99f6e4"}`,
        borderRadius: "8px",
      }}
    >
      <div
        style={{
          fontSize: "12px",
          fontWeight: "600",
          color: isExpired ? "#dc2626" : daysLeft <= 7 ? "#92400e" : "#0f766e",
          marginBottom: "4px",
        }}
      >
        {isExpired ? "⚠️ Trial expired" : daysLeft <= 7 ? `⚡ ${daysLeft} days left` : `✓ Trial — ${daysLeft} days left`}
      </div>
      <div
        style={{
          fontSize: "11px",
          color: "#6b7280",
          marginBottom: "8px",
        }}
      >
        {isExpired ? "Upgrade to continue using Sahayak" : "Free trial — no credit card needed"}
      </div>
      <button
        onClick={onUpgrade}
        style={{
          width: "100%",
          padding: "6px",
          background: isExpired ? "#dc2626" : "#0f766e",
          color: "#fff",
          border: "none",
          borderRadius: "6px",
          fontSize: "11px",
          fontWeight: "600",
          cursor: "pointer",
        }}
      >
        {isExpired ? "Upgrade now" : "View plans"}
      </button>
    </div>
  );
}

function Sidebar({
  pathname,
  nav,
  userRole,
  onSwitchRole,
  trialStatus,
  onUpgrade,
  isAdmin,
}: {
  pathname: string | null;
  nav: NavItem[];
  userRole: UserRole | null;
  onSwitchRole: (role: UserRole) => void;
  trialStatus: TrialStatus | null;
  onUpgrade: () => void;
  isAdmin: boolean;
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

      <TrialBanner trialStatus={trialStatus} onUpgrade={onUpgrade} />

      {/* Admin-only — regular users' nav is locked to their permanent
          DB-backed onboarding role with no way to change it here; admins
          can freely switch between all three modes (testing/support). */}
      {isAdmin && (
        <div className="border-t border-[var(--border)] px-3 py-3">
          <div className="mb-1.5 text-[11px] uppercase tracking-wide text-[var(--text-secondary)]">
            Switch mode
          </div>
          <div className="flex gap-1">
            {ADMIN_ROLE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => onSwitchRole(opt.value)}
                title={opt.title}
                className={`flex-1 rounded-md border py-1.5 text-[16px] transition-colors ${
                  userRole === opt.value
                    ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]"
                    : "border-[var(--border)] bg-transparent text-[var(--text-secondary)]"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

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
  const { isLoaded, isSignedIn, user } = useUser();
  const [userRole, setUserRoleState] = useState<UserRole | null>(null);
  const [roleLoading, setRoleLoading] = useState(true);
  const [trialStatus, setTrialStatus] = useState<TrialStatus | null>(null);
  // Server-verified via /api/users/me's is_admin (backend checks Clerk id
  // against ADMIN_CLERK_ID, a server-only env var) — replaces the old
  // client-side check against NEXT_PUBLIC_ADMIN_CLERK_ID, which was the only
  // other consumer of this value in the file.
  const [isAdmin, setIsAdmin] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [paywallReason, setPaywallReason] = useState("");

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    let cancelled = false;
    // Re-enter loading on every run, not just the first — otherwise
    // switching to a different Clerk account (user?.id below) would show
    // the previous account's stale role/nav for the duration of this fetch.
    setRoleLoading(true);
    getMe()
      .then((me) => {
        if (!cancelled) {
          setUserRoleState(me.user_role ?? null);
          setTrialStatus(me.trial_status ?? null);
          setIsAdmin(me.is_admin ?? false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setUserRoleState(null);
          setIsAdmin(false);
        }
      })
      .finally(() => {
        if (!cancelled) setRoleLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // user?.id: refetch when the logged-in Clerk account changes (account
    // switch), not just on initial load — getMe() was otherwise cached to
    // whichever user was signed in when this effect first ran.
  }, [isLoaded, isSignedIn, user?.id]);

  useEffect(() => {
    return paywallStore.subscribe((reason) => {
      setPaywallReason(reason);
      setShowPaywall(true);
    });
  }, []);

  const switchRole = async (newRole: UserRole) => {
    if (newRole === userRole) return;
    try {
      await setUserRole(newRole);
      // Update local state immediately — the window.location.assign below
      // is a full navigation anyway, but this avoids a stale-nav flash in
      // whatever render happens between the mutation resolving and the
      // browser actually leaving this page.
      setUserRoleState(newRole);
      // Full navigation (not just a reload) — nav already follows DB
      // user_role, but the current URL doesn't, so switching mode while
      // sitting on e.g. /hiring/briefs left that page showing under the
      // new role's nav until the URL itself moved to that role's dashboard.
      if (newRole === "hiring_manager") {
        window.location.assign("/hiring/briefs");
      } else if (newRole === "candidate") {
        window.location.assign("/job-search");
      } else if (newRole === "abm") {
        // Reachable now — admins get ABM in ADMIN_ROLE_OPTIONS. app/page.tsx
        // ('/') only renders the ABM dashboard for userRole === 'abm', so
        // this has to be '/', not '/job-search' like the old catch-all below.
        window.location.assign("/");
      } else {
        // UserRole is exhaustively covered by the three branches above;
        // this is unreachable but kept as a safe default.
        window.location.assign("/job-search");
      }
    } catch (e) {
      console.error("Role switch failed", e);
    }
  };

  // Explicit per role — 'abm' resolves to ABM_NAV (real ABM accounts exist
  // via the first-login RoleSelector and, for admins, ADMIN_ROLE_OPTIONS in
  // the switcher). null/loading (role not yet picked) falls back to JOB_NAV
  // as a neutral default until RoleSelector takes over.
  const baseNav =
    userRole === "candidate" ? JOB_NAV
    : userRole === "hiring_manager" ? HIRING_NAV
    : userRole === "abm" ? ABM_NAV
    : JOB_NAV;

  const nav = isAdmin ? [...baseNav, { href: "/admin", label: "Admin Console", icon: Shield }] : baseNav;

  // Bare (no app chrome): auth/splash routes and the full-screen launching page.
  if (BARE_ROUTES.some((p) => pathname?.startsWith(p)) || pathname?.endsWith("/launching")) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen flex-col">
      <DemoBanner mode={userRole === "candidate" ? "job_search" : "abm"} />
      <div className="flex min-h-0 flex-1">
        <Sidebar
          pathname={pathname}
          nav={nav}
          userRole={userRole}
          onSwitchRole={switchRole}
          trialStatus={trialStatus}
          onUpgrade={() => setShowPaywall(true)}
          isAdmin={isAdmin}
        />
        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar pathname={pathname} nav={nav} showClientSelector={userRole !== "candidate" && userRole !== "hiring_manager"} />
          <main className="sk-scroll min-h-0 flex-1 overflow-y-auto bg-white p-6">
            {children}
          </main>
        </div>
      </div>
      <OnboardingTour />
      {!roleLoading && !userRole && <RoleSelector />}
      <PaywallModal isOpen={showPaywall} onClose={() => setShowPaywall(false)} reason={paywallReason} />
    </div>
  );
}
