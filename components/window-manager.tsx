"use client";

/**
 * Window manager — gives the ABM frontend real OS windowing:
 * draggable + resizable windows, minimize/maximize/close, z-order focus,
 * a taskbar (rendered by the shell) and a desktop (app/desktop.tsx).
 *
 * Global window state lives in React context so any component (desktop icon,
 * sidebar item, taskbar button) can open / focus / minimize / close windows.
 */
import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
  useLayoutEffect,
} from "react";
import type { ReactNode } from "react";
import {
  LayoutDashboard,
  Inbox,
  ScrollText,
  UserPlus,
  Users,
  Building2,
  type LucideIcon,
} from "lucide-react";
import { XpTitleBar } from "@/components/xp";
import DashboardApp from "@/components/apps/dashboard-app";
import QueueApp from "@/components/apps/queue-app";
import DecisionsApp from "@/components/apps/decisions-app";
import NewClientApp from "@/components/apps/new-client-app";
import HandoffsApp from "@/components/apps/handoffs-app";
import ClientDetailApp from "@/components/apps/client-detail-app";

export type AppId =
  | "dashboard"
  | "queue"
  | "decisions"
  | "new-client"
  | "handoffs"
  | "client";

export interface WinProps {
  clientId?: string;
  clientName?: string;
}

interface AppDef {
  title: string;
  icon: LucideIcon;
  size: { width: number; height: number };
  singleton: boolean;
  render: (props: WinProps) => ReactNode;
}

export const APPS: Record<AppId, AppDef> = {
  dashboard: { title: "Dashboard", icon: LayoutDashboard, size: { width: 900, height: 640 }, singleton: true, render: () => <DashboardApp /> },
  queue: { title: "Review Queue", icon: Inbox, size: { width: 940, height: 640 }, singleton: true, render: () => <QueueApp /> },
  decisions: { title: "Orchestrator Log", icon: ScrollText, size: { width: 900, height: 600 }, singleton: true, render: () => <DecisionsApp /> },
  "new-client": { title: "New Client Setup", icon: UserPlus, size: { width: 680, height: 640 }, singleton: true, render: () => <NewClientApp /> },
  handoffs: { title: "Handoffs", icon: Users, size: { width: 880, height: 600 }, singleton: true, render: () => <HandoffsApp /> },
  client: { title: "Client", icon: Building2, size: { width: 960, height: 680 }, singleton: false, render: (p) => <ClientDetailApp clientId={p.clientId!} /> },
};

/** Apps shown as desktop icons + sidebar items (order matters). */
export const DESKTOP_APPS: AppId[] = ["dashboard", "queue", "decisions", "new-client", "handoffs"];

export interface WinState {
  id: string;
  appId: AppId;
  title: string;
  props: WinProps;
  isMinimized: boolean;
  isMaximized: boolean;
  zIndex: number;
  position: { x: number; y: number };
  size: { width: number; height: number };
  prev?: { x: number; y: number; width: number; height: number };
  closing?: boolean;
}

interface Ctx {
  windows: WinState[];
  activeId: string | null;
  open: (appId: AppId, opts?: { props?: WinProps; title?: string }) => void;
  close: (id: string) => void;
  minimize: (id: string) => void;
  toggleMaximize: (id: string) => void;
  focus: (id: string) => void;
  taskbarClick: (id: string) => void;
  move: (id: string, pos: { x: number; y: number }) => void;
  resize: (id: string, size: { width: number; height: number }, pos?: { x: number; y: number }) => void;
}

const WMContext = createContext<Ctx | null>(null);

export function useWindowManager(): Ctx {
  const c = useContext(WMContext);
  if (!c) throw new Error("useWindowManager must be used within WindowManagerProvider");
  return c;
}

let counter = 0;

