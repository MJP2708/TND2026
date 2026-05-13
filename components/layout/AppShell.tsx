"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSession, logout } from "@/lib/auth";
import { getCopy } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { Chatbot } from "./Chatbot";
import { MobileNav } from "./MobileNav";
import { PreferencesBar } from "./PreferencesBar";
import { Sidebar } from "./Sidebar";

type Props = {
  children: React.ReactNode;
  currentRoute: string;
};

export function AppShell({ children, currentRoute }: Props) {
  const router = useRouter();
  const [authChecked] = useState(() => Boolean(getSession()));
  const { state } = useStore();
  const copy = getCopy(state.language);

  useEffect(() => {
    if (!authChecked) {
      logout();
      router.replace("/login");
    }
  }, [authChecked, router]);

  if (!authChecked) {
    return (
      <div className="auth-loading">
        <div className="stack gap-12" style={{ alignItems: "center" }}>
          <div className="loading-pulse" style={{ width: 44, height: 44, borderRadius: 12 }} />
          <p>{copy.loadingWorkspace}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <Sidebar currentRoute={currentRoute} />
      <main className="main-content">
        <div className="desktop-topbar">
          <PreferencesBar compact />
        </div>
        <div className="content-max animate-in">{children}</div>
      </main>
      <MobileNav currentRoute={currentRoute} />
      <Chatbot />
    </div>
  );
}
