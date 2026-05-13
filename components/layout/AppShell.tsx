"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSession, logout } from "@/lib/auth";
import { Sidebar } from "./Sidebar";
import { MobileNav } from "./MobileNav";

type Props = {
  children: React.ReactNode;
  currentRoute: string;
};

export function AppShell({ children, currentRoute }: Props) {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    if (!getSession()) {
      // Clear session cookie so proxy doesn't create a redirect loop
      logout();
      router.replace("/login");
    } else {
      setAuthChecked(true);
    }
  }, [router]);

  if (!authChecked) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "var(--color-bg)",
        }}
      >
        <div className="stack gap-12" style={{ alignItems: "center" }}>
          <div
            className="loading-pulse"
            style={{ width: 44, height: 44, borderRadius: 12 }}
          />
          <p
            style={{
              margin: 0,
              color: "var(--color-muted)",
              fontSize: "0.875rem",
            }}
          >
            Loading your workspace…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <Sidebar currentRoute={currentRoute} />
      <main className="main-content">
        <div className="content-max animate-in">{children}</div>
      </main>
      <MobileNav currentRoute={currentRoute} />
    </div>
  );
}
