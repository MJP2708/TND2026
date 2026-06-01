"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Map, Timer, Building2, User } from "lucide-react";
import { ActiveSessionBanner } from "@/components/game/ActiveSessionBanner";
import { useLocale } from "next-intl";
import { LanguageToggle } from "@/components/ui/LanguageToggle";

interface FVShellProps {
  children: React.ReactNode;
  hideNav?: boolean;
  className?: string;
  showLangToggle?: boolean;
}

const NAV_ITEMS = [
  { href: "/dashboard",  label: "Home",    Icon: Home     },
  { href: "/plan",       label: "Plan",    Icon: Map      },
  { href: "/focus",      label: "Focus",   Icon: Timer    },
  { href: "/community",  label: "City",    Icon: Building2 },
  { href: "/progress",   label: "Profile", Icon: User     },
];

export function FVShell({ children, hideNav, className, showLangToggle = false }: FVShellProps) {
  const pathname = usePathname();
  const locale = useLocale();

  return (
    <div className="fv-shell">
      <main className={`fv-page ${className ?? ""}`}>
        {pathname !== "/focus" && <ActiveSessionBanner />}
        {children}
      </main>

      {!hideNav && (
        <nav className="fv-navbar">
          <div className="fv-navbar-grid">
            {NAV_ITEMS.map(({ href, label, Icon }) => {
              const active = pathname === href || pathname.startsWith(href + "/");
              return (
                <Link
                  key={href}
                  href={href}
                  className={`fv-nav-item ${active ? "active" : ""}`}
                >
                  <div className="fv-nav-icon">
                    <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
                  </div>
                  <span>{label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      )}

      {/* Floating language toggle — shown on settings or when explicitly requested */}
      {showLangToggle && (
        <div style={{
          position: "fixed",
          top: 12,
          right: 12,
          zIndex: 500,
        }}>
          <LanguageToggle currentLocale={locale} compact />
        </div>
      )}
    </div>
  );
}
