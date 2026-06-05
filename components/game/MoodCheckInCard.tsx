"use client";

import { useState, useTransition } from "react";
import { useStore } from "@/lib/store";
import { saveMoodCheckIn } from "@/lib/actions/mood";
import { fvToast } from "@/lib/toast";
import { useTranslations } from "next-intl";

const MOOD_KEYS = [
  { key: "mood_great", emoji: "😄", tone: "rested"    },
  { key: "mood_good",  emoji: "🙂", tone: "rested"    },
  { key: "mood_okay",  emoji: "😐", tone: "steady"    },
  { key: "mood_tired", emoji: "😴", tone: "tired"     },
  { key: "mood_stressed",    emoji: "😰", tone: "overloaded" },
  { key: "mood_overwhelmed", emoji: "😫", tone: "overloaded" },
] as const;

type Tone = "rested" | "steady" | "tired" | "overloaded";

export function MoodCheckInCard() {
  const { state, patch } = useStore();
  const t = useTranslations("mood");
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
          {MOOD_KEYS.find(m => t(m.key) === latestMood?.answers?.[0])?.emoji ?? "💚"}
        </span>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontWeight: 700, fontSize: "0.78rem", color: "#059669" }}>
            {t("card_checked")}
          </p>
          {latestMood && (
            <p style={{ margin: 0, fontSize: "0.68rem", color: "#6B7A99" }}>
              {latestMood.answers?.[0]} · 🪙 +{latestMood.goldAwarded} {t("earned_note")}
            </p>
          )}
        </div>
      </div>
    );
  }

  function handleSelect(mood: typeof MOOD_KEYS[number]) {
    if (isPending) return;
    const label = t(mood.key);
    setSelected(label);
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
            answers: [label],
            goldAwarded: 50,
          },
          ...(s.moods ?? []),
        ],
      }));

      const result = await saveMoodCheckIn(label, isBurnout);
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
          💭 {t("card_title")}
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
        {MOOD_KEYS.map((mood) => {
          const label = t(mood.key);
          return (
            <button
              key={mood.key}
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
                border: `1.5px solid ${selected === label ? "#5EA9FF" : "#E8F0FF"}`,
                background: selected === label ? "#EBF5FF" : "white",
                cursor: isPending ? "not-allowed" : "pointer",
                transition: "all 0.15s",
                opacity: isPending && selected !== label ? 0.5 : 1,
              }}
            >
              <span style={{ fontSize: "1.3rem", lineHeight: 1 }}>{mood.emoji}</span>
              <span style={{
                fontSize: "0.54rem", fontWeight: 700,
                color: selected === label ? "#5EA9FF" : "#6B7A99",
              }}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
