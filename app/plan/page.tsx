"use client";

import { useState, useMemo } from "react";
import { useStore } from "@/lib/store";
import { AppShell } from "@/components/layout/AppShell";
import { calcReward } from "@/lib/ai-planner";
import type { Task, DifficultyLevel } from "@/lib/types";

type Filter = "all" | "today" | "upcoming";

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function formatDay(day: string) {
  const today = todayKey();
  const tomorrow = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  })();
  if (day === today) return "Today";
  if (day === tomorrow) return "Tomorrow";
  return new Date(day).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function diffLabel(d: number) {
  return ["Gentle", "Easy", "Standard", "Hard", "Max"][d - 1] ?? "Standard";
}

export default function PlanPage() {
  const { state, patch, ready } = useStore();
  const [filter, setFilter] = useState<Filter>("all");
  const [expandedTask, setExpandedTask] = useState<string | null>(null);
  const [sliders, setSliders] = useState<Record<string, number>>({});

  if (!ready) {
    return (
      <AppShell currentRoute="/plan">
        <div className="empty-state" style={{ paddingTop: 80 }}>
          <p>Loading plan…</p>
        </div>
      </AppShell>
    );
  }

  const today = todayKey();
  const visibleTasks = useMemo(() => {
    const nonRecovery = state.tasks.filter((t) => !t.isRecovery);
    if (filter === "today") return nonRecovery.filter((t) => t.day === today);
    if (filter === "upcoming") return nonRecovery.filter((t) => t.day > today);
    return nonRecovery;
  }, [state.tasks, filter, today]);

  const grouped = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const t of visibleTasks) {
      if (!map.has(t.day)) map.set(t.day, []);
      map.get(t.day)!.push(t);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [visibleTasks]);

  const totalTasks = state.tasks.filter((t) => !t.isRecovery).length;
  const doneTasks = state.tasks.filter((t) => t.status === "completed").length;
  const planPct = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  function markComplete(task: Task) {
    patch((s) => {
      const reward = calcReward(task.difficulty, task.minutes, 100);
      return {
        ...s,
        gold: s.gold + reward.gold,
        xp: s.xp + reward.xp,
        tasks: s.tasks.map((t) =>
          t.id === task.id ? { ...t, status: "completed", completion: 100 } : t
        ),
      };
    });
    setExpandedTask(null);
  }

  function markPartial(task: Task) {
    const pct = sliders[task.id] ?? 50;
    const reward = calcReward(task.difficulty, task.minutes, pct);
    patch((s) => ({
      ...s,
      gold: s.gold + reward.gold,
      xp: s.xp + reward.xp,
      tasks: s.tasks.map((t) =>
        t.id === task.id ? { ...t, status: "partial", completion: pct } : t
      ),
    }));
    setExpandedTask(null);
  }

  function resetTask(taskId: string) {
    patch((s) => ({
      ...s,
      tasks: s.tasks.map((t) =>
        t.id === taskId ? { ...t, status: "pending", completion: 0 } : t
      ),
    }));
  }

  return (
    <AppShell currentRoute="/plan">
      <div className="page-header">
        <h1 className="page-title">Your plan</h1>
        <p className="page-subtitle">
          {doneTasks} of {totalTasks} tasks complete — {planPct}% overall
        </p>
      </div>

      <div className="progress-track" style={{ marginBottom: 24 }}>
        <div className="progress-fill" style={{ width: `${planPct}%`, background: "var(--color-primary)" }} />
      </div>

      <div className="row gap-8" style={{ marginBottom: 24, flexWrap: "wrap" }}>
        {(["all", "today", "upcoming"] as Filter[]).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            style={{
              padding: "6px 16px",
              borderRadius: 99,
              border: `1.5px solid ${filter === f ? "var(--color-primary)" : "var(--color-border)"}`,
              background: filter === f ? "var(--color-primary)" : "var(--color-surface)",
              color: filter === f ? "white" : "var(--color-text)",
              fontWeight: 600,
              fontSize: "0.8rem",
              cursor: "pointer",
              textTransform: "capitalize",
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {grouped.length === 0 ? (
        <div className="empty-state">
          <span style={{ fontSize: "2rem" }}>🎉</span>
          <p>No tasks here. All done!</p>
        </div>
      ) : (
        <div className="stack gap-28">
          {grouped.map(([day, tasks]) => (
            <div key={day}>
              <div className="row gap-8" style={{ marginBottom: 10, alignItems: "center" }}>
                <p
                  style={{
                    margin: 0,
                    fontWeight: 800,
                    fontSize: "0.85rem",
                    color: day === today ? "var(--color-primary)" : "var(--color-text)",
                    textTransform: "uppercase",
                    letterSpacing: ".06em",
                  }}
                >
                  {formatDay(day)}
                </p>
                <div style={{ flex: 1, height: 1, background: "var(--color-border)" }} />
                <span style={{ fontSize: "0.72rem", color: "var(--color-muted)" }}>
                  {tasks.filter((t) => t.status === "completed").length}/{tasks.length}
                </span>
              </div>

              <div className="stack gap-8">
                {tasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    expanded={expandedTask === task.id}
                    sliderValue={sliders[task.id] ?? 50}
                    onToggle={() =>
                      setExpandedTask((prev) => (prev === task.id ? null : task.id))
                    }
                    onSlider={(v) => setSliders((prev) => ({ ...prev, [task.id]: v }))}
                    onComplete={() => markComplete(task)}
                    onPartial={() => markPartial(task)}
                    onReset={() => resetTask(task.id)}
                  />
                ))}

                {state.tasks.filter((t) => t.isRecovery && t.day === day).map((rec) => (
                  <div
                    key={rec.id}
                    className="card"
                    style={{
                      borderStyle: "dashed",
                      borderColor: "var(--color-primary)",
                      background: "var(--color-primary-soft)",
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    <span style={{ fontSize: "1.3rem" }}>🌿</span>
                    <div>
                      <p style={{ margin: 0, fontWeight: 700, fontSize: "0.875rem" }}>Recovery gap</p>
                      <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--color-muted)" }}>
                        Light 15-min review — no pressure today.
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}

function TaskCard({
  task,
  expanded,
  sliderValue,
  onToggle,
  onSlider,
  onComplete,
  onPartial,
  onReset,
}: {
  task: Task;
  expanded: boolean;
  sliderValue: number;
  onToggle: () => void;
  onSlider: (v: number) => void;
  onComplete: () => void;
  onPartial: () => void;
  onReset: () => void;
}) {
  const done = task.status === "completed";
  const partial = task.status === "partial";

  return (
    <div
      className="task-item"
      style={{
        opacity: done ? 0.55 : 1,
        borderColor: done
          ? "var(--color-border)"
          : partial
          ? "var(--color-accent)"
          : "var(--color-border)",
      }}
    >
      <div
        style={{ display: "flex", alignItems: "flex-start", gap: 12, cursor: "pointer" }}
        onClick={onToggle}
      >
        <div
          style={{
            width: 20,
            height: 20,
            borderRadius: "50%",
            border: `2px solid ${done ? "var(--color-primary)" : partial ? "var(--color-accent)" : "var(--color-border)"}`,
            background: done ? "var(--color-primary)" : "transparent",
            display: "grid",
            placeItems: "center",
            flexShrink: 0,
            marginTop: 2,
          }}
        >
          {done && <span style={{ color: "white", fontSize: "0.65rem" }}>✓</span>}
          {partial && <span style={{ color: "var(--color-accent)", fontSize: "0.65rem" }}>◑</span>}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              margin: 0,
              fontWeight: 700,
              fontSize: "0.9rem",
              textDecoration: done ? "line-through" : "none",
              color: done ? "var(--color-muted)" : "var(--color-text)",
            }}
          >
            {task.title}
          </p>
          <div className="row gap-6 cluster" style={{ marginTop: 4 }}>
            <span className="badge badge-gray">{task.minutes} min</span>
            <span className="badge badge-gray">{diffLabel(task.difficulty)}</span>
            <span className="badge badge-amber">+{task.gold} Gold</span>
            <span className="badge badge-primary">+{task.xp} XP</span>
          </div>
        </div>
        <span style={{ color: "var(--color-muted)", fontSize: "0.8rem", flexShrink: 0 }}>
          {expanded ? "▲" : "▼"}
        </span>
      </div>

      {expanded && !done && (
        <div
          style={{
            marginTop: 12,
            paddingTop: 12,
            borderTop: "1px solid var(--color-border)",
          }}
        >
          <div className="stack gap-12">
            <button className="btn btn-primary btn-full" onClick={onComplete}>
              ✓ Mark complete — +{task.gold} Gold, +{task.xp} XP
            </button>

            <div>
              <p style={{ margin: "0 0 6px", fontSize: "0.78rem", color: "var(--color-muted)", fontWeight: 600 }}>
                Partial: {sliderValue}% done — +{calcReward(task.difficulty, task.minutes, sliderValue).gold} Gold
              </p>
              <input
                type="range"
                min={10}
                max={90}
                step={10}
                value={sliderValue}
                onChange={(e) => onSlider(Number(e.target.value))}
                style={{ width: "100%", accentColor: "var(--color-accent)" }}
              />
              <button
                className="btn btn-secondary btn-full"
                style={{ marginTop: 6 }}
                onClick={onPartial}
              >
                Save partial progress
              </button>
            </div>
          </div>
        </div>
      )}

      {expanded && (done || partial) && (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--color-border)" }}>
          <button className="btn btn-ghost btn-full" onClick={onReset} style={{ fontSize: "0.8rem" }}>
            ↩ Reset task
          </button>
        </div>
      )}
    </div>
  );
}
