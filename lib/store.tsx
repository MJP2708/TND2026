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

const KEY_PREFIX = "tf:state:";

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

export function AppStateProvider({ children, userId }: { children: React.ReactNode; userId?: string | null }) {
  const KEY = userId ? `${KEY_PREFIX}${userId}` : `${KEY_PREFIX}demo`;

  const [state, setState] = useState<AppState>(() => createDemoState());
  const [ready, setReady] = useState(false);

  const normalizeState = useCallback((incoming: AppState): AppState => {
    const defaults = createDemoState();
    return {
      ...defaults,
      ...incoming,
      purchasedItems: incoming.purchasedItems ?? defaults.purchasedItems,
      lastMoodDate: incoming.lastMoodDate ?? defaults.lastMoodDate,
      themeMode: incoming.themeMode ?? defaults.themeMode,
      uiTone: incoming.uiTone ?? defaults.uiTone,
      language: incoming.language ?? defaults.language,
    };
  }, []);

  useEffect(() => {
    async function loadState() {
      // 1. Try to load from DB (if authenticated)
      if (userId) {
        try {
          const res = await fetch("/api/user/state");
          if (res.ok) {
            const data = await res.json();
            const dbState: AppState = {
              ...createDemoState(),
              userId: data.user.id,
              displayName: data.user.displayName,
              gold: data.user.gold,
              xp: data.user.xp,
              level: levelFromXp(data.user.xp),
              streak: data.user.streak,
              focusMinutes: data.user.focusMinutes,
              houseLevel: data.user.houseLevel,
              lastActiveDate: data.user.lastActiveDate,
              lastMoodDate: data.user.lastMoodDate,
              themeMode: data.user.themeMode,
              uiTone: data.user.uiTone,
              language: data.user.language,
              goal: data.goal,
              tasks: data.tasks,
              moods: data.moods,
              purchasedItems: data.purchasedItems,
              hasOnboarded: !!data.goal,
            };
            setState(dbState);
            // Also cache in localStorage
            localStorage.setItem(KEY, JSON.stringify(dbState));
            setReady(true);
            return;
          }
        } catch {
          // Fall through to localStorage
        }
      }

      // 2. Fall back to localStorage
      queueMicrotask(() => {
        try {
          const raw = localStorage.getItem(KEY);
          setState(raw ? normalizeState(JSON.parse(raw) as AppState) : createDemoState());
        } catch {
          setState(createDemoState());
        }
        setReady(true);
      });
    }

    loadState();
  }, [userId, KEY, normalizeState]);

  useEffect(() => {
    document.documentElement.dataset.theme = state.themeMode;
    document.documentElement.dataset.tone = state.uiTone;
    document.documentElement.lang = state.language;
  }, [state.themeMode, state.uiTone, state.language]);

  useEffect(() => {
    if (ready) localStorage.setItem(KEY, JSON.stringify(state));
  }, [state, ready, KEY]);

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
  }, [KEY]);

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
