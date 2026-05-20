"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { FVShell } from "@/components/focusville/FVShell";
import { Mascot } from "@/components/focusville/Mascot";
import { Heart, Sparkles } from "lucide-react";
import { generatePlan } from "@/lib/ai-planner";
import { saveMoodCheckIn } from "@/lib/actions/mood";

type MoodState = "checkin" | "burnout" | "done";

const MOODS = [
  { label: "Great",       emoji: "😄", color: "#7EDC8A", bg: "#F0FFF4" },
  { label: "Good",        emoji: "🙂", color: "#5EA9FF", bg: "#EBF5FF" },
  { label: "Okay",        emoji: "😐", color: "#FFD45E", bg: "#FFFDF0" },
  { label: "Tired",       emoji: "😴", color: "#8EC5FF", bg: "#EBF5FF" },
  { label: "Stressed",    emoji: "😰", color: "#FFAD5E", bg: "#FFF5EB" },
  { label: "Overwhelmed", emoji: "😫", color: "#FF7B7B", bg: "#FFF5F5" },
  { label: "Sad",         emoji: "😢", color: "#A78BFA", bg: "#F5F0FF" },
  { label: "Anxious",     emoji: "😬", color: "#FFD45E", bg: "#FFFDF0" },
  { label: "Meh",         emoji: "😑", color: "#6B7A99", bg: "#F5FAFF" },
];

const BURNOUT_SIGNS = ["Stressed", "Overwhelmed", "Tired", "Anxious"];

const AI_SUGGESTIONS = {
  burnout: [
    "Reduce daily tasks by 30%",
    "Add recovery time between sessions",
    "Focus on what matters most",
  ],
  normal: [
    "Keep up the momentum",
    "Try a 25-min Pomodoro session",
    "Review your progress today",
  ],
};

