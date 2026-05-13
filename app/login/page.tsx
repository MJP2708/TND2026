"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("demo@tycoon.app");
  const [password, setPassword] = useState("demo1234");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(em = email, pw = password) {
    setLoading(true);
    setError("");
    await new Promise((r) => setTimeout(r, 280));
    if (login(em, pw)) {
      router.push("/dashboard");
    } else {
      setError("Hmm, that doesn't match. Double-check your email and password.");
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      {/* ── Desktop hero panel ── */}
      <div className="login-hero">
        <div
          className="brand-mark"
          style={{ width: 48, height: 48, borderRadius: 14, fontSize: "0.95rem" }}
        >
          TF
        </div>
        <h1>
          Build slowly.<br />Win daily.
        </h1>
        <p className="login-hero-copy">
          One goal. One plan. One focus session at a time.
          Your city grows every time you show up — no burnout required.
        </p>
        <div className="stack gap-14">
          <Feature icon="🎯" text="AI turns your big goal into realistic daily tasks" />
          <Feature icon="⏱" text="A calm focus timer that rewards your real effort" />
          <Feature icon="🏙" text="Your city grows every time you show up" />
          <Feature icon="🌿" text="Gentle mood check-ins — never productivity guilt" />
        </div>
        <div className="login-hero-footer">
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              background: "rgba(255,255,255,.12)",
              borderRadius: 99,
              padding: "5px 13px",
              fontSize: "0.72rem",
              color: "rgba(255,255,255,.85)",
              fontWeight: 600,
            }}
          >
            🔒 All data stays in your browser · No account needed
          </span>
        </div>
      </div>

      {/* ── Form panel ── */}
      <div className="login-form-panel">
        {/* Mobile-only app header (hidden on desktop) */}
        <div className="login-mobile-header">
          <div
            className="brand-mark"
            style={{ width: 44, height: 44, borderRadius: 13, fontSize: "0.9rem" }}
          >
            TF
          </div>
          <div>
            <p
              style={{
                margin: 0,
                fontSize: "1.15rem",
                fontWeight: 900,
                color: "white",
                lineHeight: 1.2,
              }}
            >
              Tycoon Focus
            </p>
            <p
              style={{
                margin: 0,
                fontSize: "0.8rem",
                color: "rgba(255,255,255,.72)",
                marginTop: 2,
              }}
            >
              Build slowly. Win daily.
            </p>
          </div>
        </div>

        {/* Form content */}
        <div className="login-form-inner">
          <div className="stack gap-24">
            {/* Title */}
            <div className="stack gap-4">
              <h2 style={{ margin: 0, fontSize: "1.55rem", fontWeight: 900 }}>
                Welcome back 👋
              </h2>
              <p style={{ margin: 0, color: "var(--color-muted)", fontSize: "0.875rem" }}>
                Your workspace is waiting for you.
              </p>
            </div>

            {/* Demo shortcut */}
            <div
              style={{
                border: "1.5px solid rgba(212,147,14,.4)",
                borderRadius: "var(--r-lg)",
                padding: 18,
                background: "var(--color-accent-soft)",
              }}
            >
              <div className="stack gap-10">
                <div className="row gap-8">
                  <span style={{ fontSize: "1.05rem" }}>✨</span>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "0.75rem",
                      fontWeight: 800,
                      color: "var(--color-accent)",
                    }}
                  >
                    Try the cozy demo workspace
                  </p>
                </div>
                <p
                  style={{
                    margin: 0,
                    fontSize: "0.9rem",
                    color: "var(--color-text)",
                    lineHeight: 1.5,
                  }}
                >
                  A fully pre-loaded space — plan, timer, city, and rewards ready to go.
                </p>
                <button
                  className="btn btn-accent btn-full btn-lg"
                  disabled={loading}
                  onClick={() => handleLogin("demo@tycoon.app", "demo1234")}
                >
                  {loading ? "Opening your space…" : "✨ Open demo workspace"}
                </button>
                <p style={{ margin: 0, fontSize: "0.72rem", color: "var(--color-muted)" }}>
                  demo@tycoon.app · demo1234
                </p>
              </div>
            </div>

            <div
              className="row gap-12"
              style={{ color: "var(--color-muted)", fontSize: "0.8rem" }}
            >
              <div className="divider" style={{ flex: 1 }} />
              <span>or sign in with email</span>
              <div className="divider" style={{ flex: 1 }} />
            </div>

            <form
              className="stack"
              style={{ gap: 14 }}
              onSubmit={(e) => {
                e.preventDefault();
                handleLogin();
              }}
            >
              <div className="form-group">
                <label className="form-label" htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  className="form-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  placeholder="your@email.com"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="password">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  className="form-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  required
                />
              </div>
              {error && (
                <div
                  style={{
                    background: "#FFF0F0",
                    border: "1px solid #FFCCC7",
                    borderRadius: "var(--r-md)",
                    padding: "10px 14px",
                  }}
                >
                  <p className="form-error" style={{ margin: 0 }}>
                    ⚠ {error}
                  </p>
                </div>
              )}
              <button
                type="submit"
                className="btn btn-primary btn-full btn-lg"
                disabled={loading}
              >
                {loading ? "Signing in…" : "Sign in →"}
              </button>
            </form>

            <p
              style={{
                margin: 0,
                fontSize: "0.72rem",
                color: "var(--color-muted)",
                lineHeight: 1.6,
                textAlign: "center",
              }}
            >
              Local demo only. All data stays in your browser — no servers, no sign-up.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Feature({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="login-feature">
      <div className="login-feature-icon">{icon}</div>
      <span>{text}</span>
    </div>
  );
}
