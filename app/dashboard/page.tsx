"use client";

import Link from "next/link";
import { useStore } from "@/lib/store";
import { AppShell } from "@/components/layout/AppShell";

function daysLeft(deadline: string) {
  return Math.max(0, Math.ceil((new Date(deadline).getTime() - Date.now()) / 86_400_000));
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

export default function DashboardPage() {
  const { state, ready } = useStore();

  if (!ready) {
    return (
      <AppShell currentRoute="/dashboard">
        <div className="empty-state" style={{ paddingTop: 80 }}>
          <p>Loading your workspace…</p>
        </div>
      </AppShell>
    );
  }

  const todayTasks = state.tasks.filter((t) => t.day === todayKey() && !t.isRecovery);
  const nextTask =
    todayTasks.find((t) => t.status !== "completed") ??
    state.tasks.find((t) => t.status !== "completed" && !t.isRecovery);
  const totalTasks = state.tasks.filter((t) => !t.isRecovery).length;
  const doneTasks = state.tasks.filter((t) => t.status === "completed").length;
  const planProgress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
  const focusHrs = (state.focusMinutes / 60).toFixed(1);

  return (
    <AppShell currentRoute="/dashboard">
      <div className="page-header">
        <h1 className="page-title">{greeting()}, {state.displayName} 👋</h1>
        <p className="page-subtitle">Here&apos;s what matters today.</p>
      </div>

      <div className="stack gap-20">
        {state.goal ? (
          <div className="grid-2">
            {/* Goal */}
            <div
              className="card card-lg"
              style={{ background: "linear-gradient(135deg, #1A4540 0%, #2D6A61 100%)", color: "white", border: "none" }}
            >
              <div className="stack gap-12">
                <p style={{ margin: 0, fontSize: "0.7rem", fontWeight: 800, opacity: .7, textTransform: "uppercase", letterSpacing: ".07em" }}>
                  Current goal
                </p>
                <h2 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 900, lineHeight: 1.25 }}>
                  {state.goal.title}
                </h2>
                <p style={{ margin: 0, fontSize: "0.85rem", opacity: .75 }}>
                  ⏰ {daysLeft(state.goal.deadline)} days left
                </p>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5, fontSize: "0.72rem", opacity: .7 }}>
                    <span>Overall progress</span><span>{planProgress}%</span>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill progress-fill-accent" style={{ width: `${planProgress}%` }} />
                  </div>
                </div>
                <Link href="/plan" style={{ color: "rgba(255,255,255,.82)", fontSize: "0.82rem", fontWeight: 700 }}>
                  View full plan →
                </Link>
              </div>
            </div>

            {/* Next task */}
            <div className="card card-lg">
              <div className="stack gap-12">
                <p className="section-label" style={{ margin: 0 }}>What&apos;s next?</p>
                {nextTask ? (
                  <>
                    <h2 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800, lineHeight: 1.3 }}>
                      {nextTask.title}
                    </h2>
                    <div className="row gap-6 cluster">
                      <span className="badge badge-gray">{nextTask.minutes} min</span>
                      <span className="badge badge-amber">+{nextTask.gold} Gold</span>
                      <span className="badge badge-primary">+{nextTask.xp} XP</span>
                    </div>
                    <Link href="/focus" className="btn btn-primary btn-full">
                      ▶ Start focus session
                    </Link>
                    <Link href="/plan" style={{ fontSize: "0.8rem", color: "var(--color-muted)", textAlign: "center" }}>
                      See all tasks
                    </Link>
                  </>
                ) : (
                  <div className="stack gap-12" style={{ alignItems: "center", padding: "16px 0" }}>
                    <span style={{ fontSize: "2rem" }}>🎉</span>
                    <p style={{ margin: 0, textAlign: "center", color: "var(--color-muted)", fontSize: "0.875rem" }}>
                      All tasks for today are done!
                    </p>
                    <Link href="/plan" className="btn btn-secondary btn-full">View plan</Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="card card-lg" style={{ textAlign: "center" }}>
            <div className="stack gap-16" style={{ alignItems: "center" }}>
              <span style={{ fontSize: "2.5rem" }}>🎯</span>
              <h2 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 900 }}>Set your first goal</h2>
              <p style={{ margin: 0, color: "var(--color-muted)", fontSize: "0.9rem" }}>
                The planner creates a realistic daily schedule for you.
              </p>
              <Link href="/onboarding" className="btn btn-primary btn-lg">Create my plan →</Link>
            </div>
          </div>
        )}

        {/* Stats */}
        <div>
          <p className="section-label">Your progress</p>
          <div className="stat-grid">
            <StatCard icon="💰" label="Gold" value={state.gold.toString()} detail="earned from focus" accent />
            <StatCard icon="⭐" label="Level" value={`${state.level}`} detail={`${state.xp} XP`} />
            <StatCard icon="🔥" label="Streak" value={`${state.streak}`} detail="days in a row" />
            <StatCard icon="⏱" label="Focus" value={`${focusHrs}h`} detail="total time" />
          </div>
        </div>

        {/* Mood + city */}
        <div className="grid-2">
          <div className="card" style={{ borderStyle: "dashed" }}>
            <div className="stack gap-10">
              <div className="row gap-8">
                <span style={{ fontSize: "1.3rem" }}>💚</span>
                <p className="section-label" style={{ margin: 0 }}>Mood check-in</p>
              </div>
              <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--color-muted)", lineHeight: 1.55 }}>
                How are you feeling today? A 3-question check-in earns 25 Gold.
              </p>
              <Link href="/mood" className="btn btn-secondary btn-full">Check in now</Link>
            </div>
          </div>

          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <div className="city-skyline">
              <div className="building building-home" style={{ height: `${40 + state.houseLevel * 14}px`, flex: "0 0 30px" }} />
              {state.businesses.map((b) => (
                <div
                  key={b.id}
                  className={`building ${b.level > 0 ? "building-biz" : "building-empty"}`}
                  style={{ height: `${30 + b.level * 12}px` }}
                />
              ))}
            </div>
            <div className="city-ground" />
            <div style={{ padding: "10px 14px" }}>
              <p style={{ margin: "0 0 2px", fontSize: "0.78rem", color: "var(--color-muted)" }}>
                Your focus time builds this city.
              </p>
              <Link href="/progress" style={{ fontSize: "0.8rem", color: "var(--color-primary)", fontWeight: 700 }}>
                Upgrade buildings →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function StatCard({ icon, label, value, detail, accent }: {
  icon: string; label: string; value: string; detail: string; accent?: boolean;
}) {
  return (
    <div className="stat-card">
      <div className="stat-label">{icon} {label}</div>
      <div className="stat-value" style={accent ? { color: "var(--color-accent)" } : {}}>{value}</div>
      <div className="stat-detail">{detail}</div>
    </div>
  );
}
