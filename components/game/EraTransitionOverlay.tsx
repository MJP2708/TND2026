"use client";

import { useEffect, useState } from "react";
import type { EraType } from "@/lib/types";

interface Props {
  era: EraType;
  onDismiss: () => void;
}

const ERA_INFO: Record<EraType, { label: string; icon: string; desc: string; color: string }> = {
  pioneer: {
    label: "Pioneer Town",
    icon: "🪨",
    desc: "Your city is just getting started. Build homes, farms, and markets.",
    color: "linear-gradient(135deg, #8B6914, #C49A2B)",
  },
  modern: {
    label: "Modern City",
    icon: "🏙",
    desc: "New buildings unlocked: Office, Gym, Café, Apartment, Library!",
    color: "linear-gradient(135deg, #1565C0, #1E88E5)",
  },
  metropolis: {
    label: "Metropolis",
    icon: "🌆",
    desc: "The pinnacle of city building. Tech Labs, Sky Gardens, and Skyscrapers await!",
    color: "linear-gradient(135deg, #6A1B9A, #AB47BC)",
  },
};

export function EraTransitionOverlay({ era, onDismiss }: Props) {
  const [visible, setVisible] = useState(true);
  const [confettiActive, setConfettiActive] = useState(true);
  const info = ERA_INFO[era];

  useEffect(() => {
    // Auto-dismiss after 6 seconds
    const t = setTimeout(() => {
      setVisible(false);
      setTimeout(onDismiss, 500);
    }, 6000);
    return () => clearTimeout(t);
  }, [onDismiss]);

  useEffect(() => {
    let canvas: HTMLCanvasElement | null = null;

    async function startConfetti() {
      try {
        const confetti = (await import("canvas-confetti")).default;
        canvas = document.createElement("canvas");
        canvas.style.position = "fixed";
        canvas.style.inset = "0";
        canvas.style.width = "100%";
        canvas.style.height = "100%";
        canvas.style.zIndex = "10000";
        canvas.style.pointerEvents = "none";
        document.body.appendChild(canvas);

        const myConfetti = confetti.create(canvas, { resize: true, useWorker: true });
        myConfetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });

        const t2 = setTimeout(() => {
          setConfettiActive(false);
          if (canvas && canvas.parentNode) canvas.parentNode.removeChild(canvas);
        }, 3000);

        return () => {
          clearTimeout(t2);
          if (canvas && canvas.parentNode) canvas.parentNode.removeChild(canvas);
        };
      } catch {
        // canvas-confetti not available
      }
    }

    startConfetti();
    return () => {
      if (canvas && canvas.parentNode) canvas.parentNode.removeChild(canvas);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      onClick={() => { setVisible(false); setTimeout(onDismiss, 300); }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.75)",
        padding: 20,
        cursor: "pointer",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: info.color,
          borderRadius: 24,
          padding: "32px 28px",
          maxWidth: 360,
          width: "100%",
          textAlign: "center",
          boxShadow: "0 12px 48px rgba(0,0,0,0.4)",
          animation: "bounce-in 0.5s cubic-bezier(0.36,0.07,0.19,0.97)",
        }}
      >
        <div style={{ fontSize: "3.5rem", marginBottom: 10 }}>{info.icon}</div>
        <p style={{ margin: "0 0 6px", fontSize: "0.72rem", fontWeight: 700, color: "rgba(255,255,255,0.7)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
          Era Unlocked!
        </p>
        <h2 style={{ margin: "0 0 10px", fontSize: "1.5rem", fontWeight: 900, color: "white" }}>
          {info.label}
        </h2>
        <p style={{ margin: "0 0 20px", fontSize: "0.85rem", color: "rgba(255,255,255,0.85)", lineHeight: 1.5 }}>
          {info.desc}
        </p>
        <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 20 }}>
          <div style={{ background: "rgba(255,255,255,0.2)", borderRadius: 10, padding: "6px 12px", fontSize: "0.78rem", fontWeight: 700, color: "white" }}>
            +20 😊 Happiness
          </div>
          <div style={{ background: "rgba(255,255,255,0.2)", borderRadius: 10, padding: "6px 12px", fontSize: "0.78rem", fontWeight: 700, color: "white" }}>
            New buildings!
          </div>
        </div>
        <button
          onClick={() => { setVisible(false); setTimeout(onDismiss, 300); }}
          style={{
            background: "rgba(255,255,255,0.2)",
            border: "1.5px solid rgba(255,255,255,0.4)",
            borderRadius: 14,
            padding: "10px 28px",
            cursor: "pointer",
            fontWeight: 800,
            fontSize: "0.88rem",
            color: "white",
            fontFamily: "inherit",
          }}
        >
          Let&apos;s build! 🏗
        </button>
      </div>
    </div>
  );
}
