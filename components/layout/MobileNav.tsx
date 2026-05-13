"use client";

import Link from "next/link";
import { getCopy } from "@/lib/i18n";
import { useStore } from "@/lib/store";

export function MobileNav({ currentRoute }: { currentRoute: string }) {
  const { state } = useStore();
  const copy = getCopy(state.language);
  const nav = [
    { href: "/dashboard", icon: "🏠", label: copy.dashboard },
    { href: "/plan", icon: "📋", label: copy.plan },
    { href: "/focus", icon: "⏱", label: copy.focus },
    { href: "/rewards", icon: "🎁", label: copy.rewards },
    { href: "/mood", icon: "💚", label: copy.mood },
  ];

  return (
    <nav className="mobile-nav" aria-label="Mobile navigation">
      <div className="mobile-nav-grid">
        {nav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`mobile-nav-item ${currentRoute === item.href ? "active" : ""}`}
          >
            <span className="mobile-nav-icon">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
