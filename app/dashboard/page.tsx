"use client";

import Link from "next/link";
import { useStore } from "@/lib/store";
import { FVShell } from "@/components/focusville/FVShell";
import { Mascot } from "@/components/focusville/Mascot";
import { CurrencyDisplay } from "@/components/focusville/CurrencyDisplay";
import { Bell, CheckCircle2, Clock, ChevronRight } from "lucide-react";

function todayKey() { return new Date().toISOString().slice(0, 10); }

function greeting() {
  const h = new Date().getHours();
  if (h < 6)  return "Still up";
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function greetingEmoji() {
  const h = new Date().getHours();
  if (h < 6)  return "🌙";
  if (h < 12) return "🌟";
  if (h < 18) return "⛅";
  return "🌆";
}

const TASK_CATEGORY_COLORS: Record<string, string> = {
  study:    "#5EA9FF",
  career:   "#A78BFA",
  creative: "#FFD45E",
  health:   "#7EDC8A",
  personal: "#FF7B7B",
  other:    "#FFAD5E",
};

export default function DashboardPage() {
  const { state, patch, ready } = useStore();

  if (!ready) {
    return (
      <FVShell>
        <div className="fv-loading">
          <Mascot size={60} mood="idle" float />
          <p style={{ color: "#6B7A99", fontSize: "0.85rem" }}>Getting ready…</p>
        </div>
      </FVShell>
    );
  }

  const today = todayKey();
  const todayTasks  = state.tasks.filter((t) => t.day === today && !t.isRecovery);
  const todayDone   = todayTasks.filter((t) => t.status === "completed").length;
  const totalTasks  = state.tasks.filter((t) => !t.isRecovery).length;
  const doneTasks   = state.tasks.filter((t) => t.status === "completed").length;
  const planProgress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
  const focusHrs    = (state.focusMinutes / 60).toFixed(1);

  function toggleTask(id: string) {
    patch((s) => ({
      ...s,
      tasks: s.tasks.map((t) =>
        t.id === id
          ? {
              ...t,
              status: t.status === "completed" ? "pending" : "completed",
              completion: t.status === "completed" ? 0 : 100,
            }
          : t
      ),
    }));
  }

  return (
    <FVShell>
      <div style={{ padding: "0 0 20px" }}>

        {/* ── Top bar ── */}
        <div style={{
          background: "white",
          padding: "16px 20px 12px",
          borderBottom: "1px solid #D6E9FF",
        }}>
          <div className="row between" style={{ marginBottom: 8 }}>
            <div className="row gap-8">
              <div className="fv-gold">
                <span>🪙</span>
                <span>{state.gold.toLocaleString()}</span>
              </div>
              <div className="fv-xp">
                <span>💎</span>
                <span>{state.xp.toLocaleString()}</span>
              </div>
            </div>
            <button style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              position: "relative",
              padding: 4,
            }}>
              <Bell size={20} color="#6B7A99" />
              <div className="fv-dot" style={{ position: "absolute", top: 2, right: 2 }} />
            </button>
          </div>

          <div className="row gap-12">
            <div>
              <p style={{ margin: "0 0 2px", fontSize: "1.1rem", fontWeight: 900, color: "#1D2B53" }}>
                {greeting()}, {state.displayName} {greetingEmoji()}
              </p>
              {state.streak > 0 && (
                <div className="fv-streak" style={{ display: "inline-flex" }}>
                  🔥 {state.streak} day streak
                </div>
              )}
            </div>
            <Mascot size={44} mood={todayDone === todayTasks.length && todayTasks.length > 0 ? "celebrate" : "happy"} />
          </div>
        </div>

        <div style={{ padding: "16px 20px" }}>

          {/* ── Goal progress card ── */}
          {state.goal ? (
            <div className="fv-card fv-card-blue animate-fade-up" style={{ marginBottom: 14 }}>
              <div className="row between" style={{ marginBottom: 6 }}>
                <p style={{ margin: 0, fontSize: "0.7rem", fontWeight: 700, opacity: 0.85 }}>Goal Progress</p>
                <span style={{ fontSize: "1.1rem", fontWeight: 900 }}>{planProgress}%</span>
              </div>
              <div style={{
                height: 8,
                background: "rgba(255,255,255,0.25)",
                borderRadius: 999,
                overflow: "hidden",
                marginBottom: 6,
              }}>
                <div style={{
                  height: "100%",
                  width: `${planProgress}%`,
                  background: "white",
                  borderRadius: 999,
                  transition: "width 600ms ease",
                }} />
              </div>
              <div className="row between">
                <p style={{ margin: 0, fontSize: "0.73rem", opacity: 0.85 }}>
                  {doneTasks} / {totalTasks} tasks done · {focusHrs}h focus
                </p>
                <Link href="/plan" style={{ color: "rgba(255,255,255,0.9)", fontSize: "0.73rem", fontWeight: 700 }}>
                  View plan →
                </Link>
              </div>
            </div>
          ) : (
            <Link href="/plan" style={{ display: "block", marginBottom: 14 }}>
              <div className="fv-card" style={{ textAlign: "center", borderStyle: "dashed" }}>
                <Mascot size={40} mood="thinking" />
                <p style={{ margin: "8px 0 4px", fontWeight: 800, color: "#1D2B53" }}>Set your first goal</p>
                <p style={{ margin: 0, color: "#6B7A99", fontSize: "0.82rem" }}>Let AI build your study plan</p>
              </div>
            </Link>
          )}

          {/* ── Today's tasks ── */}
          <div className="fv-card animate-fade-up delay-1" style={{ marginBottom: 14 }}>
            <div className="row between" style={{ marginBottom: 12 }}>
              <div>
                <p style={{ margin: 0, fontWeight: 800, fontSize: "0.88rem", color: "#1D2B53" }}>Today&apos;s Plan</p>
                <p style={{ margin: "2px 0 0", fontSize: "0.72rem", color: "#6B7A99" }}>
                  {todayDone} / {todayTasks.length} tasks
                </p>
              </div>
              <Link href="/plan" style={{ color: "#5EA9FF" }}>
                <ChevronRight size={18} />
              </Link>
            </div>

            {todayTasks.length === 0 ? (
              <div style={{ textAlign: "center", padding: "16px 0" }}>
                <Mascot size={48} mood="celebrate" />
                <p style={{ margin: "8px 0 0", fontWeight: 700, color: "#1D2B53", fontSize: "0.88rem" }}>
                  All done for today!
                </p>
              </div>
            ) : (
              <div className="stack gap-8">
                {todayTasks.slice(0, 6).map((task, idx) => (
                  <div
                    key={task.id}
                    className={`fv-task ${task.status === "completed" ? "done" : ""} animate-fade-up`}
                    style={{ animationDelay: `${idx * 50}ms`, cursor: "pointer" }}
                    onClick={() => toggleTask(task.id)}
                  >
                    <div className={`fv-checkbox ${task.status === "completed" ? "checked" : ""}`}>
                      {task.status === "completed" && <CheckCircle2 size={14} color="white" />}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{
                        margin: 0,
                        fontSize: "0.85rem",
                        fontWeight: 600,
                        color: task.status === "completed" ? "#6B7A99" : "#1D2B53",
                        textDecoration: task.status === "completed" ? "line-through" : "none",
                      }}>
                        {task.title}
                      </p>
                      <p style={{ margin: "2px 0 0", fontSize: "0.7rem", color: "#6B7A99" }}>
                        <Clock size={10} style={{ display: "inline", verticalAlign: "middle", marginRight: 3 }} />
                        {task.minutes} min
                      </p>
                    </div>
                    <div
                      style={{
                        width: 4,
                        alignSelf: "stretch",
                        borderRadius: 2,
                        background: TASK_CATEGORY_COLORS[task.category] ?? "#D6E9FF",
                        flexShrink: 0,
                      }}
                    />
                  </div>
                ))}
                {todayTasks.length > 6 && (
                  <Link href="/plan" style={{ textAlign: "center", color: "#5EA9FF", fontSize: "0.82rem", fontWeight: 700, padding: "6px 0" }}>
                    +{todayTasks.length - 6} more tasks →
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* ── Stats row ── */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10, marginBottom: 14 }} className="animate-fade-up delay-2">
            <div className="fv-stat">
              <div style={{ fontSize: "1.4rem", marginBottom: 4 }}>🏆</div>
              <div className="fv-stat-value" style={{ color: "#5EA9FF" }}>Lv.{state.level}</div>
              <div className="fv-stat-label">{state.xp} XP</div>
            </div>
            <div className="fv-stat">
              <div style={{ fontSize: "1.4rem", marginBottom: 4 }}>⏱</div>
              <div className="fv-stat-value">{focusHrs}h</div>
              <div className="fv-stat-label">Focus time</div>
            </div>
          </div>

          {/* ── Quick actions ── */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }} className="animate-fade-up delay-3">
            <Link href="/focus" className="fv-btn fv-btn-primary fv-btn-full" style={{ height: 52, borderRadius: 16 }}>
              ▶ Start Focus
            </Link>
            <Link href="/mood" className="fv-btn fv-btn-secondary fv-btn-full" style={{ height: 52, borderRadius: 16 }}>
              💚 Check In
            </Link>
          </div>
        </div>
      </div>
    </FVShell>
  );
}
