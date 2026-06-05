"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Map, Timer, Building2, User, ShoppingBag, Gift, Users, Grid3x3, X } from "lucide-react";
import { ActiveSessionBanner } from "@/components/game/ActiveSessionBanner";
import { useLocale } from "next-intl";
import { LanguageToggle } from "@/components/ui/LanguageToggle";

interface FVShellProps {
  children: React.ReactNode;
  hideNav?: boolean;
  className?: string;
  showLangToggle?: boolean;
}

const PRIMARY_NAV = [
  { href: "/dashboard",  label: "Home",   Icon: Home      },
  { href: "/plan",       label: "Plan",   Icon: Map       },
  { href: "/focus",      label: "Focus",  Icon: Timer     },
  { href: "/community",  label: "City",   Icon: Building2 },
  { href: "/progress",   label: "Profile", Icon: User     },
];

const MORE_ITEMS = [
  { href: "/shop",         label: "Shop",        Icon: ShoppingBag, desc: "Buy buildings & upgrades" },
  { href: "/rewards",      label: "Rewards",     Icon: Gift,        desc: "Set personal real-world rewards" },
  { href: "/neighborhood", label: "Neighborhood", Icon: Users,      desc: "Anonymous community feed" },
];

export function FVShell({ children, hideNav, className, showLangToggle = false }: FVShellProps) {
  const pathname = usePathname();
  const locale = useLocale();
  const [showMore, setShowMore] = useState(false);

  const isMoreActive = MORE_ITEMS.some(
    (m) => pathname === m.href || pathname.startsWith(m.href + "/")
  );

  return (
    <div className="fv-shell">
      <main className={`fv-page ${className ?? ""}`}>
        {pathname !== "/focus" && <ActiveSessionBanner />}
        {children}
      </main>

      {!hideNav && (
        <nav className="fv-navbar">
          <div className="fv-navbar-grid">
            {PRIMARY_NAV.map(({ href, label, Icon }) => {
              const active = pathname === href || pathname.startsWith(href + "/");
              return (
                <Link
                  key={href}
                  href={href}
                  className={`fv-nav-item ${active ? "active" : ""}`}
                  onClick={() => setShowMore(false)}
                >
                  <div className="fv-nav-icon">
                    <Icon size={18} strokeWidth={active ? 2.5 : 1.8} />
                  </div>
                  <span>{label}</span>
                </Link>
              );
            })}

            {/* More button */}
            <button
              className={`fv-nav-item ${isMoreActive || showMore ? "active" : ""}`}
              onClick={() => setShowMore((v) => !v)}
              style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}
            >
              <div className="fv-nav-icon">
                {showMore
                  ? <X size={18} strokeWidth={2.5} />
                  : <Grid3x3 size={18} strokeWidth={isMoreActive ? 2.5 : 1.8} />}
              </div>
              <span>More</span>
            </button>
          </div>
        </nav>
      )}

      {/* More menu overlay */}
      {showMore && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setShowMore(false)}
            style={{
              position: "fixed", inset: 0, zIndex: 90,
              background: "rgba(0,0,0,0.25)",
            }}
          />

          {/* Slide-up sheet */}
          <div style={{
            position: "fixed",
            bottom: 64,
            left: 0,
            right: 0,
            zIndex: 91,
            background: "white",
            borderRadius: "20px 20px 0 0",
            padding: "16px 20px 20px",
            boxShadow: "0 -4px 24px rgba(0,0,0,0.12)",
            animation: "slideUp 0.2s ease",
          }}>
            <style>{`@keyframes slideUp { from { transform: translateY(100%) } to { transform: translateY(0) } }`}</style>

            <div style={{
              width: 36, height: 4, borderRadius: 2,
              background: "#D6E9FF",
              margin: "0 auto 16px",
            }} />

            <p style={{ margin: "0 0 12px", fontSize: "0.72rem", fontWeight: 800, color: "#6B7A99", letterSpacing: "0.08em" }}>
              MORE PAGES
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
              {MORE_ITEMS.map(({ href, label, Icon, desc }) => {
                const active = pathname === href || pathname.startsWith(href + "/");
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setShowMore(false)}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 6,
                      padding: "14px 8px",
                      borderRadius: 16,
                      background: active ? "#EBF5FF" : "#F8FBFF",
                      border: `1px solid ${active ? "#5EA9FF" : "#E8F0FF"}`,
                      textDecoration: "none",
                    }}
                  >
                    <Icon size={22} color={active ? "#5EA9FF" : "#6B7A99"} strokeWidth={active ? 2.5 : 1.8} />
                    <span style={{ fontSize: "0.75rem", fontWeight: 700, color: active ? "#5EA9FF" : "#1D2B53" }}>
                      {label}
                    </span>
                    <span style={{ fontSize: "0.62rem", color: "#6B7A99", textAlign: "center", lineHeight: 1.3 }}>
                      {desc}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </>
      )}

      {showLangToggle && (
        <div style={{ position: "fixed", top: 12, right: 12, zIndex: 500 }}>
          <LanguageToggle currentLocale={locale} compact />
        </div>
      )}
    </div>
  );
}
