"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useStore } from "@/lib/store";
import { AppShell } from "@/components/layout/AppShell";
import { calcReward } from "@/lib/ai-planner";
import type { Task } from "@/lib/types";

type Phase = "idle" | "running" | "paused" | "done";

const RADIUS = 88;
const CIRC = 2 * Math.PI * RADIUS;

function fmt(secs: number) {
  const m = Math.floor(secs / 60).toString().padStart(2, "0");
  const s = (secs % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export default function FocusPage() {
  const { state, patch, ready } = useStore();
  const [selectedId, setSelectedId] = useState<string>("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [showSummary, setShowSummary] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const pendingTasks = state.tasks.filter(
    (t) => t.status !== "completed" && !t.isRecovery
  );

  const task: Task | undefined =
    pendingTasks.find((t) => t.id === selectedId) ?? pendingTasks[0];

  const totalSecs = (task?.minutes ?? 25) * 60;
  const remaining = Math.max(0, totalSecs - elapsed);
  const progress = totalSecs > 0 ? elapsed / totalSecs : 0;
  const dashOffset = CIRC * (1 - Math.min(1, progress));

  const stop = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
  }, []);

  useEffect(() => () => stop(), [stop]);

  function start() {
    setPhase("running");
    intervalRef.current = setInterval(() => {
      setElapsed((e) => {
        if (e + 1 >= totalSecs) {
          stop();
          setPhase("done");
          return totalSecs;
        }
        return e + 1;
      });
    }, 1000);
  }

  function pause() {
    stop();
    setPhase("paused");
  }

  function resume() {
    setPhase("running");
    intervalRef.current = setInterval(() => {
      setElapsed((e) => {
        if (e + 1 >= totalSecs) {
          stop();
          setPhase("done");
          return totalSecs;
        }
        return e + 1;
      });
    }, 1000);
  }

  function finish(completion: number) {
    stop();
    if (!task) return;
    const reward = calcReward(task.difficulty, task.minutes, completion);
    const focusAdded = Math.round(elapsed / 60);
    patch((s) => ({
      ...s,
      gold: s.gold + reward.gold,
      xp: s.xp + reward.xp,
      focusMinutes: s.focusMinutes + focusAdded,
      tasks: s.tasks.map((t) =>
        t.id === task.id
          ? {
              ...t,
              status: completion >= 100 ? "completed" : "partial",
              completion,
              focusMinutes: t.focusMinutes + focusAdded,
            }
          : t
      ),
    }));
    setShowSummary(true);
    setPhase("idle");
    setElapsed(0);
  }

  function reset() {
    stop();
    setPhase("idle");
    setElapsed(0);
    setShowSummary(false);
  }

  if (!ready) {
    return (
      <AppShell currentRoute="/focus">
        <div className="empty-state" style={{ paddingTop: 80 }}><p>Loading…</p></div>
      </AppShell>
    );
  }

  if (showSummary && task) {
    const completion = Math.round((elapsed / totalSecs) * 100);
    const reward = calcReward(task.difficulty, task.minutes, Math.min(100, completion));
    return (
      <AppShell currentRoute="/focus">
        <div style={{ maxWidth: 480, margin: "0 auto" }}>
          <div className="card card-lg" style={{ textAlign: "center" }}>
            <div className="stack gap-16" style={{ alignItems: "center" }}>
              <span style={{ fontSize: "3rem" }}>🎉</span>
              <h2 style={{ margin: 0, fontSize: "1.4rem", fontWeight: 900 }}>You crushed it!</h2>
              <p style={{ margin: 0, color: "var(--color-muted)", fontSize: "0.875rem" }}>
                {task.title}
              </p>
              <div className="stat-grid" style={{ width: "100%" }}>
                <div className="stat-card">
                  <div className="stat-label">💰 Gold</div>
                  <div className="stat-value" style={{ color: "var(--color-accent)" }}>+{reward.gold}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">⭐ XP</div>
                  <div className="stat-value">+{reward.xp}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">⏱ Time</div>
                  <div className="stat-value">{Math.round(elapsed / 60)}m</div>
                </div>
              </div>
              <button className="btn btn-primary btn-lg" onClick={reset} style={{ width: "100%" }}>
                Start another session ▶
              </button>
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  if (pendingTasks.length === 0) {
    return (
      <AppShell currentRoute="/focus">
        <div className="empty-state" style={{ paddingTop: 80 }}>
          <span style={{ fontSize: "2.5rem" }}>🏆</span>
          <p style={{ margin: "12px 0 0", fontWeight: 700 }}>All tasks are done — nice work!</p>
          <p style={{ margin: "6px 0 0", color: "var(--color-muted)", fontSize: "0.875rem" }}>
            Rest up. You&apos;ve earned it 🌙
          </p>
        </div>
      </AppShell>
    );
  }

  const previewReward = task ? calcReward(task.difficulty, task.minutes, 100) : { gold: 0, xp: 0 };

  return (
    <AppShell currentRoute="/focus">
      <div className="page-header">
        <h1 className="page-title">Deep Focus ⏱</h1>
        <p className="page-subtitle">Pick a task, close the noise, earn your rewards.</p>
      </div>

      <div style={{ maxWidth: 520, margin: "0 auto" }}>
        <div className="stack gap-24">
          {/* Task selector */}
          {phase === "idle" && (
            <div className="form-group">
              <label className="form-label" htmlFor="task-select">Choose a task</label>
              <select
                id="task-select"
                className="form-select"
                value={task?.id ?? ""}
                onChange={(e) => setSelectedId(e.target.value)}
              >
                {pendingTasks.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title} ({t.minutes} min)
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Task info bar */}
          {task && (
            <div className="card" style={{ background: "var(--color-primary-soft)", borderColor: "rgba(45,106,97,.2)" }}>
              <div className="row gap-10" style={{ justifyContent: "space-between", flexWrap: "wrap" }}>
                <div>
                  <p style={{ margin: 0, fontWeight: 800, fontSize: "0.95rem" }}>{task.title}</p>
                  <div className="row gap-6 cluster" style={{ marginTop: 4 }}>
                    <span className="badge badge-gray">{task.minutes} min</span>
                    <span className="badge badge-amber">+{previewReward.gold} Gold</span>
                    <span className="badge badge-primary">+{previewReward.xp} XP</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Ring timer */}
          <div style={{ display: "flex", justifyContent: "center" }}>
            <div className="timer-ring">
              <svg
                width={200}
                height={200}
                style={{ transform: "rotate(-90deg)", position: "absolute", top: 0, left: 0 }}
              >
                <circle
                  cx={100}
                  cy={100}
                  r={RADIUS}
                  fill="none"
                  stroke="var(--color-border)"
                  strokeWidth={10}
                />
                <circle
                  cx={100}
                  cy={100}
                  r={RADIUS}
                  fill="none"
                  stroke={phase === "running" ? "var(--color-primary)" : phase === "paused" ? "var(--color-accent)" : "var(--color-border)"}
                  strokeWidth={10}
                  strokeLinecap="round"
                  strokeDasharray={CIRC}
                  strokeDashoffset={dashOffset}
                  style={{ transition: "stroke-dashoffset 0.9s linear, stroke 0.3s" }}
                />
              </svg>
              <div className="timer-display">{fmt(remaining)}</div>
              <div
                style={{
                  position: "absolute",
                  bottom: 30,
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  color: "var(--color-muted)",
                  textTransform: "uppercase",
                  letterSpacing: ".08em",
                }}
              >
                {phase === "idle" ? "ready" : phase === "running" ? "focus" : phase === "paused" ? "paused" : "done"}
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="stack gap-10">
            {phase === "idle" && (
              <button className="btn btn-primary btn-full btn-lg" onClick={start}>
                ▶ Start focus session
              </button>
            )}

            {phase === "running" && (
              <div className="row gap-8">
                <button className="btn btn-secondary btn-full" onClick={pause}>⏸ Pause</button>
                <button
                  className="btn btn-primary btn-full"
                  onClick={() => finish(100)}
                >
                  ✓ Finish early
                </button>
              </div>
            )}

            {phase === "paused" && (
              <div className="row gap-8">
                <button className="btn btn-ghost" onClick={reset}>✕ Cancel</button>
                <button className="btn btn-secondary btn-full" onClick={() => finish(Math.round((elapsed / totalSecs) * 100))}>
                  Save & exit
                </button>
                <button className="btn btn-primary btn-full" onClick={resume}>▶ Resume</button>
              </div>
            )}

            {phase === "done" && (
              <button className="btn btn-primary btn-full btn-lg" onClick={() => finish(100)}>
                🎉 Claim rewards
              </button>
            )}
          </div>

          {/* Tip */}
          {phase === "idle" && (
            <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--color-muted)", textAlign: "center", lineHeight: 1.6 }}>
              Close other tabs, put your phone down. You&apos;ve got this 💪
            </p>
          )}
        </div>
      </div>
    </AppShell>
  );
}
