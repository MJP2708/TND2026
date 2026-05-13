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

  const normalizeState = useCallback((incoming: AppState): AppState => {
    const defaults = createDemoState();
    return {
      ...defaults,
      ...incoming,
      themeMode: incoming.themeMode ?? defaults.themeMode,
      uiTone: incoming.uiTone ?? defaults.uiTone,
      language: incoming.language ?? defaults.language,
    };
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      try {
        const raw = localStorage.getItem(KEY);
        setState(raw ? normalizeState(JSON.parse(raw) as AppState) : createDemoState());
      } catch {
        setState(createDemoState());
      }
      setReady(true);
    });
  }, [normalizeState]);

  useEffect(() => {
    document.documentElement.dataset.theme = state.themeMode;
    document.documentElement.dataset.tone = state.uiTone;
    document.documentElement.lang = state.language;
  }, [state.themeMode, state.uiTone, state.language]);

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
