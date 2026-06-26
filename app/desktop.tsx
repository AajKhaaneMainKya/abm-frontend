"use client";

import { useRef, useState } from "react";
import { APPS, DESKTOP_APPS, useWindowManager, type AppId } from "@/components/window-manager";

type Pos = { x: number; y: number };

function initialPositions(): Record<string, Pos> {
  const out: Record<string, Pos> = {};
  DESKTOP_APPS.forEach((id, i) => {
    out[id] = { x: 24, y: 24 + i * 96 };
  });
  return out;
}

export default function Desktop() {
  const wm = useWindowManager();
  const ref = useRef<HTMLDivElement>(null);
  const [positions, setPositions] = useState<Record<string, Pos>>(initialPositions);
  const [selected, setSelected] = useState<AppId | null>(null);
  const [menu, setMenu] = useState<{ appId: AppId; x: number; y: number } | null>(null);

  const rel = (clientX: number, clientY: number): Pos => {
    const r = ref.current?.getBoundingClientRect();
    return { x: clientX - (r?.left ?? 0), y: clientY - (r?.top ?? 0) };
  };

  const startDrag = (appId: AppId, e: React.PointerEvent) => {
    e.stopPropagation();
    setSelected(appId);
    setMenu(null);
    const startX = e.clientX;
    const startY = e.clientY;
    const o = positions[appId];
    const onMove = (ev: PointerEvent) => {
      setPositions((p) => ({
        ...p,
        [appId]: { x: Math.max(0, o.x + (ev.clientX - startX)), y: Math.max(0, o.y + (ev.clientY - startY)) },
      }));
    };
    const onUp = () => {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
    };
    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onUp);
  };

  return (
    <div
      ref={ref}
      className="absolute inset-0"
      onPointerDown={() => {
        setSelected(null);
        setMenu(null);
      }}
    >
      {DESKTOP_APPS.map((appId) => {
        const def = APPS[appId];
        const Icon = def.icon;
        const pos = positions[appId];
        return (
          <button
            key={appId}
            type="button"
            className={`xp-desktop-icon ${selected === appId ? "xp-desktop-icon--selected" : ""}`}
            style={{ left: pos.x, top: pos.y }}
            onPointerDown={(e) => startDrag(appId, e)}
            onClick={(e) => {
              e.stopPropagation();
              setSelected(appId);
            }}
            onDoubleClick={() => wm.open(appId)}
            onContextMenu={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setSelected(appId);
              const p = rel(e.clientX, e.clientY);
              setMenu({ appId, x: p.x, y: p.y });
            }}
          >
            <span className="xp-desktop-icon__glyph">
              <Icon size={30} />
            </span>
            <span className="xp-desktop-icon__label">{def.title}</span>
          </button>
        );
      })}

      {menu && (
        <div
          className="xp-context-menu"
          style={{ left: menu.x, top: menu.y }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            className="xp-context-menu__item"
            onClick={() => {
              wm.open(menu.appId);
              setMenu(null);
            }}
          >
            Open
          </button>
          <button type="button" className="xp-context-menu__item" onClick={() => setMenu(null)}>
            Rename
          </button>
        </div>
      )}

      <div className="pointer-events-none absolute bottom-3 right-4 select-none text-right text-[11px] text-white/70">
        ABM System · double-click an icon to open
      </div>
    </div>
  );
}
