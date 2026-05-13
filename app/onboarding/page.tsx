"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { generatePlan } from "@/lib/ai-planner";
import { AppShell } from "@/components/layout/AppShell";
import type { Goal, EnergyLevel, DifficultyLevel, GoalCategory } from "@/lib/types";

type FormState = {
  title: string;
  deadline: string;
  dailyHours: number;
  energy: EnergyLevel;
  category: GoalCategory;
  difficulty: DifficultyLevel;
};
type FormSetter = <K extends keyof FormState>(k: K, v: FormState[K]) => void;

const CATEGORIES: { value: GoalCategory; label: string; icon: string }[] = [
  { value: "study",    label: "Study / Exam",    icon: "📚" },
  { value: "career",   label: "Career / Work",   icon: "💼" },
  { value: "creative", label: "Creative Project", icon: "🎨" },
  { value: "health",   label: "Health & Fitness", icon: "💪" },
  { value: "personal", label: "Personal Growth",  icon: "🌱" },
  { value: "other",    label: "Other",             icon: "✨" },
];

const defaultDeadline = (() => {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString().slice(0, 10);
})();

export default function OnboardingPage() {
  const router = useRouter();
  const { patch } = useStore();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<FormState>({
    title:      "",
    deadline:   defaultDeadline,
    dailyHours: 2,
    energy:     "balanced",
    category:   "study",
    difficulty: 3,
  });

  const set: FormSetter = (key, val) => {
    setForm((f) => ({ ...f, [key]: val }));
  }

  async function generate() {
    if (!form.title.trim()) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 700));
    const goal: Goal = {
      id:         `goal-${Date.now()}`,
      title:      form.title.trim(),
      deadline:   form.deadline,
      dailyHours: form.dailyHours,
      energy:     form.energy,
      difficulty: form.difficulty,
      category:   form.category,
      createdAt:  new Date().toISOString(),
    };
    patch((s) => ({ ...s, goal, tasks: generatePlan(goal), hasOnboarded: true }));
    router.push("/dashboard");
  }

  const steps = [
    <StepGoal     key="goal"    form={form} set={set} onNext={() => setStep(1)} />,
    <StepDetails  key="details" form={form} set={set} onBack={() => setStep(0)} onNext={() => setStep(2)} />,
    <StepConfirm  key="confirm" form={form} loading={loading} onBack={() => setStep(1)} onGenerate={generate} />,
  ];

  return (
    <AppShell currentRoute="/onboarding">
      <div className="page-header">
        <h1 className="page-title">Set up your goal</h1>
        <p className="page-subtitle">We&apos;ll create a realistic daily plan in seconds.</p>
      </div>

      <div className="row gap-8" style={{ marginBottom: 24 }}>
        {["Your goal", "Details", "Generate"].map((s, i) => (
          <div key={s} className="row gap-6">
            <div
              style={{
                width: 24, height: 24, borderRadius: "50%",
                background: i <= step ? "var(--color-primary)" : "var(--color-border)",
                color: i <= step ? "white" : "var(--color-muted)",
                display: "grid", placeItems: "center",
                fontSize: "0.72rem", fontWeight: 800, flexShrink: 0,
              }}
            >{i + 1}</div>
            <span style={{ fontSize: "0.82rem", fontWeight: i === step ? 700 : 500, color: i === step ? "var(--color-text)" : "var(--color-muted)" }}>{s}</span>
            {i < 2 && <span style={{ color: "var(--color-border)", marginLeft: 6 }}>›</span>}
          </div>
        ))}
      </div>

      <div style={{ maxWidth: 540 }}>{steps[step]}</div>
    </AppShell>
  );
}

function StepGoal({
  form, set, onNext,
}: {
  form: Pick<FormState, "title" | "category">;
  set: FormSetter;
  onNext: () => void;
}) {
  return (
    <div className="stack gap-20">
      <div className="form-group">
        <label className="form-label" htmlFor="goal-title">What is your main goal?</label>
        <input
          id="goal-title"
          type="text"
          className="form-input"
          placeholder="e.g. Pass the mathematics final exam"
          value={form.title}
          onChange={(e) => set("title", e.target.value)}
          style={{ fontSize: "0.97rem" }}
          autoFocus
        />
        <p className="form-hint">One clear goal works better than a list.</p>
      </div>
      <div className="form-group">
        <label className="form-label">Goal category</label>
        <div className="grid-3" style={{ gap: 8 }}>
          {CATEGORIES.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => set("category", c.value)}
              style={{
                padding: "10px 8px", textAlign: "center", cursor: "pointer",
                border: `1.5px solid ${form.category === c.value ? "var(--color-primary)" : "var(--color-border)"}`,
                borderRadius: "var(--r-md)",
                background: form.category === c.value ? "var(--color-primary-soft)" : "var(--color-surface)",
                color: form.category === c.value ? "var(--color-primary)" : "var(--color-text)",
                fontWeight: 600, fontSize: "0.78rem", transition: "all 120ms",
              }}
            >
              <div style={{ fontSize: "1.3rem", marginBottom: 4 }}>{c.icon}</div>
              {c.label}
            </button>
          ))}
        </div>
      </div>
      <button className="btn btn-primary btn-lg" disabled={!form.title.trim()} onClick={onNext} style={{ alignSelf: "flex-start" }}>
        Next →
      </button>
    </div>
  );
}