export default function MoodPage() {
  const { state, patch } = useStore();
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);
  const [screen, setScreen]     = useState<MoodState>("checkin");

  const todayKey = new Date().toISOString().slice(0, 10);
  const alreadyCheckedIn = state.lastMoodDate === todayKey;
  const isBurnout = selected ? BURNOUT_SIGNS.includes(selected) : false;

  function handleContinue() {
    if (!selected || alreadyCheckedIn) return;
    const goldReward = 50;
    // Optimistic update
    patch((s) => ({
      ...s,
      gold: s.gold + goldReward,
      lastMoodDate: todayKey,
      moods: [
        {
          id: `m-${Date.now()}`,
          date: new Date().toISOString(),
          tone: isBurnout ? "overloaded" : selected === "Great" || selected === "Good" ? "rested" : selected === "Tired" ? "tired" : "steady",
          answers: [selected],
          goldAwarded: goldReward,
        },
        ...s.moods,
      ],
    }));
    // Persist to DB (best-effort)
    saveMoodCheckIn(selected, isBurnout).catch(() => {});
    setScreen(isBurnout ? "burnout" : "done");
  }

  function handleSeePlan() {
    if (!state.goal) { router.push("/plan"); return; }
    // Lighten the plan: regenerate with "low" energy
    const lighterGoal = { ...state.goal, energy: "low" as const };
    const newTasks = generatePlan(lighterGoal);
    patch((s) => ({ ...s, tasks: newTasks }));
    router.push("/plan");
  }

  /* ── Already checked in today ── */
  if (alreadyCheckedIn && screen === "checkin") {
    const latestMood = state.moods[0];
    return (
      <FVShell>
        <div style={{ padding: "40px 20px", textAlign: "center" }}>
          <Mascot size={90} mood="happy" float />
          <h2 style={{ margin: "16px 0 8px", fontWeight: 900, color: "#1D2B53", fontSize: "1.4rem" }}>
            Already checked in today! 💚
          </h2>
          <p style={{ margin: "0 0 20px", color: "#6B7A99", fontSize: "0.88rem" }}>
            Come back tomorrow for your next reward.
          </p>
          {latestMood && (
            <div className="fv-card" style={{ marginBottom: 20, textAlign: "left" }}>
              <p style={{ margin: "0 0 6px", fontWeight: 800, fontSize: "0.85rem", color: "#1D2B53" }}>Today&apos;s mood</p>
              <p style={{ margin: 0, fontSize: "0.9rem", color: "#6B7A99" }}>
                {latestMood.answers[0]} · 🪙 +{latestMood.goldAwarded} earned
              </p>
            </div>
          )}
          <button
            className="fv-btn fv-btn-primary fv-btn-full"
            onClick={() => router.push("/plan")}
          >
            View My Plan
          </button>
        </div>
      </FVShell>
    );
  }

  /* ── Done screen ── */
  if (screen === "done") {
    return (
      <FVShell>
        <div style={{ padding: "40px 20px", textAlign: "center" }}>
          <Mascot size={90} mood="happy" float />
          <h2 style={{ margin: "16px 0 8px", fontWeight: 900, color: "#1D2B53", fontSize: "1.5rem" }}>
            Thanks for checking in! 💚
          </h2>
          <p style={{ margin: "0 0 24px", color: "#6B7A99", fontSize: "0.88rem" }}>
            You earned a check-in reward
          </p>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#FFF8E7", border: "1px solid #FFE08A", borderRadius: 999, padding: "10px 20px", marginBottom: 24 }}>
            <span style={{ fontSize: "1.2rem" }}>🪙</span>
            <span style={{ fontWeight: 900, fontSize: "1.1rem", color: "#C17D00" }}>+50</span>
            <span style={{ fontWeight: 600, color: "#6B7A99", fontSize: "0.85rem" }}>Check-in reward</span>
          </div>
          <div className="fv-card" style={{ marginBottom: 16, textAlign: "left" }}>
            <div className="row gap-10">
              <Sparkles size={18} color="#5EA9FF" />
              <p style={{ margin: 0, fontWeight: 800, fontSize: "0.85rem", color: "#1D2B53" }}>AI Suggestion</p>
            </div>
            <p style={{ margin: "8px 0 10px", fontSize: "0.82rem", color: "#6B7A99" }}>
              Let&apos;s keep your plan for the next 3 days:
            </p>
            {AI_SUGGESTIONS.normal.map((s, i) => (
              <div key={i} className="row gap-8" style={{ marginBottom: 6 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#5EA9FF", flexShrink: 0, marginTop: 4 }} />
                <p style={{ margin: 0, fontSize: "0.82rem", color: "#1D2B53", fontWeight: 600 }}>{s}</p>
              </div>
            ))}
          </div>
          <button
            className="fv-btn fv-btn-primary fv-btn-full"
            onClick={() => router.push("/plan")}
          >
            View My Plan
          </button>
        </div>
      </FVShell>
    );
  }

  /* ── Burnout support screen ── */
  if (screen === "burnout") {
    return (
      <FVShell>
        <div style={{ padding: "24px 20px" }}>
          <div className="fv-burnout-card animate-fade-up" style={{ marginBottom: 16 }}>
            <div className="row gap-10" style={{ marginBottom: 10 }}>
              <div style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: "#FF7B7B",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}>
                <Heart size={16} color="white" fill="white" />
              </div>
              <p style={{ margin: 0, fontWeight: 800, fontSize: "0.9rem", color: "#1D2B53" }}>
                It looks like you&apos;ve been under a lot of pressure lately.
              </p>
            </div>
            <p style={{ margin: 0, fontSize: "0.85rem", color: "#6B7A99", lineHeight: 1.6 }}>
              Remember, rest is part of the process too.
            </p>
          </div>

          <div className="fv-card animate-fade-up delay-1" style={{ marginBottom: 16 }}>
            <div className="row gap-8" style={{ marginBottom: 10 }}>
              <Sparkles size={16} color="#5EA9FF" />
              <p style={{ margin: 0, fontWeight: 800, fontSize: "0.85rem", color: "#1D2B53" }}>AI Suggestion</p>
            </div>
            <p style={{ margin: "0 0 10px", fontSize: "0.82rem", color: "#6B7A99" }}>
              Let&apos;s lighten your plan for the next 3 days.
            </p>
            {AI_SUGGESTIONS.burnout.map((s, i) => (
              <div key={i} className="row gap-8" style={{ marginBottom: 8 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#FF7B7B", flexShrink: 0, marginTop: 5 }} />
                <p style={{ margin: 0, fontSize: "0.82rem", color: "#1D2B53", fontWeight: 600 }}>{s}</p>
              </div>
            ))}
          </div>

          <div style={{ textAlign: "center", marginBottom: 16 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#FFF8E7", border: "1px solid #FFE08A", borderRadius: 999, padding: "8px 16px" }}>
              <span>🪙</span>
              <span style={{ fontWeight: 900, color: "#C17D00" }}>+50</span>
              <span style={{ color: "#6B7A99", fontSize: "0.8rem", fontWeight: 600 }}>Check-in reward</span>
            </div>
          </div>

          <div className="stack gap-10 animate-fade-up delay-2">
            <button
              className="fv-btn fv-btn-primary fv-btn-full fv-btn-lg"
              onClick={handleSeePlan}
            >
              ✨ See New Plan
            </button>
            <button
              className="fv-btn fv-btn-ghost fv-btn-full"
              onClick={() => router.push("/plan")}
            >
              View current plan
            </button>
          </div>
        </div>
      </FVShell>
    );
  }

  /* ── Mood check-in screen ── */
  return (
    <FVShell>
      <div style={{ padding: "20px 20px" }}>
        <div style={{ textAlign: "center", marginBottom: 24 }} className="animate-fade-up">
          <Mascot size={72} mood={selected ? (isBurnout ? "tired" : "happy") : "idle"} float />
          <h1 style={{ margin: "12px 0 4px", fontSize: "1.4rem", fontWeight: 900, color: "#1D2B53" }}>
            How are you feeling today? 💭
          </h1>
          <p style={{ margin: 0, color: "#6B7A99", fontSize: "0.85rem" }}>
            Tap a mood to check in
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 20 }} className="animate-fade-up delay-1">
          {MOODS.map((mood, idx) => (
            <button
              key={mood.label}
              className={`fv-mood-btn ${selected === mood.label ? "selected" : ""}`}
              style={{
                background: selected === mood.label ? mood.bg : "white",
                borderColor: selected === mood.label ? mood.color : "#D6E9FF",
                animationDelay: `${idx * 30}ms`,
              }}
              onClick={() => setSelected(mood.label)}
            >
              <span className="fv-mood-emoji">{mood.emoji}</span>
              <span className="fv-mood-label" style={{ color: selected === mood.label ? mood.color : "#6B7A99" }}>
                {mood.label}
              </span>
            </button>
          ))}
        </div>

        <div style={{
          textAlign: "center",
          marginBottom: 16,
          background: "#FFF8E7",
          border: "1px solid #FFE08A",
          borderRadius: 14,
          padding: "8px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          fontSize: "0.82rem",
          fontWeight: 700,
          color: "#C17D00",
        }} className="animate-fade-up delay-2">
          <span>🪙</span> +50 Gold check-in reward
        </div>

        <button
          className="fv-btn fv-btn-primary fv-btn-full fv-btn-lg animate-fade-up delay-3"
          disabled={!selected}
          onClick={handleContinue}
        >
          Continue
        </button>
      </div>
    </FVShell>
  );
}
