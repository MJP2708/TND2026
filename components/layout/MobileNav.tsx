"use client";

import Link from "next/link";

const NAV = [
  { href: "/dashboard", icon: "🏠", label: "Home"    },
  { href: "/plan",      icon: "📋", label: "Plan"    },
  { href: "/focus",     icon: "⏱",  label: "Focus"   },
  { href: "/rewards",   icon: "🎁",  label: "Rewards" },
  { href: "/mood",      icon: "💚",  label: "Mood"   },
];

export function MobileNav({ currentRoute }: { currentRoute: string }) {
  return (
    <nav className="mobile-nav" aria-label="Mobile navigation">
      <div className="mobile-nav-grid">
        {NAV.map((item) => (
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
