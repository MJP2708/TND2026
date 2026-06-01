"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { registerUser } from "@/lib/actions/auth";
import { Mascot } from "@/components/focusville/Mascot";
import { Suspense } from "react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from") ?? "/dashboard";

  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  async function handleCredentials(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (mode === "register") {
      const fd = new FormData();
      fd.append("name", name);
      fd.append("email", email);
      fd.append("password", password);
      const result = await registerUser(fd);
      if (result.error) { setError(result.error); return; }
      // After register, sign in
    }

    startTransition(async () => {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (result?.error) {
        setError("Invalid email or password.");
      } else {
        router.push(from);
        router.refresh();
      }
    });
  }

  async function handleGoogle() {
    await signIn("google", { callbackUrl: from });
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

        {/* Google OAuth */}
        {process.env.NEXT_PUBLIC_GOOGLE_ENABLED === "true" && (
          <button
            onClick={handleGoogle}
            className="fv-btn fv-btn-secondary fv-btn-full"
            style={{ height: 48, gap: 8, marginBottom: 16, fontSize: "0.88rem", fontWeight: 700 }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18">
              <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
              <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"/>
              <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
              <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
            </svg>
            Continue with Google
          </button>
        )}

        {/* Mode toggle */}
        <div style={{ display: "flex", background: "#F5FAFF", borderRadius: 12, padding: 4, marginBottom: 20 }}>
          {(["login", "register"] as const).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(""); }}
              style={{
                flex: 1,
                height: 36,
                borderRadius: 10,
                border: "none",
                background: mode === m ? "white" : "transparent",
                color: mode === m ? "#1D2B53" : "#6B7A99",
                fontWeight: mode === m ? 800 : 600,
                fontSize: "0.82rem",
                cursor: "pointer",
                boxShadow: mode === m ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                transition: "all 0.2s",
                fontFamily: "inherit",
              }}
            >
              {m === "login" ? "Sign in" : "Create account"}
            </button>
          ))}
        </div>

        <form className="stack gap-12" onSubmit={handleCredentials}>
          {mode === "register" && (
            <div className="stack gap-6">
              <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "#1D2B53" }}>Your name</label>
              <input
                type="text"
                className="fv-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Alex"
                required
                minLength={2}
              />
            </div>
          )}
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
              placeholder={mode === "register" ? "At least 8 characters" : "Password"}
              required
              minLength={mode === "register" ? 8 : 6}
              autoComplete={mode === "register" ? "new-password" : "current-password"}
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

          <button
            type="submit"
            className="fv-btn fv-btn-primary fv-btn-full"
            disabled={isPending}
            style={{ height: 52 }}
          >
            {isPending
              ? mode === "register" ? "Creating account…" : "Signing in…"
              : mode === "register" ? "Create account" : "Sign in"}
          </button>
        </form>

        <p style={{ margin: "16px 0 0", textAlign: "center", fontSize: "0.72rem", color: "#B0BFCC" }}>
          By continuing you agree to our{" "}
          <span style={{ color: "#5EA9FF" }}>Terms of Service</span>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Mascot size={60} mood="idle" float />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
