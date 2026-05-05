"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { AppShell } from "@/components/layout/AppShell";
import type { MoodTone } from "@/lib/types";

const QUESTIONS = [
  {
    q: "How rested do you feel today?",
    options: ["Very tired", "A bit tired", "Okay", "Well rested"],
  },
  {
    q: "How is your mental load right now?",
    options: ["Overloaded", "Heavy", "Manageable", "Light"],
  },
  {
    q: "What would help you most today?",
    options: ["Take it slow", "Stay steady", "Push a bit", "Start small"],
  },
];

function toneFromAnswers(answers: string[]): MoodTone {
  const score = answers.reduce((acc, a, i) => {
    const idx = QUESTIONS[i].options.indexOf(a);
    return acc + idx;
  }, 0);
  if (score <= 2) return "overloaded";
  if (score <= 5) return "tired";
  if (score <= 8) return "steady";
  return "rested";
}

const TONE_LABEL: Record<MoodTone, { label: string; icon: string; color: string; tip: string }> = {
  rested: {
    label: "Rested",
    icon: "🌟",
    color: "var(--color-primary)",
    tip: "You're in great shape — take on your hardest task first.",
  },
  steady: {
    label: "Steady",
    icon: "💚",
    color: "var(--color-primary)",
    tip: "Start with something achievable, then build momentum.",
  },
  tired: {
    label: "Tired",
    icon: "🌙",
    color: "var(--color-accent)",
    tip: "Do one short task. Rest is part of the process.",
  },
  overloaded: {
    label: "Overloaded",
    icon: "🌿",
    color: "var(--color-muted)",
    tip: "Skip the heavy tasks today. A short review counts.",
  },
};

