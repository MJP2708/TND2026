"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { logout, getSession } from "@/lib/auth";
import { useStore } from "@/lib/store";

const NAV = [
  { href: "/dashboard",  icon: "🏠", label: "Dashboard"  },
  { href: "/plan",       icon: "📋", label: "Plan"        },
  { href: "/focus",      icon: "⏱",  label: "Focus"       },
  { href: "/progress",   icon: "🏙",  label: "Progress"   },
  { href: "/rewards",    icon: "🎁",  label: "Rewards"    },
  { href: "/mood",       icon: "💚",  label: "Mood"       },
  { href: "/community",  icon: "🤝",  label: "Community"  },
  { href: "/settings",   icon: "⚙️",  label: "Settings"   },
];

export function Sidebar({ currentRoute }: { currentRoute: string }) {
  const router = useRouter();
  const { state } = useStore();
  const session = getSession();

  function handleLogout() {
    logout();
    router.push("/login");
  }

  const initial = (state.displayName || session?.name || "S")[0].toUpperCase();

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-mark">TF</div>
        <div>
          <strong style={{ fontSize: "0.9rem", fontWeight: 800, display: "block" }}>
            Tycoon Focus
          </strong>
          <span style={{ fontSize: "0.72rem", color: "var(--color-muted)" }}>
            Plan. Focus. Grow.
          </span>
        </div>
      </div>

      <nav className="sidebar-nav" aria-label="Main navigation">
        <p className="nav-group-label">Menu</p>
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`nav-link ${currentRoute === item.href ? "active" : ""}`}
          >
            <span className="nav-link-icon">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user" onClick={handleLogout} title="Log out">
          <div className="avatar">{initial}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--color-text)" }}>
              {state.displayName || session?.name || "Student"}
            </div>
            <div style={{ fontSize: "0.72rem", color: "var(--color-muted)" }}>
              Level {state.level} · {state.gold} Gold
            </div>
          </div>
          <span style={{ fontSize: "0.75rem", color: "var(--color-muted)" }}>↩</span>
        </div>
      </div>
    </aside>
  );
}