export function WindowManagerProvider({ children }: { children: ReactNode }) {
  const [windows, setWindows] = useState<WinState[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const zTop = useRef(10);
  // Mirror latest committed state in refs so discrete actions can read it
  // without nesting one setState inside another updater.
  const windowsRef = useRef<WinState[]>(windows);
  windowsRef.current = windows;
  const activeRef = useRef<string | null>(activeId);
  activeRef.current = activeId;

  const focus = useCallback((id: string) => {
    zTop.current += 1;
    const z = zTop.current;
    setWindows(windowsRef.current.map((w) => (w.id === id ? { ...w, zIndex: z, isMinimized: false } : w)));
    setActiveId(id);
  }, []);

  const open = useCallback((appId: AppId, opts?: { props?: WinProps; title?: string }) => {
    const def = APPS[appId];
    if (def.singleton) {
      const existing = windowsRef.current.find((w) => w.appId === appId);
      if (existing) {
        focus(existing.id);
        return;
      }
    }
    zTop.current += 1;
    counter += 1;
    const id = `${appId}-${counter}`;
    const offset = (windowsRef.current.length % 6) * 26;
    const next: WinState = {
      id,
      appId,
      title: opts?.title ?? def.title,
      props: opts?.props ?? {},
      isMinimized: false,
      isMaximized: false,
      zIndex: zTop.current,
      position: { x: 56 + offset, y: 36 + offset },
      size: { ...def.size },
    };
    setWindows([...windowsRef.current, next]);
    setActiveId(id);
  }, [focus]);

  const close = useCallback((id: string) => {
    setWindows(windowsRef.current.map((w) => (w.id === id ? { ...w, closing: true } : w)));
    if (activeRef.current === id) setActiveId(null);
    setTimeout(() => setWindows(windowsRef.current.filter((w) => w.id !== id)), 110);
  }, []);

  const minimize = useCallback((id: string) => {
    setWindows(windowsRef.current.map((w) => (w.id === id ? { ...w, isMinimized: true } : w)));
    if (activeRef.current === id) setActiveId(null);
  }, []);

  const toggleMaximize = useCallback((id: string) => {
    zTop.current += 1;
    const z = zTop.current;
    setWindows(
      windowsRef.current.map((w) => {
        if (w.id !== id) return w;
        if (w.isMaximized) {
          const p = w.prev;
          return {
            ...w,
            isMaximized: false,
            isMinimized: false,
            zIndex: z,
            position: p ? { x: p.x, y: p.y } : w.position,
            size: p ? { width: p.width, height: p.height } : w.size,
          };
        }
        return { ...w, isMaximized: true, isMinimized: false, zIndex: z, prev: { ...w.position, ...w.size } };
      }),
    );
    setActiveId(id);
  }, []);

  /** Taskbar button behaviour: minimize if active, else focus/restore. */
  const taskbarClick = useCallback((id: string) => {
    const w = windowsRef.current.find((x) => x.id === id);
    if (!w) return;
    if (!w.isMinimized && activeRef.current === id) {
      setWindows(windowsRef.current.map((x) => (x.id === id ? { ...x, isMinimized: true } : x)));
      setActiveId(null);
      return;
    }
    zTop.current += 1;
    const z = zTop.current;
    setWindows(windowsRef.current.map((x) => (x.id === id ? { ...x, isMinimized: false, zIndex: z } : x)));
    setActiveId(id);
  }, []);

  const move = useCallback((id: string, pos: { x: number; y: number }) => {
    setWindows((ws) => ws.map((w) => (w.id === id ? { ...w, position: pos } : w)));
  }, []);

  const resize = useCallback(
    (id: string, size: { width: number; height: number }, pos?: { x: number; y: number }) => {
      setWindows((ws) => ws.map((w) => (w.id === id ? { ...w, size, position: pos ?? w.position } : w)));
    },
    [],
  );

  return (
    <WMContext.Provider
      value={{ windows, activeId, open, close, minimize, toggleMaximize, focus, taskbarClick, move, resize }}
    >
      {children}
    </WMContext.Provider>
  );
}

/* ============================================================
   Rendering
   ============================================================ */

const MIN_W = 360;
const MIN_H = 220;
const RESIZE_DIRS = ["n", "s", "e", "w", "ne", "nw", "se", "sw"] as const;

export function WindowLayer() {
  const { windows } = useWindowManager();
  const ref = useRef<HTMLDivElement>(null);
  const [bounds, setBounds] = useState({ w: 0, h: 0 });

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setBounds({ w: el.clientWidth, h: el.clientHeight });
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={ref} className="absolute inset-0 overflow-hidden" style={{ pointerEvents: "none" }}>
      {windows.map((w) => (
        <WindowFrame key={w.id} win={w} bounds={bounds} />
      ))}
    </div>
  );
}

