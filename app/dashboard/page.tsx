"use client";

import { useState } from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { FVShell } from "@/components/focusville/FVShell";
import { Mascot } from "@/components/focusville/Mascot";
import { Bell, CheckCircle2, Clock, ChevronRight } from "lucide-react";
import { fvToast } from "@/lib/toast";
import { useTranslations } from "next-intl";
import { completeTask as completeTaskDB } from "@/lib/actions/tasks";
import { QuestPanel } from "@/components/game/QuestPanel";
import { CompanionCard } from "@/components/game/CompanionCard";
import { LoginRewardModal } from "@/components/game/LoginRewardModal";
import { DailyEventCard } from "@/components/game/DailyEventCard";
import { StreakMilestone } from "@/components/game/StreakMilestone";
import { HappinessBar } from "@/components/game/HappinessBar";
import { BurnoutCard } from "@/components/game/BurnoutCard";
import { CompletionSheet } from "@/components/game/CompletionSheet";
import type { DailyEvent } from "@/lib/types";

function todayKey() { return new Date().toISOString().slice(0, 10); }

// greeting keys match dashboard translation namespace
function greetingKey() {
  const h = new Date().getHours();
  if (h < 6)  return "still_up";
  if (h < 12) return "greeting_morning";
  if (h < 18) return "greeting_afternoon";
  return "greeting_evening";
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

type PendingTask = { id: string; title: string; gold: number; xp: number } | null;

export default function DashboardPage() {
  const { state, patch, ready } = useStore();
  const t = useTranslations("dashboard");
  const tc = useTranslations("common");
  const [pendingTask, setPendingTask] = useState<PendingTask>(null);

  if (!ready) {
    return (
      <FVShell>
        <div className="fv-loading">
          <Mascot size={60} mood="idle" float />
          <p style={{ color: "#6B7A99", fontSize: "0.85rem" }}>{tc("loading")}</p>
        </div>
      </FVShell>
    );
  }

  const today = todayKey();
  const tasks       = state.tasks ?? [];
  const todayTasks  = tasks.filter((t) => t.day === today && !t.isRecovery);
  const todayDone   = todayTasks.filter((t) => t.status === "completed").length;
  const totalTasks  = tasks.filter((t) => !t.isRecovery).length;
  const doneTasks   = tasks.filter((t) => t.status === "completed").length;
  const planProgress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
  const focusHrs    = (state.focusMinutes / 60).toFixed(1);

  // Active bonuses strip
  const activeBonuses: string[] = [];
  if (state.constructionDiscount) activeBonuses.push("⚒ 50% build discount active");
  if (state.happiness >= 80) activeBonuses.push("🌟 +25% earnings (happy city)");
  if (state.happiness < 25) activeBonuses.push("⚠️ City in crisis — earnings reduced");
  if (state.specialCitizens.length > 0) {
    state.specialCitizens.forEach((c) => activeBonuses.push(`${c.name}: ${c.bonus}`));
  }

  // Today's event — only show if date matches
  const showEvent = state.todayEvent && state.todayEventDate === today;

  function toggleTask(id: string) {
    const task = tasks.find((t) => t.id === id);
    if (!task || task.status === "completed") return;
    setPendingTask({ id: task.id, title: task.title, gold: task.gold, xp: task.xp });
  }

  function confirmCompletion(pct: number) {
    const task = pendingTask;
    setPendingTask(null);
    if (!task) return;

    const today = new Date().toISOString().slice(0, 10);
    const earnedGold = Math.floor(task.gold * (pct / 100));
    const earnedXp   = Math.floor(task.xp   * (pct / 100));
    const isFullDone = pct === 100;

    patch((s) => {
      const last = s.lastActiveDate;
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yStr = yesterday.toISOString().slice(0, 10);
      const newStreak = isFullDone
        ? (last === today ? s.streak : last === yStr ? s.streak + 1 : 1)
        : s.streak;
      return {
        ...s,
        gold: s.gold + earnedGold,
        xp: s.xp + earnedXp,
        streak: newStreak,
        lastActiveDate: isFullDone ? today : s.lastActiveDate,
        tasks: (s.tasks ?? []).map((t) =>
          t.id === task.id
            ? { ...t, status: isFullDone ? "completed" : "pending", completion: pct }
            : t
        ),
      };
    });

    if (isFullDone) {
      fvToast.reward(`✅ ${task.title}`, earnedGold, earnedXp);
    } else {
      fvToast.success(`✨ ${pct}% done! +${earnedGold} 🪙 — every bit counts`);
    }

    completeTaskDB(task.id, pct).catch(() => {});
  }

  function handleEventResolved(effect: Record<string, unknown>) {
    patch((s) => ({
      ...s,
      gold: typeof effect.gold === "number" ? Math.max(0, s.gold + effect.gold) : s.gold,
      energy: typeof effect.energy === "number" ? Math.max(0, s.energy + effect.energy) : s.energy,
      happiness: typeof effect.happiness === "number"
        ? Math.max(0, Math.min(100, s.happiness + (effect.happiness as number)))
        : s.happiness,
      constructionDiscount: effect.constructionDiscount === true ? true : s.constructionDiscount,
      todayEvent: null,
    }));
  }

  return (
    <FVShell>
      <LoginRewardModal />
      <div style={{ padding: "0 0 20px" }}>

        {/* ── Top bar ── */}
        <div style={{
          background: "white",
          padding: "16px 20px 12px",
          borderBottom: "1px solid #D6E9FF",
        }}>
          <div className="row between" style={{ marginBottom: 8 }}>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <div className="fv-gold">
                <span>⚡</span>
                <span>{state.energy.toLocaleString()}</span>
              </div>
              <div className="fv-gold">
                <span>🪙</span>
                <span>{state.gold.toLocaleString()}</span>
              </div>
              <div className="fv-xp">
                <span>💎</span>
                <span>{state.xp.toLocaleString()}</span>
              </div>
            </div>
            <button style={{ background: "none", border: "none", cursor: "pointer", position: "relative", padding: 4 }}>
              <Bell size={20} color="#6B7A99" />
              <div className="fv-dot" style={{ position: "absolute", top: 2, right: 2 }} />
            </button>
          </div>

          <div className="row gap-12">
            <div>
              <p style={{ margin: "0 0 2px", fontSize: "1.1rem", fontWeight: 900, color: "#1D2B53" }}>
                {t(greetingKey() as Parameters<typeof t>[0])}, {state.displayName} {greetingEmoji()}
              </p>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {state.streak > 0 && (
                  <div className="fv-streak" style={{ display: "inline-flex" }}>
                    🔥 {t("streak", { count: state.streak })}
                  </div>
                )}
                <div style={{
                  background: "#EBF5FF",
                  borderRadius: 8,
                  padding: "2px 8px",
                  fontSize: "0.65rem",
                  fontWeight: 700,
                  color: "#5EA9FF",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 3,
                }}>
                  {t((`era_${state.currentEra}`) as Parameters<typeof t>[0])}
                </div>
              </div>
            </div>
            <Mascot size={44} mood={todayDone === todayTasks.length && todayTasks.length > 0 ? "celebrate" : "happy"} />
          </div>
        </div>

        <div style={{ padding: "16px 20px" }}>

          {/* ── Active bonuses strip ── */}
          {activeBonuses.length > 0 && (
            <div style={{
              background: "linear-gradient(90deg, #EBF5FF, #F0F8FF)",
              border: "1px solid #D6E9FF",
              borderRadius: 12,
              padding: "8px 12px",
              marginBottom: 12,
              display: "flex",
              gap: 8,
              overflowX: "auto",
              WebkitOverflowScrolling: "touch",
            }}>
              {activeBonuses.map((b, i) => (
                <span key={i} style={{
                  fontSize: "0.68rem",
                  fontWeight: 700,
                  color: "#5EA9FF",
                  whiteSpace: "nowrap",
                  padding: "2px 8px",
                  background: "white",
                  borderRadius: 6,
                  border: "1px solid #D6E9FF",
                }}>
                  {b}
                </span>
              ))}
            </div>
          )}

          {/* ── Daily event card ── */}
          {showEvent && state.todayEvent && (
            <DailyEventCard
              event={state.todayEvent as DailyEvent}
              onResolved={handleEventResolved}
            />
          )}

          {/* ── Happiness compact bar ── */}
          <div className="fv-card animate-fade-up" style={{ marginBottom: 14, padding: "10px 14px" }}>
            <HappinessBar happiness={state.happiness} compact />
          </div>

          {/* ── Burnout detection card ── */}
          <BurnoutCard />

          {/* ── Streak milestone track ── */}
          {state.streak > 0 && <StreakMilestone streak={state.streak} />}

          {/* ── Goal progress card ── */}
          {state.goal ? (
            <div className="fv-card fv-card-blue animate-fade-up" style={{ marginBottom: 14 }}>
              <div className="row between" style={{ marginBottom: 6 }}>
                <p style={{ margin: 0, fontSize: "0.7rem", fontWeight: 700, opacity: 0.85 }}>{t("goal_progress")}</p>
                <span style={{ fontSize: "1.1rem", fontWeight: 900 }}>{planProgress}%</span>
              </div>
              <div style={{ height: 8, background: "rgba(255,255,255,0.25)", borderRadius: 999, overflow: "hidden", marginBottom: 6 }}>
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
                  {t("view_plan")}
                </Link>
              </div>
            </div>
          ) : (
            <Link href="/plan" style={{ display: "block", marginBottom: 14 }}>
              <div className="fv-card" style={{ textAlign: "center", borderStyle: "dashed" }}>
                <Mascot size={40} mood="thinking" />
                <p style={{ margin: "8px 0 4px", fontWeight: 800, color: "#1D2B53" }}>{t("set_first_goal")}</p>
                <p style={{ margin: 0, color: "#6B7A99", fontSize: "0.82rem" }}>{t("ai_plan")}</p>
              </div>
            </Link>
          )}

          {/* ── Today's tasks ── */}
          <div className="fv-card animate-fade-up delay-1" style={{ marginBottom: 14 }}>
            <div className="row between" style={{ marginBottom: 12 }}>
              <div>
                <p style={{ margin: 0, fontWeight: 800, fontSize: "0.88rem", color: "#1D2B53" }}>{t("tasks_today")}</p>
                <p style={{ margin: "2px 0 0", fontSize: "0.72rem", color: "#6B7A99" }}>
                  {t("tasks_done", { done: todayDone, total: todayTasks.length })}
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
                  {t("all_done")}
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
                        {task.minutes} min · +{task.gold}🪙
                      </p>
                    </div>
                    <div style={{
                      width: 4, alignSelf: "stretch", borderRadius: 2,
                      background: TASK_CATEGORY_COLORS[task.category] ?? "#D6E9FF", flexShrink: 0,
                    }} />
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

          {/* ── Companion ── */}
          <CompanionCard />

          {/* ── Daily Quests ── */}
          <QuestPanel />

          {/* ── Stats row ── */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 14 }} className="animate-fade-up delay-2">
            <div className="fv-stat">
              <div style={{ fontSize: "1.2rem", marginBottom: 4 }}>🏆</div>
              <div className="fv-stat-value" style={{ color: "#5EA9FF" }}>Lv.{state.level}</div>
              <div className="fv-stat-label">{state.xp} XP</div>
            </div>
            <div className="fv-stat">
              <div style={{ fontSize: "1.2rem", marginBottom: 4 }}>⏱</div>
              <div className="fv-stat-value">{focusHrs}h</div>
              <div className="fv-stat-label">{t("focus_hours")}</div>
            </div>
            <div className="fv-stat">
              <div style={{ fontSize: "1.2rem", marginBottom: 4 }}>⚡</div>
              <div className="fv-stat-value">{state.energy}</div>
              <div className="fv-stat-label">{tc("energy")}</div>
            </div>
          </div>

          {/* ── Quick actions ── */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }} className="animate-fade-up delay-3">
            <Link href="/focus" className="fv-btn fv-btn-primary fv-btn-full" style={{ height: 52, borderRadius: 16 }}>
              {t("start_focus")}
            </Link>
            <Link href="/community" className="fv-btn fv-btn-secondary fv-btn-full" style={{ height: 52, borderRadius: 16 }}>
              🏙 My City
            </Link>
          </div>
        </div>
      </div>

      {pendingTask && (
        <CompletionSheet
          taskTitle={pendingTask.title}
          baseGold={pendingTask.gold}
          baseXp={pendingTask.xp}
          onConfirm={confirmCompletion}
          onClose={() => setPendingTask(null)}
        />
      )}
    </FVShell>
  );
}
