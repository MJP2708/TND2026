"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type { AppState } from "./types";
import { createDemoState } from "./demo-data";

const KEY = "tf:state:demo";

function levelFromXp(xp: number) {
  return Math.max(1, Math.floor(Math.sqrt(xp / 80)) + 1);
}

type Patch = (fn: (s: AppState) => AppState) => void;

type CtxValue = {
  state: AppState;
  patch: Patch;
  ready: boolean;
  resetDemo: () => void;
};

const Ctx = createContext<CtxValue | null>(null);

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(() => createDemoState());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    queueMicrotask(() => {
      try {
        const raw = localStorage.getItem(KEY);
        setState(raw ? (JSON.parse(raw) as AppState) : createDemoState());
      } catch {
        setState(createDemoState());
      }
      setReady(true);
    });
  }, []);

  useEffect(() => {
    if (ready) localStorage.setItem(KEY, JSON.stringify(state));
  }, [state, ready]);

  const patch: Patch = useCallback((fn) => {
    setState((cur) => {
      const next = fn(cur);
      return { ...next, level: levelFromXp(next.xp) };
    });
  }, []);

  const resetDemo = useCallback(() => {
    const fresh = createDemoState();
    setState(fresh);
    localStorage.setItem(KEY, JSON.stringify(fresh));
  }, []);

  return (
    <Ctx.Provider value={{ state, patch, ready, resetDemo }}>
      {children}
    </Ctx.Provider>
  );
}

export function useStore() {
  const val = useContext(Ctx);
  if (!val) throw new Error("useStore must be inside AppStateProvider");
  return val;
}
