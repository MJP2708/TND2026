"use client";

import Link from "next/link";
import { useStore } from "@/lib/store";
import { Mascot } from "@/components/focusville/Mascot";

export default function OnboardingPage() {
  const { patch } = useStore();

  function handleStart() {
    patch((s) => ({ ...s, hasOnboarded: true }));
  }

  return (
    <div style={{
      minHeight: "100dvh",
      background: "linear-gradient(180deg, #B8E4FF 0%, #D4EEFF 35%, #F5FAFF 70%)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "flex-end",
      fontFamily: "var(--font-poppins, Poppins, system-ui, sans-serif)",
      position: "relative",
      overflow: "hidden",
      maxWidth: 430,
      margin: "0 auto",
    }}>
      {/* City skyline backdrop */}
      <div style={{
        position: "absolute",
        bottom: 200,
        left: 0,
        right: 0,
        height: 260,
        overflow: "hidden",
      }}>
        {[
          { l: "0%",   w: 60, h: 160, c: "#7BBBF5" },
          { l: "8%",   w: 45, h: 100, c: "#8EC5FF" },
          { l: "16%",  w: 55, h: 130, c: "#5EA9FF" },
          { l: "24%",  w: 40, h: 80,  c: "#A8D4FF" },
          { l: "32%",  w: 70, h: 200, c: "#6EAEF0" },
          { l: "44%",  w: 50, h: 140, c: "#9AC8F8" },
          { l: "54%",  w: 45, h: 110, c: "#7BBBF5" },
          { l: "63%",  w: 65, h: 180, c: "#5EA9FF" },
          { l: "74%",  w: 40, h: 90,  c: "#8EC5FF" },
          { l: "82%",  w: 55, h: 150, c: "#6EAEF0" },
          { l: "90%",  w: 50, h: 120, c: "#9AC8F8" },
        ].map((b, i) => (
          <div key={i} style={{
            position: "absolute",
            bottom: 0,
            left: b.l,
            width: b.w,
            height: b.h,
            background: b.c,
            borderRadius: "6px 6px 0 0",
            opacity: 0.7,
          }} />
        ))}
        {["5%", "22%", "50%", "78%", "93%"].map((x, i) => (
          <div key={i} style={{ position: "absolute", bottom: 0, left: x, fontSize: "2rem" }}>🌳</div>
        ))}
      </div>

      {/* Clouds */}
      {[
        { top: "8%",  left: "10%", sz: 1.0, delay: 0 },
        { top: "12%", left: "60%", sz: 0.7, delay: 0.7 },
        { top: "20%", left: "30%", sz: 0.85, delay: 1.4 },
      ].map((c, i) => (
        <div key={i} style={{
          position: "absolute",
          top: c.top,
          left: c.left,
          fontSize: `${c.sz * 2.5}rem`,
          opacity: 0.8,
          animation: `mascot-float ${3 + i}s ease-in-out infinite`,
          animationDelay: `${c.delay}s`,
        }}>
          ☁️
        </div>
      ))}

      {/* Card panel */}
      <div style={{
        background: "white",
        borderRadius: "32px 32px 0 0",
        padding: "32px 28px 48px",
        width: "100%",
        textAlign: "center",
        boxShadow: "0 -8px 40px rgba(94, 169, 255, 0.15)",
        position: "relative",
        zIndex: 10,
      }}>
        {/* Mascot peeking above card */}
        <div style={{
          position: "absolute",
          top: -60,
          left: "50%",
          transform: "translateX(-50%)",
          animation: "mascot-float 3s ease-in-out infinite",
        }}>
          <Mascot size={80} mood="happy" />
        </div>

        <div style={{ marginTop: 28 }}>
          <p style={{ margin: "0 0 4px", fontSize: "0.7rem", fontWeight: 800, color: "#6B7A99", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Welcome to
          </p>
          <h1 style={{ margin: "0 0 6px", fontSize: "2.2rem", fontWeight: 900, color: "#1D2B53" }}>
            <span style={{ color: "#5EA9FF" }}>Focus</span>Ville
          </h1>
          <p style={{ margin: "0 0 8px", fontSize: "0.88rem", fontWeight: 600, color: "#6B7A99" }}>
            Your goals. Your city. Your future.
          </p>
        </div>

        <div className="stack gap-12" style={{ marginTop: 28 }}>
          <Link
            href="/plan"
            className="fv-btn fv-btn-primary fv-btn-lg fv-btn-full"
            onClick={handleStart}
          >
            Get Started
          </Link>
          <Link
            href="/login"
            className="fv-btn fv-btn-ghost fv-btn-full"
          >
            I already have an account
          </Link>
        </div>

        <div className="row gap-6 center" style={{ marginTop: 20 }}>
          {[true, false, false].map((active, i) => (
            <div key={i} style={{
              width: active ? 20 : 8,
              height: 8,
              borderRadius: 4,
              background: active ? "#5EA9FF" : "#D6E9FF",
            }} />
          ))}
        </div>
      </div>
    </div>
  );
}
