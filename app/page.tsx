"use client";

import Link from "next/link";
import { Mascot } from "@/components/focusville/Mascot";

const USER_FLOW = [
  { n: "1", title: "Set Goal", desc: "Define your big goal" },
  { n: "2", title: "AI Plan", desc: "AI breaks it down into daily tasks" },
  { n: "3", title: "Focus", desc: "Work with Focus Timer" },
  { n: "4", title: "Earn", desc: "Earn Gold & XP" },
  { n: "5", title: "Build", desc: "Build your city, business & home" },
  { n: "6", title: "Connect", desc: "Visit neighbors, share support" },
  { n: "7", title: "Reflect", desc: "Mood check-in & get AI support" },
];

const FEATURES = [
  { icon: "🤖", title: "AI Planner", desc: "Smart schedule & task breakdown" },
  { icon: "⏱", title: "Focus Timer", desc: "Deep work & tracking" },
  { icon: "🪙", title: "Game Economy", desc: "Earn Gold, XP & rewards" },
  { icon: "🏙", title: "City Builder", desc: "Build houses, business & home" },
  { icon: "🤝", title: "Anonymous Community", desc: "Connect with others who understand" },
  { icon: "💚", title: "Mood & Support", desc: "AI mood detection & burnout care" },
  { icon: "🎁", title: "Real-life Rewards", desc: "Exchange Gold for real-life treats" },
];

