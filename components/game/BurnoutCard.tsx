"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { analyzeBurnoutRisk } from "@/lib/actions/burnout";
import type { BurnoutResult } from "@/lib/actions/burnout";
import { useLocale } from "next-intl";

const LEVEL_STYLES = {
  mild:     { border: "1px solid #93C5FD", background: "linear-gradient(135deg, #EFF6FF, #DBEAFE)", icon: "💙" },
  moderate: { border: "1px solid #FCD34D", background: "linear-gradient(135deg, #FFFBEB, #FEF3C7)", icon: "⚡" },
  high:     { border: "1px solid #FCA5A5", background: "linear-gradient(135deg, #FFF5F5, #FEE2E2)", icon: "🔴" },
};

export function BurnoutCard() {
  const [result, setResult] = useState<BurnoutResult | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const locale = useLocale();
  const isTh = locale === "th";

  useEffect(() => {
    analyzeBurnoutRisk().then(setResult).catch(() => {});
  }, []);

  if (!result || result.level === "none" || dismissed) return null;

  const styles = LEVEL_STYLES[result.level];
  const message = isTh ? result.messageTh : result.message;

  return (
    <div
      className="animate-fade-up"
      style={{
        borderRadius: 14,
        border: styles.border,
        background: styles.background,
        padding: "12px 14px",
        marginBottom: 14,
        position: "relative",
      }}
    >
      <button
        onClick={() => setDismissed(true)}
        style={{
          position: "absolute", top: 8, right: 8,
          background: "none", border: "none", cursor: "pointer",
          color: "#6B7A99", padding: 2,
        }}
      >
        <X size={14} />
      </button>

      <div style={{ paddingRight: 20 }}>
        <p style={{ margin: "0 0 4px", fontWeight: 800, fontSize: "0.82rem", color: "#1D2B53", display: "flex", alignItems: "center", gap: 6 }}>
          {styles.icon} {isTh
            ? (result.level === "high" ? "คุณอาจกำลังเหนื่อยมาก" : result.level === "moderate" ? "สังเกตสัญญาณเหนื่อย" : "ทำได้ดีมาก ดูแลตัวเองด้วยนะ")
            : (result.level === "high" ? "Check in with yourself" : result.level === "moderate" ? "Signs of fatigue detected" : "You're doing great — keep it balanced")}
        </p>
        <p style={{ margin: 0, fontSize: "0.78rem", color: "#374151", lineHeight: 1.5 }}>
          {message}
        </p>
      </div>
    </div>
  );
}
