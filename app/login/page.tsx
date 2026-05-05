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
      setError("Incorrect email or password. Try the demo account.");
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      {/* ── Hero panel ── */}
      <div className="login-hero">
        <div className="brand-mark" style={{ width: 44, height: 44, borderRadius: 12, fontSize: "0.9rem" }}>TF</div>
        <h1>Build slowly.<br />Win daily.</h1>
        <p className="login-hero-copy">
          Turn one goal into today&apos;s plan. Start one focus session. Earn Gold
          and grow a small city — without overthinking the schedule.
        </p>
        <div className="stack gap-12">
          <Feature icon="📋" text="AI breaks your goal into realistic daily tasks" />
          <Feature icon="⏱" text="A calm focus timer that earns you real rewards" />
          <Feature icon="🏙" text="Your city grows every time you show up" />
          <Feature icon="💚" text="Gentle mood check-ins, not productivity guilt" />
        </div>
      </div>

      {/* ── Form panel ── */}
      <div className="login-form-panel">
        <div className="stack gap-24">
          <div className="stack gap-4">
            <div className="row gap-10" style={{ marginBottom: 4 }}>
              <div className="brand-mark">TF</div>
              <strong style={{ fontWeight: 900, fontSize: "1rem" }}>Tycoon Focus</strong>
            </div>
            <h2 style={{ margin: 0, fontSize: "1.55rem", fontWeight: 900 }}>Welcome back</h2>
            <p style={{ margin: 0, color: "var(--color-muted)", fontSize: "0.88rem" }}>
              Sign in to your workspace.
            </p>
          </div>

          {/* Demo shortcut */}
          <div
            style={{
              border: "1.5px solid rgba(212,147,14,.4)",
              borderRadius: "var(--r-lg)",
              padding: 16,
              background: "var(--color-accent-soft)",
            }}
          >
            <div className="stack gap-10">
              <p style={{ margin: 0, fontSize: "0.7rem", fontWeight: 800, color: "var(--color-accent)", textTransform: "uppercase", letterSpacing: ".07em" }}>
                Competition demo
              </p>
              <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--color-text)", lineHeight: 1.5 }}>
                Open a fully pre-loaded workspace — plan, timer, city, rewards, mood.
              </p>
              <button
                className="btn btn-accent btn-full"
                disabled={loading}
                onClick={() => handleLogin("demo@tycoon.app", "demo1234")}
              >
                {loading ? "Opening…" : "✨ Try Demo Account"}
              </button>
              <p style={{ margin: 0, fontSize: "0.72rem", color: "var(--color-muted)" }}>
                demo@tycoon.app · demo1234
              </p>
            </div>
          </div>

          <div className="row gap-12" style={{ color: "var(--color-muted)", fontSize: "0.8rem" }}>
            <div className="divider" style={{ flex: 1 }} />
            <span>or sign in manually</span>
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
              <label className="form-label" htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>
            {error && <p className="form-error">{error}</p>}
            <button
              type="submit"
              className="btn btn-primary btn-full btn-lg"
              disabled={loading}
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <p style={{ margin: 0, fontSize: "0.72rem", color: "var(--color-muted)", lineHeight: 1.55 }}>
            This is a local demo. All data stays in your browser. No account creation required.
          </p>
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
