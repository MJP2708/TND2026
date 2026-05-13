"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/lib/auth";
import { getCopy } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { PreferencesBar } from "@/components/layout/PreferencesBar";

export default function LoginPage() {
  const router = useRouter();
  const { state } = useStore();
  const copy = getCopy(state.language);
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
      setError("That email and password do not match yet.");
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-hero">
        <div className="login-hero-top">
          <div className="brand-mark brand-mark-lg" aria-hidden="true">
            <span />
          </div>
          <PreferencesBar compact />
        </div>
        <div className="login-hero-content">
          <p className="eyebrow">Private focus workspace</p>
          <h1>{copy.appName}</h1>
          <p className="login-hero-copy">
            Turn one goal into daily tasks, focus sessions, rewards, and a city that grows with your effort.
          </p>
          <div className="login-banner">
            <div className="mini-city" aria-hidden="true">
              <span />
              <span />
              <span />
              <span />
            </div>
            <p>Plan gently, work clearly, and keep your momentum visible.</p>
          </div>
        </div>
      </div>

      <div className="login-form-panel">
        <div className="login-mobile-header">
          <div className="brand-mark" aria-hidden="true">
            <span />
          </div>
          <div>
            <p>{copy.appName}</p>
            <span>{copy.appTagline}</span>
          </div>
        </div>

        <div className="login-form-inner">
          <div className="stack gap-24">
            <div className="mobile-only">
              <PreferencesBar compact />
            </div>

            <div className="stack gap-4">
              <h2>Welcome in</h2>
              <p>Your plan, focus timer, rewards, and progress are ready.</p>
            </div>

            <div className="demo-panel">
              <div className="stack gap-10">
                <p className="section-label" style={{ margin: 0 }}>Demo workspace</p>
                <p>
                  Explore the full experience with sample tasks, rewards, and progress already loaded.
                </p>
                <button
                  className="btn btn-accent btn-full btn-lg"
                  disabled={loading}
                  onClick={() => handleLogin("demo@tycoon.app", "demo1234")}
                >
                  {loading ? "Opening..." : "Open demo workspace"}
                </button>
                <span>demo@tycoon.app / demo1234</span>
              </div>
            </div>

            <div className="row gap-12 divider-row">
              <div className="divider" />
              <span>or sign in with email</span>
              <div className="divider" />
            </div>

            <form
              className="stack"
              style={{ gap: 14 }}
              onSubmit={(event) => {
                event.preventDefault();
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
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  placeholder="your@email.com"
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
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
                  placeholder="password"
                  required
                />
              </div>
              {error && (
                <div className="form-error-box">
                  <p className="form-error">{error}</p>
                </div>
              )}
              <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
                {loading ? "Signing in..." : "Sign in"}
              </button>
            </form>

            <p className="login-note">Local demo only. Your data stays in this browser.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
