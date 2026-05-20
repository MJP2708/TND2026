"use client";

import { useState, useEffect, useTransition } from "react";
import { Mascot } from "@/components/focusville/Mascot";
import { getMyCompanion, petCompanion, feedCompanion } from "@/lib/actions/companion";
import { useStore } from "@/lib/store";

type CompanionData = {
  id: string;
  friendship: number;
  friendshipLevel: number;
  skin: string;
  hunger: number;
  happiness: number;
  energy: number;
  mood: "happy" | "idle" | "tired";
};

function StatBar({ label, value, color }: { label: string; value: number; color: string }) {
  const barColor = value > 60 ? color : value > 30 ? "#FFD45E" : "#FF7B7B";
  return (
    <div>
      <div className="row between" style={{ marginBottom: 2 }}>
        <span style={{ fontSize: "0.62rem", fontWeight: 700, color: "#6B7A99" }}>{label}</span>
        <span style={{ fontSize: "0.62rem", fontWeight: 700, color: "#1D2B53" }}>{value}%</span>
      </div>
      <div style={{ height: 5, background: "#EBF5FF", borderRadius: 999, overflow: "hidden" }}>
        <div style={{
          height: "100%",
          width: `${value}%`,
          background: barColor,
          borderRadius: 999,
          transition: "width 800ms ease",
        }} />
      </div>
    </div>
  );
}

export function CompanionCard() {
  const { patch } = useStore();
  const [companion, setCompanion] = useState<CompanionData | null>(null);
  const [isPending, startTransition] = useTransition();
  const [floatingText, setFloatingText] = useState<string | null>(null);

  useEffect(() => {
    getMyCompanion().then((c) => setCompanion(c as CompanionData | null)).catch(() => {});
  }, []);

  function showFloat(text: string) {
    setFloatingText(text);
    setTimeout(() => setFloatingText(null), 2000);
  }

  function handlePet() {
    startTransition(async () => {
      const result = await petCompanion();
      if ("success" in result) {
        setCompanion((prev) => prev ? {
          ...prev,
          happiness: Math.min(100, prev.happiness + 20),
          friendship: (result.friendship as number) ?? prev.friendship,
        } : prev);
        showFloat("💚 +Happiness");
      }
    });
  }

  function handleFeed() {
    startTransition(async () => {
      const result = await feedCompanion();
      if ("success" in result) {
        setCompanion((prev) => prev ? { ...prev, hunger: 100 } : prev);
        patch((s) => ({ ...s, gold: Math.max(0, s.gold - 10) }));
        showFloat("🍞 Yummy!");
      } else if ("error" in result) {
        showFloat("❌ " + result.error);
      }
    });
  }

  if (!companion) return null;

  return (
    <div className="fv-card animate-fade-up" style={{ marginBottom: 14, position: "relative", overflow: "visible" }}>
      {/* Floating reaction text */}
      {floatingText && (
        <div style={{
          position: "absolute",
          top: -28,
          left: "50%",
          transform: "translateX(-50%)",
          background: "#1D2B53",
          color: "white",
          borderRadius: 999,
          padding: "4px 12px",
          fontSize: "0.75rem",
          fontWeight: 700,
          whiteSpace: "nowrap",
          animation: "float-up 2s ease forwards",
          zIndex: 10,
        }}>
          {floatingText}
        </div>
      )}

      <div className="row between" style={{ marginBottom: 8 }}>
        <div>
          <p style={{ margin: 0, fontWeight: 800, fontSize: "0.85rem", color: "#1D2B53" }}>
            Fovi 🐾
          </p>
          <p style={{ margin: 0, fontSize: "0.68rem", color: "#6B7A99" }}>
            Lv.{companion.friendshipLevel} Friend · {companion.friendship} Bond XP
          </p>
        </div>
        <div style={{
          background: companion.mood === "happy" ? "#F0FFF4" : companion.mood === "tired" ? "#FFF5F5" : "#EBF5FF",
          border: `1px solid ${companion.mood === "happy" ? "#B8EDCA" : companion.mood === "tired" ? "#FFCCD5" : "#C4DEFF"}`,
          borderRadius: 999,
          padding: "3px 10px",
          fontSize: "0.68rem",
          fontWeight: 700,
          color: companion.mood === "happy" ? "#059669" : companion.mood === "tired" ? "#D94040" : "#5EA9FF",
        }}>
          {companion.mood === "happy" ? "😊 Happy" : companion.mood === "tired" ? "😴 Tired" : "😐 Okay"}
        </div>
      </div>

      <div className="row gap-12" style={{ alignItems: "center", marginBottom: 10 }}>
        <div style={{ flexShrink: 0 }}>
          <Mascot size={64} mood={companion.mood} float />
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 5 }}>
          <StatBar label="🍞 Hunger"    value={companion.hunger}    color="#FFD45E" />
          <StatBar label="💚 Happiness" value={companion.happiness} color="#7EDC8A" />
          <StatBar label="⚡ Energy"    value={companion.energy}    color="#5EA9FF" />
        </div>
      </div>

      {/* Friendship progress bar */}
      <div style={{ marginBottom: 10 }}>
        <div className="row between" style={{ marginBottom: 3 }}>
          <span style={{ fontSize: "0.62rem", fontWeight: 700, color: "#6B7A99" }}>Bond Level {companion.friendshipLevel}</span>
          <span style={{ fontSize: "0.62rem", fontWeight: 700, color: "#A78BFA" }}>{companion.friendship % 100}/100</span>
        </div>
        <div style={{ height: 5, background: "#F5F0FF", borderRadius: 999, overflow: "hidden" }}>
          <div style={{
            height: "100%",
            width: `${(companion.friendship % 100)}%`,
            background: "linear-gradient(90deg, #A78BFA, #7C3AED)",
            borderRadius: 999,
            transition: "width 800ms ease",
          }} />
        </div>
      </div>

      <div className="row gap-8">
        <button
          onClick={handlePet}
          disabled={isPending}
          className="fv-btn fv-btn-secondary fv-btn-sm"
          style={{ flex: 1, height: 34, gap: 4 }}
        >
          🤗 Pet
        </button>
        <button
          onClick={handleFeed}
          disabled={isPending}
          className="fv-btn fv-btn-secondary fv-btn-sm"
          style={{ flex: 1, height: 34, gap: 4, color: "#C17D00", borderColor: "#FFE08A" }}
        >
          🍞 Feed <span style={{ fontSize: "0.65rem", opacity: 0.8 }}>(10🪙)</span>
        </button>
      </div>

      {(companion.hunger < 30 || companion.happiness < 30) && (
        <p style={{ margin: "8px 0 0", fontSize: "0.72rem", color: "#D94040", fontWeight: 700, textAlign: "center" }}>
          {companion.hunger < 30 && companion.happiness < 30
            ? "😢 Fovi is hungry and sad!"
            : companion.hunger < 30
            ? "🍞 Fovi is hungry!"
            : "💔 Fovi misses you!"}
        </p>
      )}
    </div>
  );
}
