"use client";

import Link from "next/link";
import { useStore } from "@/lib/store";
import { AppShell } from "@/components/layout/AppShell";

function daysLeft(deadline: string) {
  return Math.max(
    0,
    Math.ceil((new Date(deadline).getTime() - Date.now()) / 86_400_000)
  );
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function greeting() {
  const h = new Date().getHours();
  if (h < 6) return "Still up";
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  if (h < 22) return "Good evening";
  return "Late night";
}

function greetingEmoji() {
  const h = new Date().getHours();
  if (h < 6) return "🌙";
  if (h < 12) return "☀️";
  if (h < 18) return "🌤";
  if (h < 22) return "🌆";
  return "✨";
}

export default function DashboardPage() {
  const { state, ready } = useStore();

  if (!ready) {
    return (
      <AppShell currentRoute="/dashboard">
        <div className="loading-state">
          <div className="loading-pulse" />
          <p>Getting your workspace ready…</p>
        </div>
      </AppShell>
    );
  }

  const todayTasks = state.tasks.filter(
    (t) => t.day === todayKey() && !t.isRecovery
  );
  const nextTask =
    todayTasks.find((t) => t.status !== "completed") ??
    state.tasks.find((t) => t.status !== "completed" && !t.isRecovery);
  const totalTasks = state.tasks.filter((t) => !t.isRecovery).length;
  const doneTasks = state.tasks.filter((t) => t.status === "completed").length;
  const planProgress =
    totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
  const focusHrs = (state.focusMinutes / 60).toFixed(1);
  const todayDone = todayTasks.filter((t) => t.status === "completed").length;
  const allDoneToday =
    todayTasks.length > 0 && todayDone === todayTasks.length;

  return (
    <AppShell currentRoute="/dashboard">
      <div className="page-header">
        <div
          className="row"
          style={{ alignItems: "flex-start", flexWrap: "wrap", gap: 10 }}
        >
          <div style={{ flex: 1 }}>
            <h1 className="page-title">
              {greeting()}, {state.displayName} {greetingEmoji()}
            </h1>
            <p className="page-subtitle">
              {allDoneToday
                ? "You finished everything for today. That's huge 🎉"
                : "Here's your day — one task at a time."}
            </p>
          </div>
          {state.streak > 0 && (
            <div className="streak-badge">🔥 {state.streak} day streak</div>
          )}
        </div>
      </div>

      <div className="stack gap-20">
        {state.goal ? (
          <div className="grid-2">
            {/* Goal card */}
            <div
              className="card card-lg"
              style={{
                background:
                  "linear-gradient(135deg, #1A4540 0%, #2D6A61 100%)",
                color: "white",
                border: "none",
              }}
            >
              <div className="stack gap-12">
                <p
                  style={{
                    margin: 0,
                    fontSize: "0.68rem",
                    fontWeight: 800,
                    opacity: 0.7,
                    textTransform: "uppercase",
                    letterSpacing: ".07em",
                  }}
                >
                  🎯 Your goal
                </p>
                <h2
                  style={{
                    margin: 0,
                    fontSize: "1.15rem",
                    fontWeight: 900,
                    lineHeight: 1.25,
                  }}
                >
                  {state.goal.title}
                </h2>
                <p style={{ margin: 0, fontSize: "0.85rem", opacity: 0.75 }}>
                  ⏰ {daysLeft(state.goal.deadline)} days left
                </p>
                <div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: 5,
                      fontSize: "0.72rem",
                      opacity: 0.7,
                    }}
                  >
                    <span>Progress</span>
                    <span>{planProgress}%</span>
                  </div>
                  <div className="progress-track">
                    <div
                      className="progress-fill progress-fill-accent"
                      style={{ width: `${planProgress}%` }}
                    />
                  </div>
                </div>
                <Link
                  href="/plan"
                  style={{
                    color: "rgba(255,255,255,.82)",
                    fontSize: "0.82rem",
                    fontWeight: 700,
                  }}
                >
                  View full plan →
                </Link>
              </div>
            </div>

            {/* Next task card */}
            <div className="card card-lg">
              <div className="stack gap-12">
                <p className="section-label" style={{ margin: 0 }}>
                  ⚡ Up next for you
                </p>
                {nextTask ? (
                  <>
                    <h2
                      style={{
                        margin: 0,
                        fontSize: "1.05rem",
                        fontWeight: 800,
                        lineHeight: 1.35,
                      }}
                    >
                      {nextTask.title}
                    </h2>
                    <p
                      style={{
                        margin: 0,
                        fontSize: "0.8rem",
                        color: "var(--color-muted)",
                        lineHeight: 1.5,
                      }}
                    >
                      Complete this to earn Gold and XP 💪
                    </p>
                    <div className="row gap-6 cluster">
                      <span className="badge badge-gray">
                        ⏱ {nextTask.minutes} min
                      </span>
                      <span className="badge badge-amber">
                        +{nextTask.gold} Gold
                      </span>
                      <span className="badge badge-primary">
                        +{nextTask.xp} XP
                      </span>
                    </div>
                    <Link href="/focus" className="btn btn-primary btn-full">
                      ▶ Start focus session
                    </Link>
                    <Link
                      href="/plan"
                      style={{
                        fontSize: "0.78rem",
                        color: "var(--color-muted)",
                        textAlign: "center",
                      }}
                    >
                      Browse all tasks
                    </Link>
                  </>
                ) : (
                  <div
                    className="stack gap-12"
                    style={{ alignItems: "center", padding: "16px 0" }}
                  >
                    <span style={{ fontSize: "2.5rem" }}>🎉</span>
                    <p
                      style={{
                        margin: 0,
                        textAlign: "center",
                        fontWeight: 800,
                      }}
                    >
                      You&apos;re all done for today!
                    </p>
                    <p
                      style={{
                        margin: 0,
                        textAlign: "center",
                        color: "var(--color-muted)",
                        fontSize: "0.85rem",
                      }}
                    >
                      Rest is part of the process. See you tomorrow 🌙
                    </p>
                    <Link href="/plan" className="btn btn-secondary btn-full">
                      View your plan
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="card card-lg" style={{ textAlign: "center" }}>
            <div className="stack gap-16" style={{ alignItems: "center" }}>
              <span style={{ fontSize: "2.8rem" }}>🌱</span>
              <h2 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 900 }}>
                What are you working toward?
              </h2>
              <p
                style={{
                  margin: 0,
                  color: "var(--color-muted)",
                  fontSize: "0.9rem",
                  maxWidth: 300,
                  lineHeight: 1.55,
                }}
              >
                Set your first goal and we&apos;ll break it into realistic daily
                tasks. Easy start, big results.
              </p>
              <Link href="/onboarding" className="btn btn-primary btn-lg">
                Let&apos;s build your plan →
              </Link>
            </div>
          </div>
        )}

        {/* Stats row */}
        <div>
          <p className="section-label">Your stats</p>
          <div className="stat-grid">
            <StatCard
              icon="💰"
              label="Gold"
              value={state.gold.toString()}
              detail="total earned"
              accent
            />
            <StatCard
              icon="⭐"
              label="Level"
              value={`${state.level}`}
              detail={`${state.xp} XP`}
            />
            <StatCard
              icon="🔥"
              label="Streak"
              value={`${state.streak}d`}
              detail="days in a row"
            />
            <StatCard
              icon="⏱"
              label="Focus"
              value={`${focusHrs}h`}
              detail="total focus time"
            />
          </div>
        </div>

        {/* Mood + city */}
        <div className="grid-2">
          <div className="card" style={{ borderStyle: "dashed" }}>
            <div className="stack gap-10">
              <div className="row gap-8">
                <span style={{ fontSize: "1.3rem" }}>💚</span>
                <p className="section-label" style={{ margin: 0 }}>
                  Mood check-in
                </p>
              </div>
              <p
                style={{
                  margin: 0,
                  fontSize: "0.875rem",
                  color: "var(--color-muted)",
                  lineHeight: 1.55,
                }}
              >
                3 quick questions. Earn 25 Gold. Takes 30 seconds.
              </p>
              <Link href="/mood" className="btn btn-secondary btn-full">
                Check in now
              </Link>
            </div>
          </div>

          <div
            className="card"
            style={{ padding: 0, overflow: "hidden" }}
          >
            <div className="city-skyline">
              <div
                className="building building-home"
                style={{
                  height: `${40 + state.houseLevel * 14}px`,
                  flex: "0 0 30px",
                }}
              />
              {state.businesses.map((b) => (
                <div
                  key={b.id}
                  className={`building ${
                    b.level > 0 ? "building-biz" : "building-empty"
                  }`}
                  style={{ height: `${30 + b.level * 12}px` }}
                />
              ))}
            </div>
            <div className="city-ground" />
            <div style={{ padding: "10px 14px" }}>
              <p
                style={{
                  margin: "0 0 2px",
                  fontSize: "0.78rem",
                  color: "var(--color-muted)",
                }}
              >
                Your focus time builds this city ✨
              </p>
              <Link
                href="/progress"
                style={{
                  fontSize: "0.8rem",
                  color: "var(--color-primary)",
                  fontWeight: 700,
                }}
              >
                Upgrade buildings →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function StatCard({
  icon,
  label,
  value,
  detail,
  accent,
}: {
  icon: string;
  label: string;
  value: string;
  detail: string;
  accent?: boolean;
}) {
  return (
    <div className="stat-card">
      <div className="stat-label">
        {icon} {label}
      </div>
      <div
        className="stat-value"
        style={accent ? { color: "var(--color-accent)" } : {}}
      >
        {value}
      </div>
      <div className="stat-detail">{detail}</div>
    </div>
  );
}