export default function MoodPage() {
  const { state, patch, ready } = useStore();
  const [step, setStep] = useState<"check" | "result" | "history">("check");
  const [answers, setAnswers] = useState<string[]>([]);
  const [currentQ, setCurrentQ] = useState(0);

  if (!ready) {
    return (
      <AppShell currentRoute="/mood">
        <div className="empty-state" style={{ paddingTop: 80 }}><p>Loading…</p></div>
      </AppShell>
    );
  }

  const todayDate = new Date().toISOString().slice(0, 10);
  const checkedToday = state.moods.some((m) => m.date.slice(0, 10) === todayDate);

  function pickAnswer(answer: string) {
    const next = [...answers, answer];
    if (currentQ < QUESTIONS.length - 1) {
      setAnswers(next);
      setCurrentQ((q) => q + 1);
    } else {
      const tone = toneFromAnswers(next);
      patch((s) => ({
        ...s,
        gold: s.gold + 25,
        moods: [
          {
            id: `mood-${Date.now()}`,
            date: new Date().toISOString(),
            tone,
            answers: next,
            goldAwarded: 25,
          },
          ...s.moods,
        ],
      }));
      setAnswers(next);
      setStep("result");
    }
  }

  function restart() {
    setAnswers([]);
    setCurrentQ(0);
    setStep("check");
  }

  const latestMood = state.moods[0];
  const latestTone = latestMood ? TONE_LABEL[latestMood.tone] : null;

  return (
    <AppShell currentRoute="/mood">
      <div className="page-header">
        <h1 className="page-title">Mood check-in</h1>
        <p className="page-subtitle">3 quick questions. Earn 25 Gold. No guilt.</p>
      </div>

      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        <div className="stack gap-24">
          {/* Tab row */}
          <div className="row gap-8">
            {(["check", "history"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => { setStep(t); restart(); }}
                style={{
                  padding: "6px 18px",
                  borderRadius: 99,
                  border: `1.5px solid ${step === t || (step === "result" && t === "check") ? "var(--color-primary)" : "var(--color-border)"}`,
                  background: step === t || (step === "result" && t === "check") ? "var(--color-primary)" : "var(--color-surface)",
                  color: step === t || (step === "result" && t === "check") ? "white" : "var(--color-text)",
                  fontWeight: 600,
                  fontSize: "0.8rem",
                  cursor: "pointer",
                  textTransform: "capitalize",
                }}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Check-in */}
          {step === "check" && (
            <div className="card card-lg">
              {checkedToday ? (
                <div className="stack gap-12" style={{ alignItems: "center", textAlign: "center" }}>
                  <span style={{ fontSize: "2rem" }}>✅</span>
                  <p style={{ margin: 0, fontWeight: 800 }}>Already checked in today</p>
                  {latestTone && (
                    <p style={{ margin: 0, color: "var(--color-muted)", fontSize: "0.875rem" }}>
                      Feeling {latestTone.icon} {latestTone.label} · +25 Gold earned
                    </p>
                  )}
                  <button className="btn btn-secondary btn-full" onClick={() => setStep("history")}>
                    See history
                  </button>
                </div>
              ) : (
                <div className="stack gap-20">
                  <div>
                    <p style={{ margin: "0 0 4px", fontSize: "0.7rem", fontWeight: 800, color: "var(--color-muted)", textTransform: "uppercase", letterSpacing: ".07em" }}>
                      Question {currentQ + 1} of {QUESTIONS.length}
                    </p>
                    <div className="progress-track" style={{ marginBottom: 16 }}>
                      <div
                        className="progress-fill"
                        style={{
                          width: `${((currentQ) / QUESTIONS.length) * 100}%`,
                          background: "var(--color-primary)",
                        }}
                      />
                    </div>
                    <h2 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800, lineHeight: 1.4 }}>
                      {QUESTIONS[currentQ].q}
                    </h2>
                  </div>
                  <div className="mood-chips" style={{ flexDirection: "column" }}>
                    {QUESTIONS[currentQ].options.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        className="mood-chip"
                        style={{ textAlign: "left", padding: "12px 16px" }}
                        onClick={() => pickAnswer(opt)}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Result */}
          {step === "result" && latestMood && (
            <div className="card card-lg" style={{ textAlign: "center" }}>
              <div className="stack gap-16" style={{ alignItems: "center" }}>
                <span style={{ fontSize: "3rem" }}>{TONE_LABEL[latestMood.tone].icon}</span>
                <div>
                  <h2 style={{ margin: 0, fontSize: "1.3rem", fontWeight: 900 }}>
                    {TONE_LABEL[latestMood.tone].label}
                  </h2>
                  <p style={{ margin: "6px 0 0", color: "var(--color-muted)", fontSize: "0.875rem", lineHeight: 1.6 }}>
                    {TONE_LABEL[latestMood.tone].tip}
                  </p>
                </div>
                <div
                  className="card"
                  style={{ background: "var(--color-accent-soft)", borderColor: "var(--color-accent)", padding: "10px 20px" }}
                >
                  <p style={{ margin: 0, fontWeight: 800, color: "var(--color-accent)" }}>
                    +25 Gold earned 🎉
                  </p>
                </div>
                <button className="btn btn-secondary btn-full" onClick={() => setStep("history")}>
                  See my mood history
                </button>
              </div>
            </div>
          )}

          {/* History */}
          {step === "history" && (
            <div>
              {state.moods.length === 0 ? (
                <div className="empty-state" style={{ padding: "24px 0" }}>
                  <p>No check-ins yet. Start your first one above.</p>
                </div>
              ) : (
                <div className="stack gap-10">
                  {state.moods.slice(0, 14).map((m) => {
                    const tone = TONE_LABEL[m.tone];
                    return (
                      <div key={m.id} className="card" style={{ display: "flex", gap: 12, alignItems: "center" }}>
                        <span style={{ fontSize: "1.4rem" }}>{tone.icon}</span>
                        <div style={{ flex: 1 }}>
                          <p style={{ margin: 0, fontWeight: 700, fontSize: "0.875rem" }}>{tone.label}</p>
                          <p style={{ margin: "2px 0 0", fontSize: "0.75rem", color: "var(--color-muted)" }}>
                            {new Date(m.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                          </p>
                        </div>
                        <span className="badge badge-amber">+{m.goldAwarded}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Disclaimer */}
          <p style={{ margin: 0, fontSize: "0.72rem", color: "var(--color-muted)", textAlign: "center", lineHeight: 1.6 }}>
            This is a simple wellbeing nudge, not a clinical tool.
            If you&apos;re struggling, please talk to someone you trust.
          </p>
        </div>
      </div>
    </AppShell>
  );
}
