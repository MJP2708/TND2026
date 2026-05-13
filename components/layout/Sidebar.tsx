"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { logout, getSession } from "@/lib/auth";
import { getCopy } from "@/lib/i18n";
import { useStore } from "@/lib/store";

function nav(copy: ReturnType<typeof getCopy>) {
  return [
    { href: "/dashboard", icon: "🏠", label: copy.dashboard },
    { href: "/plan", icon: "📋", label: copy.plan },
    { href: "/focus", icon: "⏱", label: copy.focus },
    { href: "/progress", icon: "🏙", label: copy.progress },
    { href: "/rewards", icon: "🎁", label: copy.rewards },
    { href: "/mood", icon: "💚", label: copy.mood },
    { href: "/community", icon: "🤝", label: copy.community },
    { href: "/settings", icon: "⚙️", label: copy.settings },
  ];
}

export function Sidebar({ currentRoute }: { currentRoute: string }) {
  const router = useRouter();
  const { state } = useStore();
  const session = getSession();
  const copy = getCopy(state.language);

  function handleLogout() {
    logout();
    router.push("/login");
  }

  const initial = (state.displayName || session?.name || "S")[0].toUpperCase();

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-mark" aria-hidden="true">
          <span />
        </div>
        <div>
          <strong>{copy.appName}</strong>
          <span>{copy.appTagline}</span>
        </div>
      </div>

      <nav className="sidebar-nav" aria-label="Main navigation">
        <p className="nav-group-label">{copy.menu}</p>
        {nav(copy).map((item) => (
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
        <div className="sidebar-user">
          <div className="avatar">{initial}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="sidebar-user-name">
              {state.displayName || session?.name || "Student"}
            </div>
            <div className="sidebar-user-meta">
              Lv {state.level} / {state.gold} Gold
            </div>
          </div>
          <button onClick={handleLogout} title="Log out" className="sidebar-logout">
            Exit
          </button>
        </div>
      </div>
    </aside>
  );
}
