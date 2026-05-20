"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { generatePlan } from "@/lib/ai-planner";
import { savePlan, completeTask as completeTaskDB } from "@/lib/actions/tasks";
import { archiveGoal, deleteGoal, pauseGoal } from "@/lib/actions/goals";
import { FVShell } from "@/components/focusville/FVShell";
import { Mascot } from "@/components/focusville/Mascot";
import { GoalCountdown } from "@/components/game/GoalCountdown";
import { ChevronLeft, Calendar, Sparkles, Clock, CheckCircle2, Play } from "lucide-react";
import type { Goal, GoalCategory, EnergyLevel, DifficultyLevel, Task } from "@/lib/types";

type Step = "goal" | "planning" | "plan";

const CATEGORY_ICONS: Record<GoalCategory, string> = {
  study:    "📚",
  career:   "💼",
  creative: "🎨",
  health:   "💪",
  personal: "🌱",
  other:    "✨",
};

function groupByCategory(tasks: ReturnType<typeof generatePlan>) {
  const map = new Map<string, { count: number; minutes: number }>();
  for (const t of tasks) {
    if (t.isRecovery) continue;
    const e = map.get(t.category) ?? { count: 0, minutes: 0 };
    e.count++;
    e.minutes += t.minutes;
    map.set(t.category, e);
  }
  return Array.from(map.entries()).map(([cat, v]) => ({ cat, ...v }));
}

