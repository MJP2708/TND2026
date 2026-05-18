"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useStore } from "@/lib/store";
import { FVShell } from "@/components/focusville/FVShell";
import { Mascot } from "@/components/focusville/Mascot";
import { calcReward } from "@/lib/ai-planner";
import { RotateCcw, Pause, Play, ChevronDown } from "lucide-react";
import type { Task } from "@/lib/types";

type Phase = "idle" | "running" | "paused" | "done";

const RADIUS = 100;
const CIRC   = 2 * Math.PI * RADIUS;

function fmt(secs: number) {
  const m = Math.floor(secs / 60).toString().padStart(2, "0");
  const s = (secs % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function Confetti() {
  const items = Array.from({ length: 24 }, (_, i) => ({
    x: Math.random() * 100,
    delay: Math.random() * 0.8,
    color: ["#5EA9FF", "#7EDC8A", "#FFD45E", "#FF7B7B", "#A78BFA"][i % 5],
    size: 6 + Math.random() * 8,
    duration: 1.5 + Math.random(),
  }));
  return (
    <div className="fv-confetti">
      {items.map((item, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            top: "-10px",
            left: `${item.x}%`,
            width: item.size,
            height: item.size * 0.6,
            background: item.color,
            borderRadius: 2,
            animation: `confetti-fall ${item.duration}s ${item.delay}s ease-in forwards`,
          }}
        />
      ))}
      <style>{`
        @keyframes confetti-fall {
          from { transform: translateY(0) rotate(0deg); opacity: 1; }
          to   { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

export default function FocusPage() {
  const { state, patch, ready } = useStore();
  const [selectedId, setSelectedId]   = useState("");
  const [phase, setPhase]             = useState<Phase>("idle");
  const [elapsed, setElapsed]         = useState(0);
  const [showCompleted, setShowCompleted] = useState(false);
  const [showSelector, setShowSelector]   = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const pendingTasks = state.tasks.filter((t) => t.status !== "completed" && !t.isRecovery);
  const task: Task | undefined = pendingTasks.find((t) => t.id === selectedId) ?? pendingTasks[0];
  const totalSecs  = (task?.minutes ?? 25) * 60;
  const remaining  = Math.max(0, totalSecs - elapsed);
  const progress   = totalSecs > 0 ? elapsed / totalSecs : 0;
  const dashOffset = CIRC * (1 - Math.min(1, progress));

  const stopTimer = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
  }, []);

  useEffect(() => () => stopTimer(), [stopTimer]);

  function startTimer() {
    setPhase("running");
    intervalRef.current = setInterval(() => {
      setElapsed((e) => {
        if (e + 1 >= totalSecs) { stopTimer(); setPhase("done"); return totalSecs; }
        return e + 1;
      });
    }, 1000);
  }

  function pauseTimer() { stopTimer(); setPhase("paused"); }
  function resumeTimer() {
    setPhase("running");
    intervalRef.current = setInterval(() => {
      setElapsed((e) => {
        if (e + 1 >= totalSecs) { stopTimer(); setPhase("done"); return totalSecs; }
        return e + 1;
      });
    }, 1000);
  }

  function finishSession(completion: number) {
    stopTimer();
    if (!task) return;
    const reward = calcReward(task.difficulty, task.minutes, completion);
    const added  = Math.round(elapsed / 60);
    patch((s) => ({
      ...s,
      gold: s.gold + reward.gold,
      xp:   s.xp + reward.xp,
      focusMinutes: s.focusMinutes + added,
      streak: s.streak, // keep existing streak logic
      tasks: s.tasks.map((t) =>
        t.id === task.id
          ? { ...t, status: completion >= 100 ? "completed" : "partial", completion, focusMinutes: t.focusMinutes + added }
          : t
      ),
    }));
    setShowCompleted(true);
    setPhase("idle");
    setElapsed(0);
  }

  function resetSession() {
    stopTimer();
    setPhase("idle");
    setElapsed(0);
    setShowCompleted(false);
  }

  if (!ready) {
    return (
      <FVShell>
        <div className="fv-loading"><Mascot size={60} mood="idle" float /></div>
      </FVShell>
    );
  }

  /* ── Task Completed screen ── */
  if (showCompleted && task) {
    const reward = calcReward(task.difficulty, task.minutes, 100);
    return (
      <FVShell>
        <Confetti />
        <div style={{ padding: "40px 20px", textAlign: "center" }}>
          {/* Mascot celebrate */}
          <div style={{ animation: "mascot-bounce 0.8s ease 0.3s both" }}>
            <Mascot size={110} mood="celebrate" />
          </div>

          <h1 style={{ margin: "16px 0 4px", fontSize: "1.8rem", fontWeight: 900, color: "#1D2B53" }}>
            Great job! 🎉
          </h1>
          <p style={{ margin: "0 0 24px", color: "#6B7A99", fontSize: "0.88rem" }}>
            You completed
          </p>

          <div className="fv-card" style={{ textAlign: "left", marginBottom: 16 }}>
            <p style={{ margin: "0 0 12px", fontWeight: 800, color: "#1D2B53", fontSize: "0.95rem" }}>
              {task.title}
            </p>
            <p style={{ margin: 0, color: "#6B7A99", fontSize: "0.8rem" }}>
              Focus to build your future city ✨
            </p>
          </div>

          {/* Rewards */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 24 }}>
            <div className="fv-card" style={{ textAlign: "center" }}>
              <div style={{ fontSize: "1.4rem" }}>🪙</div>
              <div style={{ fontWeight: 900, fontSize: "1.1rem", color: "#C17D00", margin: "4px 0 0" }}>+{reward.gold}</div>
              <div style={{ fontSize: "0.68rem", color: "#6B7A99", fontWeight: 600 }}>Gold</div>
            </div>
            <div className="fv-card" style={{ textAlign: "center" }}>
              <div style={{ fontSize: "1.4rem" }}>💎</div>
              <div style={{ fontWeight: 900, fontSize: "1.1rem", color: "#6366F1", margin: "4px 0 0" }}>+{reward.xp}</div>
              <div style={{ fontSize: "0.68rem", color: "#6B7A99", fontWeight: 600 }}>XP</div>
            </div>
            <div className="fv-card" style={{ textAlign: "center" }}>
              <div style={{ fontSize: "1.4rem" }}>🔥</div>
              <div style={{ fontWeight: 900, fontSize: "1.1rem", color: "#FF7B7B", margin: "4px 0 0" }}>
                {state.streak}
              </div>
              <div style={{ fontSize: "0.68rem", color: "#6B7A99", fontWeight: 600 }}>Streak days</div>
            </div>
          </div>

          <button
            className="fv-btn fv-btn-primary fv-btn-full fv-btn-lg"
            onClick={resetSession}
          >
            Awesome!
          </button>
        </div>
      </FVShell>
    );
  }

  /* ── No tasks ── */
  if (pendingTasks.length === 0) {
    return (
      <FVShell>
        <div style={{ padding: "60px 20px", textAlign: "center" }}>
          <Mascot size={90} mood="celebrate" float />
          <h2 style={{ margin: "16px 0 8px", fontWeight: 900, color: "#1D2B53" }}>All done! 🏆</h2>
          <p style={{ margin: 0, color: "#6B7A99", fontSize: "0.88rem" }}>Rest up, you've earned it 🌙</p>
        </div>
      </FVShell>
    );
  }

  const previewReward = task ? calcReward(task.difficulty, task.minutes, 100) : { gold: 0, xp: 0 };
  const ringColor = phase === "running" ? "#5EA9FF" : phase === "paused" ? "#FFD45E" : "#D6E9FF";

  return (
    <FVShell>
      <div style={{ padding: "20px 20px" }}>

        {/* Session label */}
        <div style={{ textAlign: "center", marginBottom: 8 }}>
          <div style={{
            display: "inline-block",
            background: "linear-gradient(135deg, #EBF5FF, #DDEEFF)",
            border: "1px solid #C4DEFF",
            borderRadius: 12,
            padding: "4px 14px",
            fontSize: "0.72rem",
            fontWeight: 700,
            color: "#3A8FE8",
          }}>
            Focus Session
          </div>
        </div>

        {/* Task name */}
        {task && (
          <div style={{ textAlign: "center", marginBottom: 4 }}>
            <button
              onClick={() => setShowSelector(!showSelector)}
              className="row gap-6 center"
              style={{ background: "none", border: "none", cursor: "pointer", margin: "0 auto" }}
            >
              <span style={{ fontSize: "1.05rem", fontWeight: 800, color: "#1D2B53" }}>{task.title}</span>
              {phase === "idle" && <ChevronDown size={16} color="#6B7A99" />}
            </button>
          </div>
        )}

        {/* Task selector */}
        {showSelector && phase === "idle" && (
          <div className="fv-card" style={{ marginBottom: 12, marginTop: 8 }}>
            <div className="stack gap-6">
              {pendingTasks.map((t) => (
                <button
                  key={t.id}
                  onClick={() => { setSelectedId(t.id); setShowSelector(false); }}
                  style={{
                    background: t.id === (task?.id) ? "#EBF5FF" : "transparent",
                    border: "none",
                    borderRadius: 10,
                    padding: "8px 12px",
                    cursor: "pointer",
                    textAlign: "left",
                    fontFamily: "inherit",
                  }}
                >
                  <p style={{ margin: 0, fontSize: "0.85rem", fontWeight: 600, color: "#1D2B53" }}>{t.title}</p>
                  <p style={{ margin: "2px 0 0", fontSize: "0.7rem", color: "#6B7A99" }}>{t.minutes} min</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Ring timer */}
        <div style={{ display: "flex", justifyContent: "center", margin: "20px 0" }}>
          <div style={{ position: "relative", width: 240, height: 240 }}>
            <svg
              width={240}
              height={240}
              style={{ position: "absolute", top: 0, left: 0, transform: "rotate(-90deg)" }}
            >
              {/* Track */}
              <circle cx={120} cy={120} r={RADIUS} fill="none" stroke="#EBF5FF" strokeWidth={14} />
              {/* Progress */}
              <circle
                cx={120} cy={120} r={RADIUS}
                fill="none"
                stroke={ringColor}
                strokeWidth={14}
                strokeLinecap="round"
                strokeDasharray={CIRC}
                strokeDashoffset={dashOffset}
                style={{ transition: "stroke-dashoffset 0.9s linear, stroke 0.3s" }}
              />
            </svg>

            {/* Time display */}
            <div style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
            }}>
              <div style={{
                fontSize: "3.2rem",
                fontWeight: 900,
                color: "#1D2B53",
                lineHeight: 1,
                fontVariantNumeric: "tabular-nums",
              }}>
                {fmt(remaining)}
              </div>
              <div style={{ marginTop: 6, fontSize: "0.7rem", fontWeight: 700, color: "#6B7A99", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                {phase === "idle" ? "ready" : phase === "running" ? "focus" : phase === "paused" ? "paused" : "done!"}
              </div>

              {/* Mascot inside ring */}
              <div style={{ marginTop: 8, opacity: phase === "running" ? 1 : 0.5, transition: "opacity 300ms" }}>
                <Mascot size={36} mood={phase === "running" ? "happy" : phase === "done" ? "celebrate" : "idle"} />
              </div>
            </div>
          </div>
        </div>

        {/* Session info */}
        {task && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
            <div style={{ background: "#FFF8E7", borderRadius: 12, padding: "10px 14px", textAlign: "center" }}>
              <div style={{ fontSize: "1rem", fontWeight: 900, color: "#C17D00" }}>🪙 +{previewReward.gold}</div>
              <div style={{ fontSize: "0.68rem", color: "#6B7A99", fontWeight: 600, marginTop: 2 }}>Gold reward</div>
            </div>
            <div style={{ background: "#EEF2FF", borderRadius: 12, padding: "10px 14px", textAlign: "center" }}>
              <div style={{ fontSize: "1rem", fontWeight: 900, color: "#6366F1" }}>💎 +{previewReward.xp}</div>
              <div style={{ fontSize: "0.68rem", color: "#6B7A99", fontWeight: 600, marginTop: 2 }}>XP reward</div>
            </div>
          </div>
        )}

        {/* Controls */}
        <div style={{ display: "grid", gap: 10 }}>
          {phase === "idle" && (
            <button className="fv-btn fv-btn-primary fv-btn-full fv-btn-lg" onClick={startTimer}>
              <Play size={20} fill="white" />
              Start Focus Session
            </button>
          )}

          {phase === "running" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <button className="fv-btn fv-btn-secondary fv-btn-full" style={{ height: 52 }} onClick={pauseTimer}>
                <Pause size={18} />
                Pause
              </button>
              <button className="fv-btn fv-btn-primary fv-btn-full" style={{ height: 52 }} onClick={() => finishSession(100)}>
                ✓ Finish
              </button>
            </div>
          )}

          {phase === "paused" && (
            <div style={{ display: "grid", gridTemplateColumns: "auto 1fr 1fr", gap: 10 }}>
              <button className="fv-btn fv-btn-ghost" style={{ height: 52, padding: "0 12px" }} onClick={resetSession}>
                <RotateCcw size={18} />
              </button>
              <button className="fv-btn fv-btn-secondary fv-btn-full" style={{ height: 52 }} onClick={() => finishSession(Math.round((elapsed / totalSecs) * 100))}>
                Save & exit
              </button>
              <button className="fv-btn fv-btn-primary fv-btn-full" style={{ height: 52 }} onClick={resumeTimer}>
                <Play size={18} fill="white" />
                Resume
              </button>
            </div>
          )}

          {phase === "done" && (
            <button className="fv-btn fv-btn-primary fv-btn-full fv-btn-lg" onClick={() => finishSession(100)}>
              🎉 Claim Rewards!
            </button>
          )}
        </div>

        {/* Elapsed */}
        {(phase === "running" || phase === "paused") && (
          <div style={{ textAlign: "center", marginTop: 12, color: "#6B7A99", fontSize: "0.78rem", fontWeight: 600 }}>
            Focus time: {fmt(elapsed)} · Session Gold: 🪙 {Math.round(previewReward.gold * (elapsed / totalSecs))}
          </div>
        )}
      </div>
    </FVShell>
  );
}
