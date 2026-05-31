"use client";

import { useEffect, useState } from "react";
import type { PassiveIncome } from "@/lib/types";

interface Props {
  income: PassiveIncome | null;
  onDismiss: () => void;
}

export function PassiveIncomeToast({ income, onDismiss }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (income && (income.gold > 0 || income.energy > 0)) {
      setVisible(true);
      const t = setTimeout(() => {
        setVisible(false);
        setTimeout(onDismiss, 300);
      }, 4000);
      return () => clearTimeout(t);
    }
  }, [income, onDismiss]);

  if (!income || (income.gold === 0 && income.energy === 0)) return null;

  return (
    <div style={{
      position: "fixed",
      top: 70,
      left: "50%",
      transform: `translateX(-50%) translateY(${visible ? "0" : "-20px"})`,
      opacity: visible ? 1 : 0,
      transition: "all 0.3s ease",
      zIndex: 9998,
      background: "linear-gradient(135deg, #1D2B53, #2D3F6B)",
      color: "white",
      borderRadius: 16,
      padding: "12px 18px",
      boxShadow: "0 4px 24px rgba(29,43,83,0.25)",
      maxWidth: "90vw",
      textAlign: "center",
      pointerEvents: "none",
    }}>
      <p style={{ margin: "0 0 4px", fontSize: "0.72rem", fontWeight: 700, color: "rgba(255,255,255,0.65)" }}>
        Welcome back! You earned while away ({income.hours}h):
      </p>
      <div style={{ display: "flex", justifyContent: "center", gap: 14 }}>
        {income.gold > 0 && (
          <span style={{ fontWeight: 900, fontSize: "1rem" }}>+{income.gold} 🪙</span>
        )}
        {income.energy > 0 && (
          <span style={{ fontWeight: 900, fontSize: "1rem" }}>+{income.energy} ⚡</span>
        )}
      </div>
    </div>
  );
}
