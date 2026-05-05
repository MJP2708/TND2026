"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSession } from "@/lib/auth";
import { Sidebar } from "./Sidebar";
import { MobileNav } from "./MobileNav";

type Props = {
  children: React.ReactNode;
  currentRoute: string;
};

export function AppShell({ children, currentRoute }: Props) {
  const router = useRouter();

  useEffect(() => {
    if (!getSession()) {
      router.replace("/login");
    }
  }, [router]);

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