function StepDetails({
  form, set, onBack, onNext,
}: {
  form: Pick<FormState, "deadline" | "dailyHours" | "energy" | "difficulty">;
  set: FormSetter;
  onBack: () => void;
  onNext: () => void;
}) {
  return (
    <div className="stack gap-20">
      <div className="grid-2">
        <div className="form-group">
          <label className="form-label" htmlFor="deadline">Deadline</label>
          <input
            id="deadline"
            type="date"
            className="form-input"
            value={form.deadline}
            min={new Date().toISOString().slice(0, 10)}
            onChange={(e) => set("deadline", e.target.value)}
          />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="hours">Hours per day</label>
          <select
            id="hours"
            className="form-select"
            value={form.dailyHours}
            onChange={(e) => set("dailyHours", Number(e.target.value) as DifficultyLevel)}
          >
            {[1, 2, 3, 4, 5, 6].map((h) => (
              <option key={h} value={h}>{h} hour{h > 1 ? "s" : ""}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">Energy level</label>
        <div className="mood-chips">
          {(["low", "balanced", "high"] as EnergyLevel[]).map((e) => (
            <button key={e} type="button" className={`mood-chip ${form.energy === e ? "active" : ""}`} onClick={() => set("energy", e)}>
              {e === "low" ? "🔋 Low" : e === "balanced" ? "⚡ Balanced" : "🚀 High"}
            </button>
          ))}
        </div>
        <p className="form-hint">Low energy = shorter tasks, fewer per day.</p>
      </div>
      <div className="form-group">
        <label className="form-label">Preferred difficulty</label>
        <div className="mood-chips">
          {([1, 2, 3, 4, 5] as DifficultyLevel[]).map((d) => (
            <button key={d} type="button" className={`mood-chip ${form.difficulty === d ? "active" : ""}`} onClick={() => set("difficulty", d)}>
              {["Gentle", "Easy", "Standard", "Hard", "Max"][d - 1]}
            </button>
          ))}
        </div>
      </div>
      <div className="row gap-8">
        <button className="btn btn-secondary" onClick={onBack}>← Back</button>
        <button className="btn btn-primary btn-lg" onClick={onNext}>Next →</button>
      </div>
    </div>
  );
}

function StepConfirm({
  form, loading, onBack, onGenerate,
}: {
  form: { title: string; deadline: string; dailyHours: number; energy: string; difficulty: number };
  loading: boolean; onBack: () => void; onGenerate: () => void;
}) {
  const [todayMs] = useState(() => Date.now());
  const days = Math.max(1, Math.ceil((new Date(form.deadline).getTime() - todayMs) / 86_400_000));
  return (
    <div className="stack gap-20">
      <div className="card" style={{ background: "var(--color-primary-soft)", borderColor: "rgba(45,106,97,.25)" }}>
        <div className="stack gap-8">
          <p className="section-label" style={{ margin: 0 }}>Plan summary</p>
          <p style={{ margin: 0, fontWeight: 800, fontSize: "1.05rem" }}>🎯 {form.title}</p>
          <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--color-muted)" }}>
            {days} days · {form.dailyHours}h/day · {form.energy} energy · difficulty {form.difficulty}/5
          </p>
        </div>
      </div>
      <div className="card card-sm">
        <p className="section-label" style={{ margin: "0 0 8px" }}>What gets generated</p>
        <ul style={{ margin: 0, padding: "0 0 0 18px", fontSize: "0.875rem", color: "var(--color-muted)", lineHeight: 1.7 }}>
          <li>Daily tasks sized to your available hours</li>
          <li>Recovery gaps every 3 days</li>
          <li>Gold + XP rewards per task</li>
          <li>Adjustable difficulty after creation</li>
        </ul>
      </div>
      <div className="row gap-8">
        <button className="btn btn-secondary" onClick={onBack}>← Back</button>
        <button className="btn btn-primary btn-lg" disabled={loading} onClick={onGenerate}>
          {loading ? "Generating…" : "✨ Generate my plan"}
        </button>
      </div>
    </div>
  );
}
