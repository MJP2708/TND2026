"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";

type Props = {
  taskTitle: string;
  baseGold: number;
  baseXp: number;
  onConfirm: (pct: number) => void;
  onClose: () => void;
};

const OPTIONS = [25, 50, 75, 100] as const;

export function CompletionSheet({ taskTitle, baseGold, baseXp, onConfirm, onClose }: Props) {
  const t = useTranslations("completion");
  const [selected, setSelected] = useState<number>(100);

  const previewGold = Math.floor(baseGold * (selected / 100));
  const previewXp   = Math.floor(baseXp   * (selected / 100));

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, zIndex: 200,
          background: "rgba(0,0,0,0.35)",
        }}
      />

      {/* Sheet */}
      <div style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 201,
        background: "white",
        borderRadius: "20px 20px 0 0",
        padding: "20px 20px 32px",
        boxShadow: "0 -8px 32px rgba(0,0,0,0.12)",
        animation: "slideUp 0.25s ease",
      }}>
        <style>{`@keyframes slideUp { from { transform: translateY(100%) } to { transform: translateY(0) } }`}</style>

        <div className="row between" style={{ marginBottom: 12 }}>
          <p style={{ margin: 0, fontWeight: 800, fontSize: "0.95rem", color: "#1D2B53" }}>
            {t("title")}
          </p>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#6B7A99" }}>
            <X size={18} />
          </button>
        </div>

        <p style={{ margin: "0 0 16px", fontSize: "0.82rem", color: "#6B7A99", lineHeight: 1.4 }}>
          &ldquo;{taskTitle}&rdquo;
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 16 }}>
          {OPTIONS.map((pct) => (
            <button
              key={pct}
              onClick={() => setSelected(pct)}
              style={{
                padding: "12px 0",
                borderRadius: 14,
                border: `2px solid ${selected === pct ? "#5EA9FF" : "#D6E9FF"}`,
                background: selected === pct ? "#EBF5FF" : "white",
                cursor: "pointer",
                fontFamily: "inherit",
                fontWeight: 800,
                fontSize: "0.95rem",
                color: selected === pct ? "#5EA9FF" : "#1D2B53",
              }}
            >
              {pct === 100 ? "✅ 100%" : `${pct}%`}
            </button>
          ))}
        </div>

        <div style={{
          background: "#F0F8FF",
          borderRadius: 12,
          padding: "10px 14px",
          marginBottom: 16,
          textAlign: "center",
        }}>
          <p style={{ margin: 0, fontWeight: 800, color: "#5EA9FF", fontSize: "0.88rem" }}>
            {selected === 100
              ? t("full_reward", { gold: previewGold, xp: previewXp })
              : t("partial_reward", { pct: selected, gold: previewGold, xp: previewXp })}
          </p>
        </div>

        <button
          className="fv-btn fv-btn-primary fv-btn-full fv-btn-lg"
          onClick={() => onConfirm(selected)}
        >
          {t("confirm", { pct: selected })}
        </button>
      </div>
    </>
  );
}