export default function PlanPage() {
  const { state, patch, ready } = useStore();
  const router = useRouter();

  const [step, setStep] = useState<Step>(state.goal ? "plan" : "goal");
  const [goalText, setGoalText] = useState(state.goal?.title ?? "");
  const [deadline, setDeadline] = useState(state.goal?.deadline ?? (() => {
    const d = new Date(); d.setDate(d.getDate() + 30);
    return d.toISOString().slice(0, 10);
  })());
  const [energy, setEnergy] = useState<EnergyLevel>("balanced");
  const [category, setCategory] = useState<GoalCategory>("study");
  const [generating, setGenerating] = useState(false);
  const [previewTasks, setPreviewTasks] = useState(state.tasks);
  const [showGoalMenu, setShowGoalMenu] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  async function handleArchiveGoal() {
    if (!state.goal?.id) return;
    setShowGoalMenu(false);
    await archiveGoal(state.goal.id).catch(() => {});
    patch((s) => ({ ...s, goal: null, tasks: [] }));
    setStep("goal");
  }

  async function handleDeleteGoal() {
    if (!state.goal?.id) return;
    setConfirmDelete(false);
    setShowGoalMenu(false);
    await deleteGoal(state.goal.id).catch(() => {});
    patch((s) => ({ ...s, goal: null, tasks: [] }));
    setStep("goal");
  }

  async function handlePauseGoal() {
    if (!state.goal?.id) return;
    setShowGoalMenu(false);
    await pauseGoal(state.goal.id).catch(() => {});
    patch((s) => ({ ...s, goal: state.goal ? { ...state.goal, status: "paused" } : null }));
  }

  function handleCompleteTask(task: Task) {
    if (task.status === "completed") return;
    const today = new Date().toISOString().slice(0, 10);
    // Optimistic UI update
    patch((s) => {
      const last = s.lastActiveDate;
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yStr = yesterday.toISOString().slice(0, 10);
      const newStreak = last === today ? s.streak : last === yStr ? s.streak + 1 : 1;
      return {
        ...s,
        gold: s.gold + task.gold,
        xp: s.xp + task.xp,
        focusMinutes: s.focusMinutes + task.minutes,
        streak: newStreak,
        lastActiveDate: today,
        tasks: s.tasks.map((t) =>
          t.id === task.id
            ? { ...t, status: "completed", completion: 100, focusMinutes: t.minutes }
            : t
        ),
      };
    });
    // Persist to DB (best-effort — server validates rewards independently)
    completeTaskDB(task.id).catch(() => {});
  }

  const totalTasks  = state.tasks.filter((t) => !t.isRecovery).length;
  const doneTasks   = state.tasks.filter((t) => t.status === "completed").length;
  const progress    = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
  const totalHours  = Math.round(state.tasks.reduce((s, t) => s + t.minutes, 0) / 60);
  const grouped     = groupByCategory(state.tasks);

  if (!ready) {
    return (
      <FVShell>
        <div className="fv-loading">
          <Mascot size={60} mood="idle" float />
          <p style={{ color: "#6B7A99", fontSize: "0.85rem" }}>Loading your plan…</p>
        </div>
      </FVShell>
    );
  }

  /* ── Step 1: Goal input ── */
  if (step === "goal") {
    return (
      <FVShell hideNav>
        <div style={{ padding: "20px 20px 40px" }}>
          <button
            onClick={() => router.back()}
            className="fv-btn fv-btn-ghost fv-btn-sm"
            style={{ marginBottom: 16, gap: 4 }}
          >
            <ChevronLeft size={16} /> Back
          </button>

          <div className="animate-fade-up" style={{ textAlign: "center", marginBottom: 24 }}>
            <Mascot size={72} mood="thinking" float />
            <h1 style={{ margin: "12px 0 4px", fontSize: "1.7rem", fontWeight: 900, color: "#1D2B53" }}>
              What&apos;s your big goal? 🌱
            </h1>
            <p style={{ margin: 0, color: "#6B7A99", fontSize: "0.88rem" }}>
              We&apos;ll break it down into manageable steps
            </p>
          </div>

          <div className="fv-card fv-card-lg animate-fade-up delay-1">
            <div className="stack gap-16">
              <div className="stack gap-8">
                <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "#1D2B53" }}>
                  Example: Prepare for medical school entrance exam
                </label>
                <textarea
                  className="fv-textarea"
                  rows={3}
                  placeholder="Your goal here..."
                  value={goalText}
                  onChange={(e) => setGoalText(e.target.value)}
                  style={{ minHeight: 90 }}
                />
              </div>

              <div className="stack gap-8">
                <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "#1D2B53" }}>
                  <Calendar size={14} style={{ display: "inline", verticalAlign: "middle", marginRight: 4 }} />
                  Deadline
                </label>
                <input
                  type="date"
                  className="fv-input"
                  value={deadline}
                  min={new Date().toISOString().slice(0, 10)}
                  onChange={(e) => setDeadline(e.target.value)}
                />
              </div>

              <div className="stack gap-8">
                <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "#1D2B53" }}>Category</label>
                <div className="row gap-8 cluster">
                  {(Object.entries(CATEGORY_ICONS) as [GoalCategory, string][]).map(([cat, icon]) => (
                    <button
                      key={cat}
                      onClick={() => setCategory(cat)}
                      className="fv-btn fv-btn-sm"
                      style={{
                        background: category === cat ? "#5EA9FF" : "white",
                        color: category === cat ? "white" : "#6B7A99",
                        border: `2px solid ${category === cat ? "#5EA9FF" : "#D6E9FF"}`,
                        gap: 4,
                        padding: "0 10px",
                      }}
                    >
                      {icon} {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="stack gap-8">
                <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "#1D2B53" }}>Daily energy level</label>
                <div className="row gap-8">
                  {(["low", "balanced", "high"] as EnergyLevel[]).map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() => setEnergy(lvl)}
                      className="fv-btn fv-btn-sm"
                      style={{
                        flex: 1,
                        background: energy === lvl ? "#5EA9FF" : "white",
                        color: energy === lvl ? "white" : "#6B7A99",
                        border: `2px solid ${energy === lvl ? "#5EA9FF" : "#D6E9FF"}`,
                        textTransform: "capitalize",
                      }}
                    >
                      {lvl === "low" ? "🌙 Easy" : lvl === "balanced" ? "⚡ Balanced" : "🔥 Intense"}
                    </button>
                  ))}
                </div>
              </div>

              <button
                className="fv-btn fv-btn-primary fv-btn-full fv-btn-lg"
                disabled={!goalText.trim()}
                onClick={() => setStep("planning")}
              >
                Continue →
              </button>
            </div>
          </div>
        </div>
      </FVShell>
    );
  }

  /* ── Step 2: AI Planning (generate) ── */
  if (step === "planning") {
    const mockGoal: Goal = {
      id: "goal-new",
      title: goalText,
      deadline,
      dailyHours: energy === "high" ? 4 : energy === "low" ? 2 : 3,
      energy,
      difficulty: 3 as DifficultyLevel,
      category,
      createdAt: new Date().toISOString(),
    };
    const preview = generatePlan(mockGoal);
    const pGrouped = groupByCategory(preview);
    const pHours = Math.round(preview.reduce((s, t) => s + t.minutes, 0) / 60);

    return (
      <FVShell hideNav>
        <div style={{ padding: "20px 20px 40px" }}>
          <button
            onClick={() => setStep("goal")}
            className="fv-btn fv-btn-ghost fv-btn-sm"
            style={{ marginBottom: 16, gap: 4 }}
          >
            <ChevronLeft size={16} /> Back
          </button>

          <div className="animate-fade-up" style={{ textAlign: "center", marginBottom: 20 }}>
            <div style={{
              width: 52,
              height: 52,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #5EA9FF, #7EDC8A)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 12px",
            }}>
              <Sparkles size={24} color="white" />
            </div>
            <h1 style={{ margin: "0 0 4px", fontSize: "1.5rem", fontWeight: 900, color: "#1D2B53" }}>
              AI Strategic Plan
            </h1>
            <p style={{ margin: 0, color: "#6B7A99", fontSize: "0.85rem" }}>
              I&apos;ve broken your goal into manageable steps!
            </p>
          </div>

          {/* Stats row */}
          <div className="fv-card animate-fade-up delay-1" style={{ marginBottom: 16 }}>
            <div className="row gap-16" style={{ justifyContent: "space-around" }}>
              <div style={{ textAlign: "center" }}>
                <p style={{ margin: 0, fontSize: "1.8rem", fontWeight: 900, color: "#1D2B53" }}>
                  {preview.filter((t) => !t.isRecovery).length}
                </p>
                <p style={{ margin: 0, fontSize: "0.72rem", color: "#6B7A99", fontWeight: 600 }}>Total Tasks</p>
              </div>
              <div style={{ width: 1, background: "#D6E9FF" }} />
              <div style={{ textAlign: "center" }}>
                <p style={{ margin: 0, fontSize: "1.8rem", fontWeight: 900, color: "#5EA9FF" }}>
                  {pHours}h
                </p>
                <p style={{ margin: 0, fontSize: "0.72rem", color: "#6B7A99", fontWeight: 600 }}>Est. Focus Hours</p>
              </div>
            </div>
          </div>

          {/* Plan Preview */}
          <div className="fv-card animate-fade-up delay-2" style={{ marginBottom: 16 }}>
            <p style={{ margin: "0 0 12px", fontWeight: 800, fontSize: "0.78rem", color: "#1D2B53" }}>
              Plan Preview
            </p>
            <div className="stack gap-8">
              {pGrouped.slice(0, 5).map(({ cat, count }) => (
                <div key={cat} className="row between gap-8">
                  <div className="row gap-8">
                    <span style={{ fontSize: "1.1rem" }}>{CATEGORY_ICONS[cat as GoalCategory] ?? "✨"}</span>
                    <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#1D2B53", textTransform: "capitalize" }}>{cat}</span>
                  </div>
                  <span style={{ fontSize: "0.8rem", color: "#6B7A99", fontWeight: 600 }}>{count} tasks</span>
                </div>
              ))}
            </div>
          </div>

          <button
            className="fv-btn fv-btn-primary fv-btn-full fv-btn-lg animate-fade-up delay-3"
            disabled={generating}
            onClick={() => {
              setGenerating(true);
              setTimeout(async () => {
                const newGoal: Goal = {
                  id: "goal-" + Date.now(),
                  title: goalText,
                  deadline,
                  dailyHours: energy === "high" ? 4 : energy === "low" ? 2 : 3,
                  energy,
                  difficulty: 3 as DifficultyLevel,
                  category,
                  createdAt: new Date().toISOString(),
                };
                const tasks = generatePlan(newGoal);
                // Save to DB (best-effort)
                try {
                  await savePlan(tasks, {
                    title: newGoal.title,
                    deadline: newGoal.deadline,
                    dailyHours: newGoal.dailyHours,
                    energy: newGoal.energy,
                    difficulty: newGoal.difficulty,
                    category: newGoal.category,
                  });
                } catch { /* offline fallback */ }
                patch((s) => ({ ...s, goal: newGoal, tasks, hasOnboarded: true }));
                setPreviewTasks(tasks);
                setGenerating(false);
                setStep("plan");
              }, 1200);
            }}
          >
            {generating ? (
              <span className="row gap-8 center" style={{ width: "100%" }}>
                <span style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>⏳</span>
                Generating your plan…
              </span>
            ) : (
              <>
                <Sparkles size={18} />
                Generate My Plan
              </>
            )}
          </button>
        </div>
      </FVShell>
    );
  }

  /* ── Step 3: Full Plan View ── */
  const todayKey = new Date().toISOString().slice(0, 10);
  const todayTasks = state.tasks.filter((t) => t.day === todayKey && !t.isRecovery);
  const todayDone  = todayTasks.filter((t) => t.status === "completed").length;

  return (
    <FVShell>
      <div style={{ padding: "20px 20px 20px" }}>
        {/* Header */}
        <div className="row between" style={{ marginBottom: 16 }}>
          <h1 style={{ margin: 0, fontSize: "1.3rem", fontWeight: 900, color: "#1D2B53" }}>Your Plan</h1>
          <button
            className="fv-btn fv-btn-secondary fv-btn-sm"
            onClick={() => setStep("goal")}
            style={{ gap: 4 }}
          >
            <Sparkles size={14} /> New goal
          </button>
        </div>

        {/* Goal countdown card with management menu */}
        {state.goal && (
          <div style={{ position: "relative" }}>
            <GoalCountdown
              goal={state.goal}
              progress={progress}
              onMenu={() => { setShowGoalMenu((v) => !v); setConfirmDelete(false); }}
            />

            {/* Goal management dropdown */}
            {showGoalMenu && (
              <div ref={menuRef} style={{
                position: "absolute",
                top: 44,
                right: 0,
                zIndex: 100,
                background: "white",
                border: "1px solid #D6E9FF",
                borderRadius: 14,
                boxShadow: "0 8px 32px rgba(94,169,255,0.18)",
                overflow: "hidden",
                minWidth: 180,
              }}>
                {[
                  { label: "⏸ Pause goal",   action: handlePauseGoal,  color: "#1D2B53" },
                  { label: "🗂 Archive goal", action: handleArchiveGoal, color: "#1D2B53" },
                ].map(({ label, action, color }) => (
                  <button
                    key={label}
                    onClick={action}
                    style={{
                      display: "block",
                      width: "100%",
                      padding: "12px 16px",
                      textAlign: "left",
                      background: "none",
                      border: "none",
                      borderBottom: "1px solid #F0F5FF",
                      cursor: "pointer",
                      fontSize: "0.82rem",
                      fontWeight: 700,
                      color,
                      fontFamily: "inherit",
                    }}
                  >
                    {label}
                  </button>
                ))}
                {!confirmDelete ? (
                  <button
                    onClick={() => setConfirmDelete(true)}
                    style={{
                      display: "block",
                      width: "100%",
                      padding: "12px 16px",
                      textAlign: "left",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontSize: "0.82rem",
                      fontWeight: 700,
                      color: "#D94040",
                      fontFamily: "inherit",
                    }}
                  >
                    🗑 Delete goal
                  </button>
                ) : (
                  <div style={{ padding: "10px 14px", background: "#FFF5F5" }}>
                    <p style={{ margin: "0 0 8px", fontSize: "0.75rem", fontWeight: 700, color: "#D94040" }}>
                      Delete goal + all tasks?
                    </p>
                    <div className="row gap-8">
                      <button
                        onClick={handleDeleteGoal}
                        className="fv-btn fv-btn-sm"
                        style={{ background: "#D94040", color: "white", border: "none", flex: 1, height: 28 }}
                      >
                        Yes, delete
                      </button>
                      <button
                        onClick={() => setConfirmDelete(false)}
                        className="fv-btn fv-btn-ghost fv-btn-sm"
                        style={{ flex: 1, height: 28 }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Click-away overlay */}
            {showGoalMenu && (
              <div
                style={{ position: "fixed", inset: 0, zIndex: 99 }}
                onClick={() => { setShowGoalMenu(false); setConfirmDelete(false); }}
              />
            )}
          </div>
        )}

        {/* Today's plan */}
        <div className="fv-card animate-fade-up delay-1" style={{ marginBottom: 16 }}>
          <div className="row between" style={{ marginBottom: 12 }}>
            <p style={{ margin: 0, fontWeight: 800, fontSize: "0.85rem", color: "#1D2B53" }}>
              Today&apos;s Plan
            </p>
            <span className="fv-badge fv-badge-blue">{todayDone}/{todayTasks.length} tasks</span>
          </div>
          <div className="stack gap-8">
            {todayTasks.length === 0 && (
              <p style={{ margin: 0, color: "#6B7A99", fontSize: "0.82rem", textAlign: "center", padding: "12px 0" }}>
                No tasks scheduled for today 🎉
              </p>
            )}
            {todayTasks.slice(0, 6).map((task) => (
              <div key={task.id} className={`fv-task ${task.status === "completed" ? "done" : ""}`}
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px" }}>
                {/* Checkbox — marks task complete + awards rewards */}
                <button
                  onClick={() => handleCompleteTask(task)}
                  className={`fv-checkbox ${task.status === "completed" ? "checked" : ""}`}
                  style={{ flexShrink: 0, cursor: task.status === "completed" ? "default" : "pointer" }}
                  aria-label={task.status === "completed" ? "Task completed" : "Mark as complete"}
                >
                  {task.status === "completed" && <CheckCircle2 size={14} color="white" />}
                </button>

                {/* Task body — navigates to focus timer */}
                <button
                  onClick={() => task.status !== "completed" && router.push(`/focus?taskId=${task.id}`)}
                  style={{
                    flex: 1,
                    background: "none",
                    border: "none",
                    padding: 0,
                    cursor: task.status === "completed" ? "default" : "pointer",
                    textAlign: "left",
                    fontFamily: "inherit",
                  }}
                >
                  <p style={{
                    margin: 0,
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    color: task.status === "completed" ? "#6B7A99" : "#1D2B53",
                    textDecoration: task.status === "completed" ? "line-through" : "none",
                  }}>
                    {task.title}
                    {task.status === "completed" && (
                      <span style={{
                        marginLeft: 8,
                        fontSize: "0.65rem",
                        fontWeight: 700,
                        background: "#D1FAE5",
                        color: "#059669",
                        borderRadius: 999,
                        padding: "2px 7px",
                        verticalAlign: "middle",
                      }}>Done</span>
                    )}
                  </p>
                  <p style={{ margin: "2px 0 0", fontSize: "0.72rem", color: "#6B7A99" }}>
                    <Clock size={10} style={{ display: "inline", verticalAlign: "middle", marginRight: 3 }} />
                    {task.minutes} min · +{task.gold}🪙 +{task.xp}💎
                  </p>
                </button>

                {/* Focus button — only for pending tasks */}
                {task.status !== "completed" && (
                  <button
                    onClick={() => router.push(`/focus?taskId=${task.id}`)}
                    className="fv-btn fv-btn-primary fv-btn-sm"
                    style={{ flexShrink: 0, padding: "0 10px", height: 32, gap: 4 }}
                    aria-label="Start focus session"
                  >
                    <Play size={12} fill="white" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Category breakdown */}
        <div className="fv-card animate-fade-up delay-2">
          <p style={{ margin: "0 0 12px", fontWeight: 800, fontSize: "0.85rem", color: "#1D2B53" }}>
            All Categories
          </p>
          <div className="stack gap-8">
            {grouped.map(({ cat, count, minutes }) => (
              <div key={cat} className="row between gap-8">
                <div className="row gap-10">
                  <div className="fv-cat-icon" style={{ background: "#EBF5FF" }}>
                    <span>{CATEGORY_ICONS[cat as GoalCategory] ?? "✨"}</span>
                  </div>
                  <div>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: "0.85rem", color: "#1D2B53", textTransform: "capitalize" }}>{cat}</p>
                    <p style={{ margin: 0, fontSize: "0.72rem", color: "#6B7A99" }}>{count} tasks</p>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ margin: 0, fontSize: "0.8rem", fontWeight: 700, color: "#5EA9FF" }}>
                    {Math.round(minutes / 60 * 10) / 10}h
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </FVShell>
  );
}