function WindowFrame({ win, bounds }: { win: WinState; bounds: { w: number; h: number } }) {
  const { activeId, focus, close, minimize, toggleMaximize, move, resize } = useWindowManager();
  const active = activeId === win.id;
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const r = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(r);
  }, []);

  const def = APPS[win.appId];
  const Icon = def.icon;

  const rect = win.isMaximized
    ? { x: 0, y: 0, width: bounds.w, height: bounds.h }
    : { x: win.position.x, y: win.position.y, width: win.size.width, height: win.size.height };

  // ---- drag (pointer events; works on touch) ----
  const onTitlePointerDown = (e: React.PointerEvent) => {
    if (win.isMaximized) return;
    focus(win.id);
    const startX = e.clientX;
    const startY = e.clientY;
    const ox = win.position.x;
    const oy = win.position.y;
    const w = win.size.width;
    const onMove = (ev: PointerEvent) => {
      let x = ox + (ev.clientX - startX);
      let y = oy + (ev.clientY - startY);
      x = Math.max(-(w - 90), Math.min(x, bounds.w - 60));
      y = Math.max(0, Math.min(y, bounds.h - 30));
      move(win.id, { x, y });
    };
    const onUp = () => {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
    };
    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onUp);
  };

  // ---- resize ----
  const startResize = (dir: string) => (e: React.PointerEvent) => {
    e.stopPropagation();
    if (win.isMaximized) return;
    focus(win.id);
    const startX = e.clientX;
    const startY = e.clientY;
    const o = { x: win.position.x, y: win.position.y, w: win.size.width, h: win.size.height };
    const onMove = (ev: PointerEvent) => {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      let { x, y, w, h } = o;
      if (dir.includes("e")) w = Math.max(MIN_W, o.w + dx);
      if (dir.includes("s")) h = Math.max(MIN_H, o.h + dy);
      if (dir.includes("w")) {
        w = Math.max(MIN_W, o.w - dx);
        x = o.x + (o.w - w);
      }
      if (dir.includes("n")) {
        h = Math.max(MIN_H, o.h - dy);
        y = o.y + (o.h - h);
      }
      resize(win.id, { width: w, height: h }, { x, y });
    };
    const onUp = () => {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
    };
    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onUp);
  };

  const hidden = win.isMinimized;
  const transform = hidden
    ? "scale(0.18) translateY(60vh)"
    : entered && !win.closing
      ? "scale(1)"
      : "scale(0.92)";
  const opacity = hidden || !entered || win.closing ? 0 : 1;

  return (
    <div
      className={`xp-os-window ${active ? "xp-os-window--active" : "xp-os-window--inactive"}`}
      style={{
        left: rect.x,
        top: rect.y,
        width: rect.width,
        height: rect.height,
        zIndex: win.zIndex,
        transform,
        opacity,
        pointerEvents: hidden ? "none" : "auto",
        transformOrigin: "left bottom",
      }}
      onPointerDown={() => {
        if (!active) focus(win.id);
      }}
    >
      <XpTitleBar
        title={win.title}
        icon={<Icon size={14} className="text-white" />}
        active={active}
        isMaximized={win.isMaximized}
        onMinimize={() => minimize(win.id)}
        onMaximize={() => toggleMaximize(win.id)}
        onClose={() => close(win.id)}
        onPointerDown={onTitlePointerDown}
        onDoubleClick={() => toggleMaximize(win.id)}
      />
      <div className="xp-os-window__body xp-scroll">{def.render(win.props)}</div>

      {!win.isMaximized &&
        RESIZE_DIRS.map((d) => (
          <div key={d} className={`xp-resize xp-resize--${d}`} onPointerDown={startResize(d)} />
        ))}
    </div>
  );
}
