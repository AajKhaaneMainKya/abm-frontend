"use client";

import { createContext, useContext, useState, useCallback } from "react";

const KEY = "abm.activeClientId";

interface ActiveClientCtx {
  activeClientId: string | null;
  setActiveClientId: (id: string) => void;
}

const Ctx = createContext<ActiveClientCtx | null>(null);

export function ActiveClientProvider({ children }: { children: React.ReactNode }) {
  // Lazy init from localStorage (guarded for SSR — this is a client-only app).
  const [activeClientId, setId] = useState<string | null>(() =>
    typeof window !== "undefined" ? localStorage.getItem(KEY) : null,
  );

  const setActiveClientId = useCallback((id: string) => {
    setId(id);
    try {
      localStorage.setItem(KEY, id);
    } catch {
      /* ignore */
    }
  }, []);

  return (
    <Ctx.Provider value={{ activeClientId, setActiveClientId }}>{children}</Ctx.Provider>
  );
}

/** The globally-selected client id, shared across every app/page. */
export function useActiveClient(): ActiveClientCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error("useActiveClient must be used within ActiveClientProvider");
  return c;
}
