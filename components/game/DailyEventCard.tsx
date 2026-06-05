"use client";

import { useState, useTransition } from "react";
import type { DailyEvent } from "@/lib/types";
import { resolveEvent } from "@/lib/actions/game-state";

interface Props {
  event: DailyEvent;
  onResolved: (effect: Record<string, unknown>) => void;
}

export function DailyEventCard({ event, onResolved }: Props) {
  const [chosen, setChosen] = useState<number | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<string | null>(null);

  if (dismissed) return null;

  function handleChoice(idx: number) {
    if (chosen !== null || isPending) return;
    setChosen(idx);
    startTransition(async () => {
      try {
        const result = await resolveEvent(idx);
        if (result.success) {
          const e = result.effect;
          const parts: string[] = [];
          if (e.gold && e.gold > 0)  parts.push(`+${e.gold}🪙`);
          if (e.gold && e.gold < 0)  parts.push(`${e.gold}🪙`);
          if (e.energy && e.energy > 0) parts.push(`+${e.energy}⚡`);
          if (e.happiness && e.happiness > 0) parts.push(`+${e.happiness} happiness`);
          if (e.happiness && e.happiness < 0) parts.push(`${e.happiness} happiness`);
          if (e.constructionDiscount) parts.push("50% build discount active!");
          if (e.specialCitizen) parts.push(`${e.specialCitizen} citizen gained!`);
          setFeedback(parts.length > 0 ? parts.join(" · ") : "Done!");
          onResolved(e as Record<string, unknown>);
          setTimeout(() => setDismissed(true), 2200);
        }
      } catch {
        setChosen(null);
      }
    });
  }

  function handleDismiss() {
    // Dismissing without choosing = ignore = negative outcome (choice index 1 = ignore)
    if (chosen !== null) { setDismissed(true); return; }
    handleChoice(1);
  }

  return (
    <div style={{
      margin: "0 0 14px",
      background: "linear-gradient(135deg, #1D2B53, #2D3F6B)",
      borderRadius: 18,
      padding: "14px 16px",
      boxShadow: "0 4px 20px rgba(29,43,83,0.18)",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Dismiss button */}
      <button
        onClick={handleDismiss}
        disabled={isPending}
        style={{
          position: "absolute", top: 10, right: 10,
          background: "rgba(255,255,255,0.12)", border: "none", borderRadius: 8,
          width: 26, height: 26, cursor: "pointer", color: "rgba(255,255,255,0.7)",
          fontSize: "0.9rem", display: "flex", alignItems: "center", justifyContent: "center",
        }}
      >
        ✕
      </button>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
        <span style={{ fontSize: "1.6rem" }}>{event.icon}</span>
        <div>
          <p style={{ margin: 0, fontSize: "0.65rem", fontWeight: 700, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Today&apos;s Event
          </p>
          <p style={{ margin: 0, fontWeight: 900, fontSize: "0.92rem", color: "white" }}>{event.title}</p>
        </div>
      </div>

      <p style={{ margin: "0 0 12px", fontSize: "0.8rem", color: "rgba(255,255,255,0.8)", lineHeight: 1.5 }}>
        {event.description}
      </p>

      {feedback ? (
        <div style={{
          background: "rgba(126,220,138,0.2)",
          border: "1px solid rgba(126,220,138,0.4)",
          borderRadius: 10,
          padding: "8px 12px",
          fontSize: "0.82rem",
          fontWeight: 700,
          color: "#7EDC8A",
        }}>
          ✓ {feedback}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {(event.choices ?? []).map((choice, i) => (
            <button
              key={i}
              onClick={() => handleChoice(i)}
              disabled={isPending || chosen !== null}
              style={{
                background: chosen === i ? "rgba(94,169,255,0.3)" : "rgba(255,255,255,0.1)",
                border: `1.5px solid ${chosen === i ? "#5EA9FF" : "rgba(255,255,255,0.2)"}`,
                borderRadius: 12,
                padding: "10px 10px",
                cursor: isPending || chosen !== null ? "not-allowed" : "pointer",
                textAlign: "left",
                transition: "all 0.15s",
                fontFamily: "inherit",
              }}
            >
              <p style={{ margin: "0 0 2px", fontWeight: 800, fontSize: "0.78rem", color: "white" }}>{choice.label}</p>
              <p style={{ margin: 0, fontSize: "0.68rem", color: "rgba(255,255,255,0.65)", lineHeight: 1.3 }}>{choice.description}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
