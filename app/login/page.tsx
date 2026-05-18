"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { login } from "@/lib/auth";
import { Mascot } from "@/components/focusville/Mascot";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail]       = useState("demo@tycoon.app");
  const [password, setPassword] = useState("demo1234");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  async function handleLogin(em = email, pw = password) {
    setLoading(true);
    setError("");
    await new Promise((r) => setTimeout(r, 280));
    if (login(em, pw)) {
      router.push("/dashboard");
    } else {
      setError("That email and password don't match.");
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: "100dvh",
      background: "linear-gradient(135deg, #EBF5FF 0%, #F5FAFF 60%, #E8FFF0 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px",
      fontFamily: "var(--font-poppins, Poppins, system-ui, sans-serif)",
    }}>
      <div style={{
        background: "white",
        borderRadius: 28,
        padding: "32px 28px",
        width: "100%",
        maxWidth: 400,
        boxShadow: "0 16px 60px rgba(94, 169, 255, 0.18)",
        border: "1px solid #D6E9FF",
      }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <Mascot size={72} mood="happy" float />
          <h1 style={{ margin: "8px 0 2px", fontSize: "1.8rem", fontWeight: 900, color: "#1D2B53" }}>
            <span style={{ color: "#5EA9FF" }}>Focus</span>Ville
          </h1>
          <p style={{ margin: 0, fontSize: "0.82rem", color: "#6B7A99" }}>Your goals. Your city. Your future.</p>
        </div>

        {/* Demo */}
        <div style={{
          background: "linear-gradient(135deg, #FFF8E7, #FFEFC0)",
          border: "1px solid #FFE08A",
          borderRadius: 16,
          padding: "14px 16px",
          marginBottom: 20,
        }}>
          <p style={{ margin: "0 0 4px", fontWeight: 800, fontSize: "0.78rem", color: "#C17D00", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Demo workspace
          </p>
          <p style={{ margin: "0 0 12px", fontSize: "0.8rem", color: "#6B7A99", lineHeight: 1.5 }}>
            Explore with sample tasks, rewards & progress already loaded.
          </p>
          <button
            className="fv-btn fv-btn-primary fv-btn-full"
            disabled={loading}
            onClick={() => handleLogin("demo@tycoon.app", "demo1234")}
            style={{ height: 46 }}
          >
            {loading ? "Opening…" : "Open Demo Workspace"}
          </button>
          <p style={{ margin: "8px 0 0", fontSize: "0.7rem", color: "#B0BFCC", textAlign: "center" }}>
            demo@tycoon.app / demo1234
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
          <div style={{ flex: 1, height: 1, background: "#D6E9FF" }} />
          <span style={{ fontSize: "0.75rem", color: "#6B7A99", fontWeight: 600 }}>or sign in</span>
          <div style={{ flex: 1, height: 1, background: "#D6E9FF" }} />
        </div>

        <form
          className="stack gap-12"
          onSubmit={(e) => { e.preventDefault(); handleLogin(); }}
        >
          <div className="stack gap-6">
            <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "#1D2B53" }}>Email</label>
            <input
              type="email"
              className="fv-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              autoComplete="email"
            />
          </div>
          <div className="stack gap-6">
            <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "#1D2B53" }}>Password</label>
            <input
              type="password"
              className="fv-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="password"
              required
              autoComplete="current-password"
            />
          </div>
          {error && (
            <div style={{
              background: "#FFF5F5",
              border: "1px solid #FFCCD5",
              borderRadius: 12,
              padding: "10px 14px",
              fontSize: "0.82rem",
              color: "#D94040",
              fontWeight: 600,
            }}>
              {error}
            </div>
          )}
          <button type="submit" className="fv-btn fv-btn-primary fv-btn-full" disabled={loading} style={{ height: 52 }}>
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p style={{ margin: "16px 0 0", textAlign: "center", fontSize: "0.75rem", color: "#6B7A99" }}>
          Don&apos;t have an account?{" "}
          <Link href="/onboarding" style={{ color: "#5EA9FF", fontWeight: 700 }}>Get started free</Link>
        </p>
      </div>
    </div>
  );
}
