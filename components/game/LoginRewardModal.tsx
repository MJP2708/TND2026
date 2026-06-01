"use client";

import { useState, useEffect, useTransition } from "react";
import { Mascot } from "@/components/focusville/Mascot";
import { claimLoginReward } from "@/lib/actions/login-reward";
import { useStore } from "@/lib/store";

type Reward = { gold: number; xp: number; special: string | null; streak: number; newGold: number; newXp: number };

export function LoginRewardModal() {
  const { patch } = useStore();
  const [reward, setReward] = useState<Reward | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [, startTransition] = useTransition();

  useEffect(() => {
    startTransition(async () => {
      try {
        const result = await claimLoginReward();
        if ("claimed" in result && result.claimed) {
          setReward(result as Reward);
          patch((s) => ({ ...s, gold: (result.newGold as number) ?? s.gold, xp: (result.newXp as number) ?? s.xp }));
        }
      } catch { /* ignore */ }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!reward || dismissed) return null;

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      zIndex: 200,
      background: "rgba(29, 43, 83, 0.55)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "0 20px",
      backdropFilter: "blur(6px)",
    }}>
      <div className="fv-card animate-fade-up" style={{
        width: "100%",
        maxWidth: 340,
        padding: "28px 24px",
        textAlign: "center",
        boxShadow: "0 20px 60px rgba(29,43,83,0.3)",
      }}>
        <Mascot size={80} mood="celebrate" float />
        <h2 style={{ margin: "14px 0 4px", fontWeight: 900, color: "#1D2B53", fontSize: "1.3rem" }}>
          Welcome back! 🎉
        </h2>
        <p style={{ margin: "0 0 18px", color: "#6B7A99", fontSize: "0.85rem" }}>
          Login day {reward.streak} — here&apos;s your reward
        </p>

        {/* Reward display */}
        <div style={{ display: "flex", justifyContent: "center", gap: 12, marginBottom: 18 }}>
          <div style={{ background: "#FFF8E7", border: "1px solid #FFE08A", borderRadius: 14, padding: "12px 18px" }}>
            <div style={{ fontSize: "1.5rem" }}>🪙</div>
            <div style={{ fontWeight: 900, fontSize: "1.2rem", color: "#C17D00" }}>+{reward.gold}</div>
            <div style={{ fontSize: "0.65rem", color: "#6B7A99", fontWeight: 600 }}>Gold</div>
          </div>
          {reward.xp > 0 && (
            <div style={{ background: "#EEF2FF", border: "1px solid #C7D2FE", borderRadius: 14, padding: "12px 18px" }}>
              <div style={{ fontSize: "1.5rem" }}>💎</div>
              <div style={{ fontWeight: 900, fontSize: "1.2rem", color: "#6366F1" }}>+{reward.xp}</div>
              <div style={{ fontSize: "0.65rem", color: "#6B7A99", fontWeight: 600 }}>XP</div>
            </div>
          )}
        </div>

        {/* Special badge */}
        {reward.special && (
          <div style={{
            background: "linear-gradient(135deg, #FFF8E7, #FFF0C8)",
            border: "1px solid #FFD45E",
            borderRadius: 12,
            padding: "10px 16px",
            marginBottom: 18,
            fontSize: "0.85rem",
            fontWeight: 800,
            color: "#C17D00",
          }}>
            {reward.special}
          </div>
        )}

        {/* 7-day streak dots */}
        <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 20 }}>
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} style={{
              width: 30,
              height: 30,
              borderRadius: "50%",
              background: i < reward.streak ? "#5EA9FF" : "#EBF5FF",
              border: `2px solid ${i < reward.streak ? "#5EA9FF" : "#D6E9FF"}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "0.68rem",
              fontWeight: 800,
              color: i < reward.streak ? "white" : "#B0BFCC",
            }}>
              {i < reward.streak ? "✓" : i + 1}
            </div>
          ))}
        </div>

        <button
          onClick={() => setDismissed(true)}
          className="fv-btn fv-btn-primary fv-btn-full fv-btn-lg"
        >
          Collect & Play! 🎮
        </button>
      </div>
    </div>
  );
}
