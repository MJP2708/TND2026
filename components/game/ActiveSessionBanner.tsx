"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Play } from "lucide-react";

type SavedTimer = { taskId: string; elapsed: number; phase: string; savedAt: number };

export function ActiveSessionBanner() {
  const TIMER_KEY = "tf:focus:timer";
  const [elapsed, setElapsed] = useState<number | null>(null);
  const [phase, setPhase] = useState<string>("paused");

  // Read localStorage and initialize elapsed on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(TIMER_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw) as SavedTimer;
      const ageMs = Date.now() - saved.savedAt;
      if (ageMs >= 24 * 60 * 60 * 1000) return;
      if (saved.phase !== "running" && saved.phase !== "paused") return;

      const initial = saved.phase === "running"
        ? saved.elapsed + Math.floor(ageMs / 1000)
        : saved.elapsed;

      // eslint-disable-next-line react-hooks/set-state-in-effect
      setElapsed(initial);
      setPhase(saved.phase);
    } catch { /* ignore */ }
  }, []);

  // Tick once per second when running
  useEffect(() => {
    if (phase !== "running" || elapsed === null) return;
    const id = setInterval(() => setElapsed((e) => (e ?? 0) + 1), 1000);
    return () => clearInterval(id);
  }, [phase, elapsed]);

  if (elapsed === null) return null;

  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;

  return (
    <Link href="/focus" style={{ textDecoration: "none", display: "block" }}>
      <div style={{
        background: "linear-gradient(90deg, #1D2B53, #2D3F6B)",
        color: "white",
        padding: "8px 16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 8,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: phase === "running" ? "#7EDC8A" : "#FFD45E",
            animation: phase === "running" ? "pulse-dot 1.5s ease-in-out infinite" : "none",
          }} />
          <span style={{ fontSize: "0.78rem", fontWeight: 700 }}>
            {phase === "running" ? "Focus session active" : "Session paused"}
            {" · "}{mins}m {secs.toString().padStart(2, "0")}s
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: "0.72rem", fontWeight: 700, color: "#7EDC8A" }}>
          <Play size={12} fill="#7EDC8A" />
          Resume
        </div>
      </div>
    </Link>
  );
}