export default function LandingPage() {
  return (
    <div style={{ background: "#F5FAFF", minHeight: "100dvh", fontFamily: "var(--font-poppins, Poppins, system-ui, sans-serif)" }}>

      {/* ── HEADER ── */}
      <header style={{
        background: "white",
        borderBottom: "1px solid #D6E9FF",
        padding: "16px 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}>
        <div className="row gap-8">
          <Mascot size={32} mood="happy" />
          <span style={{ fontSize: "1.4rem", fontWeight: 900, color: "#1D2B53" }}>
            <span style={{ color: "#5EA9FF" }}>Focus</span>Ville
          </span>
        </div>
        <div className="row gap-12">
          <Link href="/login" className="fv-btn fv-btn-ghost fv-btn-sm">Sign in</Link>
          <Link href="/onboarding" className="fv-btn fv-btn-primary fv-btn-sm">Get Started</Link>
        </div>
      </header>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px" }}>

        {/* ── HERO ── */}
        <section style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 40,
          alignItems: "center",
          padding: "60px 0 40px",
        }}>
          {/* Left: user flow + copy */}
          <div className="stack gap-24">
            <div>
              <h1 style={{
                fontSize: "clamp(2.2rem, 5vw, 3.6rem)",
                fontWeight: 900,
                color: "#1D2B53",
                lineHeight: 1.1,
                margin: 0,
              }}>
                <span style={{ color: "#5EA9FF" }}>Focus.</span>{" "}
                <span style={{ color: "#7EDC8A" }}>Build.</span>{" "}
                <span style={{ color: "#FFD45E" }}>Thrive.</span>
              </h1>
              <p style={{
                marginTop: 16,
                fontSize: "1.05rem",
                color: "#6B7A99",
                lineHeight: 1.7,
                maxWidth: 400,
              }}>
                Turn your goals into a beautiful city. Build your future, one focus session at a time.
              </p>
            </div>

            <div style={{
              background: "white",
              border: "1px solid #D6E9FF",
              borderRadius: 20,
              padding: "20px",
            }}>
              <p style={{ margin: "0 0 14px", fontWeight: 800, fontSize: "0.78rem", color: "#6B7A99", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                USER FLOW OVERVIEW
              </p>
              <div className="stack gap-10">
                {USER_FLOW.map((step) => (
                  <div key={step.n} className="row gap-12">
                    <div style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      background: "linear-gradient(135deg, #5EA9FF, #3D8FE8)",
                      color: "white",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "0.7rem",
                      fontWeight: 800,
                      flexShrink: 0,
                    }}>
                      {step.n}
                    </div>
                    <div>
                      <p style={{ margin: 0, fontWeight: 700, fontSize: "0.85rem", color: "#1D2B53" }}>{step.title}</p>
                      <p style={{ margin: 0, fontSize: "0.72rem", color: "#6B7A99" }}>{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="row gap-12 cluster">
              <Link href="/onboarding" className="fv-btn fv-btn-primary fv-btn-lg">
                Get Started Free
              </Link>
              <Link href="/login" className="fv-btn fv-btn-secondary fv-btn-lg">
                I already have an account
              </Link>
            </div>
          </div>

          {/* Right: mascot + city */}
          <div style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 20,
          }}>
            {/* City background */}
            <div style={{
              width: "100%",
              height: 240,
              background: "linear-gradient(180deg, #B8E4FF 0%, #D4EEFF 45%, #C8EBB5 70%, #A8D98A 100%)",
              borderRadius: 24,
              position: "relative",
              overflow: "hidden",
            }}>
              {/* Buildings */}
              {[
                { left: 20, w: 40, h: 100, color: "#8EC5FF" },
                { left: 65, w: 30, h: 70, color: "#A8D4FF" },
                { left: 100, w: 50, h: 130, color: "#7BBBF5" },
                { left: 155, w: 35, h: 85, color: "#9AC8F8" },
                { left: 195, w: 45, h: 110, color: "#6EAEF0" },
                { left: 245, w: 28, h: 60, color: "#B0CFFF" },
                { left: 278, w: 55, h: 140, color: "#5EA9FF" },
                { left: 338, w: 32, h: 75, color: "#8EC5FF" },
              ].map((b, i) => (
                <div key={i} style={{
                  position: "absolute",
                  bottom: 40,
                  left: b.left,
                  width: b.w,
                  height: b.h,
                  background: b.color,
                  borderRadius: "6px 6px 0 0",
                  opacity: 0.85,
                }} />
              ))}
              {/* Ground */}
              <div style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                height: 40,
                background: "#A8D98A",
              }} />
              {/* Trees */}
              {[40, 120, 230, 310].map((x, i) => (
                <div key={i} style={{ position: "absolute", bottom: 38, left: x, fontSize: "1.4rem" }}>🌳</div>
              ))}

              {/* Floating mascot */}
              <div style={{
                position: "absolute",
                bottom: 36,
                left: "50%",
                transform: "translateX(-50%)",
                animation: "mascot-float 3s ease-in-out infinite",
              }}>
                <Mascot size={72} mood="happy" />
              </div>
            </div>

            {/* Feature pills */}
            <div className="row gap-8 cluster" style={{ justifyContent: "center" }}>
              {["AI Planner", "Focus Timer", "City Builder", "Mood Tracker"].map((f) => (
                <span key={f} style={{
                  background: "white",
                  border: "1px solid #D6E9FF",
                  borderRadius: 999,
                  padding: "6px 14px",
                  fontSize: "0.78rem",
                  fontWeight: 700,
                  color: "#5EA9FF",
                }}>
                  {f}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ── FEATURES ── */}
        <section style={{ padding: "40px 0" }}>
          <p style={{ textAlign: "center", fontWeight: 800, fontSize: "0.72rem", color: "#6B7A99", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 8px" }}>
            KEY FEATURES
          </p>
          <h2 style={{ textAlign: "center", fontSize: "1.8rem", fontWeight: 900, color: "#1D2B53", margin: "0 0 32px" }}>
            Everything you need to stay focused
          </h2>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            gap: 16,
          }}>
            {FEATURES.map((f) => (
              <div key={f.title} className="fv-card" style={{ textAlign: "center" }}>
                <div style={{ fontSize: "2rem", marginBottom: 8 }}>{f.icon}</div>
                <p style={{ margin: "0 0 4px", fontWeight: 800, fontSize: "0.85rem", color: "#1D2B53" }}>{f.title}</p>
                <p style={{ margin: 0, fontSize: "0.72rem", color: "#6B7A99", lineHeight: 1.4 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── DESIGN SYSTEM ── */}
        <section style={{ padding: "40px 0", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
          {/* Colors */}
          <div className="fv-card">
            <p style={{ margin: "0 0 12px", fontWeight: 800, fontSize: "0.72rem", color: "#6B7A99", textTransform: "uppercase", letterSpacing: "0.08em" }}>COLOR PALETTE</p>
            <div className="row gap-10">
              {["#5EA9FF", "#8EC5FF", "#7EDC8A", "#FFD45E", "#FF7B7B"].map((c) => (
                <div key={c} style={{ width: 32, height: 32, borderRadius: "50%", background: c, border: "2px solid white", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }} />
              ))}
            </div>
          </div>

          {/* Typography */}
          <div className="fv-card">
            <p style={{ margin: "0 0 12px", fontWeight: 800, fontSize: "0.72rem", color: "#6B7A99", textTransform: "uppercase", letterSpacing: "0.08em" }}>TYPOGRAPHY</p>
            <p style={{ margin: 0, fontSize: "2rem", fontWeight: 900, color: "#1D2B53", lineHeight: 1 }}>Aa</p>
            <p style={{ margin: "4px 0 0", fontSize: "0.78rem", fontWeight: 700, color: "#6B7A99" }}>Poppins</p>
          </div>

          {/* Quote */}
          <div className="fv-card fv-card-soft-blue">
            <p style={{ margin: 0, fontSize: "0.85rem", fontWeight: 700, color: "#3A8FE8", lineHeight: 1.6 }}>
              "The more you focus in real life, the more your city comes to life."
            </p>
            <div style={{ marginTop: 12 }}>
              <Mascot size={28} mood="happy" />
            </div>
          </div>
        </section>
      </div>

      {/* ── CTA ── */}
      <div style={{
        background: "linear-gradient(135deg, #5EA9FF, #3D8FE8)",
        padding: "60px 24px",
        textAlign: "center",
      }}>
        <Mascot size={80} mood="celebrate" float className="fv-mascot-float" />
        <h2 style={{ margin: "16px 0 8px", fontSize: "1.8rem", fontWeight: 900, color: "white" }}>
          Ready to build your future?
        </h2>
        <p style={{ margin: "0 0 24px", color: "rgba(255,255,255,0.85)", fontSize: "0.95rem" }}>
          Join thousands of students building their cities one focus session at a time.
        </p>
        <Link href="/onboarding" className="fv-btn fv-btn-lg" style={{
          background: "white",
          color: "#5EA9FF",
          boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
        }}>
          Start for Free
        </Link>
      </div>
    </div>
  );
}
