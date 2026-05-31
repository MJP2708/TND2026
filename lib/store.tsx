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

  const normalizeState = useCallback((incoming: Partial<AppState>): AppState => {
    const defaults = createDemoState();
    return {
      ...defaults,
      ...incoming,
      purchasedItems: incoming.purchasedItems ?? defaults.purchasedItems,
      lastMoodDate: incoming.lastMoodDate ?? defaults.lastMoodDate,
      themeMode: incoming.themeMode ?? defaults.themeMode,
      uiTone: incoming.uiTone ?? defaults.uiTone,
      language: incoming.language ?? defaults.language,
      energy: incoming.energy ?? defaults.energy,
      happiness: incoming.happiness ?? defaults.happiness,
      currentEra: incoming.currentEra ?? defaults.currentEra,
      prestigeCount: incoming.prestigeCount ?? defaults.prestigeCount,
      prestigeMultiplier: incoming.prestigeMultiplier ?? defaults.prestigeMultiplier,
      lastLoginAt: incoming.lastLoginAt ?? defaults.lastLoginAt,
      specialCitizens: incoming.specialCitizens ?? defaults.specialCitizens,
      todayEvent: incoming.todayEvent ?? defaults.todayEvent,
      todayEventDate: incoming.todayEventDate ?? defaults.todayEventDate,
      totalBuilt: incoming.totalBuilt ?? defaults.totalBuilt,
      pendingPassiveIncome: incoming.pendingPassiveIncome ?? defaults.pendingPassiveIncome,
      constructionDiscount: incoming.constructionDiscount ?? defaults.constructionDiscount,
    };
  }, []);

  useEffect(() => {
    async function loadState() {
      if (userId) {
        try {
          const res = await fetch("/api/user/state");
          if (res.ok) {
            const data = await res.json();
            const gs = data.gameState;
            const dbState: AppState = {
              ...createDemoState(),
              userId: data.user.id,
              displayName: data.user.displayName,
              gold: data.user.gold,
              energy: data.user.energy,
              xp: data.user.xp,
              level: levelFromXp(data.user.xp),
              streak: data.user.streak,
              focusMinutes: data.user.focusMinutes,
              houseLevel: data.user.houseLevel,
              happiness: data.user.happiness,
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
              // Game state
              currentEra: gs?.currentEra ?? "pioneer",
              prestigeCount: gs?.prestigeCount ?? 0,
              prestigeMultiplier: gs?.prestigeMultiplier ?? 1.0,
              lastLoginAt: gs?.lastLoginAt ?? new Date().toISOString(),
              specialCitizens: gs?.specialCitizens ?? [],
              todayEvent: gs?.todayEvent ?? null,
              todayEventDate: gs?.todayEventDate ?? "",
              totalBuilt: gs?.totalBuilt ?? 0,
              pendingPassiveIncome: gs?.pendingPassiveIncome ?? null,
              constructionDiscount: gs?.constructionDiscount ?? false,
            };
            setState(dbState);
            localStorage.setItem(KEY, JSON.stringify(dbState));
            setReady(true);
            return;
          }
        } catch {
          // fall through
        }
      }

      queueMicrotask(() => {
        try {
          const raw = localStorage.getItem(KEY);
          setState(raw ? normalizeState(JSON.parse(raw) as Partial<AppState>) : createDemoState());
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
