"use client";

import { useState, useTransition } from "react";
import { useStore } from "@/lib/store";
import { saveMoodCheckIn } from "@/lib/actions/mood";
import { fvToast } from "@/lib/toast";

const MOODS = [
  { label: "Great",       emoji: "😄", tone: "rested"    },
  { label: "Good",        emoji: "🙂", tone: "rested"    },
  { label: "Okay",        emoji: "😐", tone: "steady"    },
  { label: "Tired",       emoji: "😴", tone: "tired"     },
  { label: "Stressed",    emoji: "😰", tone: "overloaded"},
  { label: "Overwhelmed", emoji: "😫", tone: "overloaded"},
] as const;

type Tone = typeof MOODS[number]["tone"];

export function MoodCheckInCard() {
  const { state, patch } = useStore();
  const [selected, setSelected] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [isPending, startTransition] = useTransition();

  const today = new Date().toISOString().slice(0, 10);
  const alreadyCheckedIn = state.lastMoodDate === today;

  if (alreadyCheckedIn || done) {
    const latestMood = (state.moods ?? [])[0];
    return (
      <div className="fv-card animate-fade-up" style={{
        marginBottom: 14,
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 14px",
        background: "#F0FFF4",
        border: "1px solid #B8EDCA",
      }}>
        <span style={{ fontSize: "1.3rem" }}>
          {MOODS.find(m => m.label === latestMood?.answers?.[0])?.emoji ?? "💚"}
        </span>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontWeight: 700, fontSize: "0.78rem", color: "#059669" }}>
            Mood checked in today ✓
          </p>
          {latestMood && (
            <p style={{ margin: 0, fontSize: "0.68rem", color: "#6B7A99" }}>
              {latestMood.answers?.[0]} · 🪙 +{latestMood.goldAwarded} earned
            </p>
          )}
        </div>
      </div>
    );
  }

  function handleSelect(mood: typeof MOODS[number]) {
    if (isPending) return;
    setSelected(mood.label);
    const isBurnout = mood.tone === "overloaded";

    startTransition(async () => {
      patch((s) => ({
        ...s,
        gold: s.gold + 50,
        lastMoodDate: today,
        moods: [
          {
            id: `m-${Date.now()}`,
            date: new Date().toISOString(),
            tone: mood.tone as Tone,
            answers: [mood.label],
            goldAwarded: 50,
          },
          ...(s.moods ?? []),
        ],
      }));

      const result = await saveMoodCheckIn(mood.label, isBurnout);
      if ("error" in result) {
        fvToast.error(result.error ?? "Failed to save mood");
      } else {
        fvToast.reward("Mood checked in!", 50, 0);
        setDone(true);
      }
    });
  }

  return (
    <div className="fv-card animate-fade-up" style={{ marginBottom: 14 }}>
      <div className="row between" style={{ marginBottom: 8 }}>
        <p style={{ margin: 0, fontWeight: 800, fontSize: "0.82rem", color: "#1D2B53" }}>
          💭 How are you today?
        </p>
        <span style={{
          fontSize: "0.68rem", fontWeight: 700, color: "#C17D00",
          background: "#FFF8E7", border: "1px solid #FFE08A",
          borderRadius: 999, padding: "2px 8px",
        }}>
          🪙 +50
        </span>
      </div>

      <div style={{ display: "flex", gap: 6, justifyContent: "space-between" }}>
        {MOODS.map((mood) => (
          <button
            key={mood.label}
            onClick={() => handleSelect(mood)}
            disabled={isPending}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 3,
              padding: "8px 2px",
              borderRadius: 12,
              border: `1.5px solid ${selected === mood.label ? "#5EA9FF" : "#E8F0FF"}`,
              background: selected === mood.label ? "#EBF5FF" : "white",
              cursor: isPending ? "not-allowed" : "pointer",
              transition: "all 0.15s",
              opacity: isPending && selected !== mood.label ? 0.5 : 1,
            }}
          >
            <span style={{ fontSize: "1.3rem", lineHeight: 1 }}>{mood.emoji}</span>
            <span style={{
              fontSize: "0.54rem", fontWeight: 700,
              color: selected === mood.label ? "#5EA9FF" : "#6B7A99",
            }}>
              {mood.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
