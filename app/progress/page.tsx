"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { FVShell } from "@/components/focusville/FVShell";
import { Mascot } from "@/components/focusville/Mascot";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { Trophy, Flame, Clock, Star, TrendingUp, ChevronRight } from "lucide-react";

type ProgressTab = "Focus" | "Mood" | "City" | "Achievements";

const ACHIEVEMENTS = [
  { id: "a1", icon: "⭐", label: "First Step",    color: "#FFD45E", border: "#FFD45E", unlocked: true  },
  { id: "a2", icon: "🔥", label: "7 Day Streak",  color: "#FF7B7B", border: "#FF7B7B", unlocked: true  },
  { id: "a3", icon: "🏆", label: "Focus Master",  color: "#5EA9FF", border: "#5EA9FF", unlocked: false },
  { id: "a4", icon: "🌟", label: "Plan Complete", color: "#6B7A99", border: "#D6E9FF", unlocked: false },
];

function buildWeekData(focusMinutes: number) {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const base  = Math.round(focusMinutes / 7);
  return days.map((day, i) => ({
    day,
    hours: parseFloat(Math.max(0, (base * (0.5 + Math.random()))).toFixed(1)),
  }));
}

const CustomTooltip = ({ active, payload, label }: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}) => {
  if (active && payload?.length) {
    return (
      <div style={{
        background: "#1D2B53",
        color: "white",
        borderRadius: 8,
        padding: "6px 10px",
        fontSize: "0.75rem",
        fontWeight: 700,
      }}>
        <p style={{ margin: 0 }}>{label}</p>
        <p style={{ margin: "2px 0 0", color: "#8EC5FF" }}>{payload[0].value}h</p>
      </div>
    );
  }
  return null;
};

export default function ProgressPage() {
  const { state, ready } = useStore();
  const [tab, setTab] = useState<ProgressTab>("Focus");

  if (!ready) {
    return (
      <FVShell>
        <div className="fv-loading">
          <Mascot size={60} mood="idle" float />
        </div>
      </FVShell>
    );
  }

  const focusHrs    = (state.focusMinutes / 60).toFixed(1);
  const totalTasks  = state.tasks.filter((t) => !t.isRecovery).length;
  const doneTasks   = state.tasks.filter((t) => t.status === "completed").length;
  const weekData    = buildWeekData(state.focusMinutes);
  const maxHours    = Math.max(...weekData.map((d) => d.hours));

  /* This week vs last week (mocked) */
  const thisWeekMins = Math.round(state.focusMinutes * 0.4);
  const lastWeekMins = Math.round(state.focusMinutes * 0.32);
  const weekChange   = lastWeekMins > 0 ? Math.round(((thisWeekMins - lastWeekMins) / lastWeekMins) * 100) : 0;

  return (
    <FVShell>
      <div style={{ padding: "0 0 20px" }}>

        {/* Header */}
        <div style={{
          background: "white",
          padding: "16px 20px 12px",
          borderBottom: "1px solid #D6E9FF",
        }}>
          <div className="row between" style={{ marginBottom: 4 }}>
            <h1 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 900, color: "#1D2B53" }}>Your Progress</h1>
            <ChevronRight size={18} color="#6B7A99" />
          </div>

          {/* Tab bar */}
          <div className="fv-tabs" style={{ marginTop: 10 }}>
            {(["Focus", "Mood", "City", "Achievements"] as ProgressTab[]).map((t) => (
              <button
                key={t}
                className={`fv-tab ${tab === t ? "active" : ""}`}
                style={{ fontSize: "0.72rem" }}
                onClick={() => setTab(t)}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div style={{ padding: "16px 20px" }}>

          {tab === "Focus" && (
            <>
              {/* Focus hours card */}
              <div className="fv-card animate-fade-up" style={{ marginBottom: 12 }}>
                <div className="row between" style={{ marginBottom: 12 }}>
                  <div>
                    <p className="fv-label" style={{ margin: "0 0 4px" }}>Focus Hours</p>
                    <div style={{ fontSize: "1.8rem", fontWeight: 900, color: "#1D2B53" }}>
                      {(thisWeekMins / 60).toFixed(0)}h {thisWeekMins % 60}m
                    </div>
                    <p style={{ margin: "2px 0 0", fontSize: "0.72rem", color: "#6B7A99" }}>This Week</p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 3,
                      background: "#F0FFF4",
                      border: "1px solid #B8EDCA",
                      borderRadius: 999,
                      padding: "4px 10px",
                      fontSize: "0.72rem",
                      fontWeight: 800,
                      color: "#2E9E43",
                    }}>
                      <TrendingUp size={12} />
                      ↑ {weekChange}% vs last week
                    </div>
                  </div>
                </div>

                {/* Bar chart */}
                <div style={{ height: 140, marginTop: 8 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weekData} barSize={22} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F0F5FF" vertical={false} />
                      <XAxis
                        dataKey="day"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 11, fontWeight: 700, fill: "#6B7A99" }}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fill: "#B0BFCC" }}
                        tickFormatter={(v) => `${v}h`}
                      />
                      <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(94,169,255,0.08)" }} />
                      <Bar
                        dataKey="hours"
                        fill="#5EA9FF"
                        radius={[6, 6, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Stats grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
                <div className="fv-card animate-fade-up delay-1">
                  <div style={{ fontSize: "1.3rem", marginBottom: 6 }}>🔥</div>
                  <div style={{ fontSize: "1.6rem", fontWeight: 900, color: "#1D2B53" }}>{state.streak}</div>
                  <div style={{ fontSize: "0.7rem", color: "#6B7A99", fontWeight: 600 }}>Longest Streak</div>
                  <div style={{ fontSize: "0.68rem", color: "#6B7A99", marginTop: 2 }}>days</div>
                </div>
                <div className="fv-card animate-fade-up delay-1">
                  <div style={{ fontSize: "1.3rem", marginBottom: 6 }}>⏱</div>
                  <div style={{ fontSize: "1.6rem", fontWeight: 900, color: "#1D2B53" }}>{focusHrs}h</div>
                  <div style={{ fontSize: "0.7rem", color: "#6B7A99", fontWeight: 600 }}>Total Focus Hours</div>
                  <div style={{ fontSize: "0.68rem", color: "#6B7A99", marginTop: 2 }}>all time</div>
                </div>
              </div>

              {/* Achievements preview */}
              <div className="fv-card animate-fade-up delay-2">
                <div className="row between" style={{ marginBottom: 12 }}>
                  <p style={{ margin: 0, fontWeight: 800, fontSize: "0.85rem", color: "#1D2B53" }}>Achievements</p>
                  <button
                    className="fv-btn fv-btn-ghost fv-btn-sm"
                    onClick={() => setTab("Achievements")}
                    style={{ height: 28, fontSize: "0.72rem", color: "#5EA9FF" }}
                  >
                    View all
                  </button>
                </div>
                <div className="row gap-12">
                  {ACHIEVEMENTS.map((a) => (
                    <div
                      key={a.id}
                      className="fv-achievement"
                      style={{
                        borderColor: a.border,
                        background: a.unlocked ? `${a.color}22` : "#F5FAFF",
                        opacity: a.unlocked ? 1 : 0.45,
                        filter: a.unlocked ? "none" : "grayscale(0.8)",
                      }}
                    >
                      {a.icon}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {tab === "Mood" && (
            <div className="stack gap-12">
              <div className="fv-card animate-fade-up">
                <p style={{ margin: "0 0 12px", fontWeight: 800, fontSize: "0.85rem", color: "#1D2B53" }}>
                  Recent Mood History
                </p>
                {state.moods.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "20px 0" }}>
                    <Mascot size={48} mood="idle" />
                    <p style={{ margin: "10px 0 0", color: "#6B7A99", fontSize: "0.82rem" }}>
                      No mood entries yet. Check in daily!
                    </p>
                  </div>
                ) : (
                  <div className="stack gap-8">
                    {state.moods.slice(0, 7).map((m) => (
                      <div key={m.id} className="row between gap-8">
                        <div className="row gap-10">
                          <div style={{
                            width: 36,
                            height: 36,
                            borderRadius: "50%",
                            background: "#EBF5FF",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "1.1rem",
                          }}>
                            {m.tone === "steady" ? "😊" : m.tone === "rested" ? "😄" : m.tone === "tired" ? "😴" : "😰"}
                          </div>
                          <div>
                            <p style={{ margin: 0, fontWeight: 700, fontSize: "0.82rem", color: "#1D2B53", textTransform: "capitalize" }}>
                              {m.tone}
                            </p>
                            <p style={{ margin: 0, fontSize: "0.7rem", color: "#6B7A99" }}>
                              {new Date(m.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                            </p>
                          </div>
                        </div>
                        <div className="fv-gold" style={{ fontSize: "0.72rem" }}>
                          🪙 +{m.goldAwarded}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="fv-card animate-fade-up delay-1">
                <p style={{ margin: "0 0 8px", fontWeight: 800, fontSize: "0.82rem", color: "#1D2B53" }}>
                  Mood Tips
                </p>
                <p style={{ margin: 0, fontSize: "0.8rem", color: "#6B7A99", lineHeight: 1.6 }}>
                  Checking in daily helps us tailor your plan. The more you share, the better your AI plan becomes.
                </p>
              </div>
            </div>
          )}

          {tab === "City" && (
            <div className="stack gap-12">
              {/* City preview */}
              <div style={{
                background: "linear-gradient(180deg, #B8E4FF 0%, #D4EEFF 45%, #C8EBB5 75%, #A8D98A 100%)",
                borderRadius: 20,
                height: 180,
                position: "relative",
                overflow: "hidden",
              }} className="animate-fade-up">
                {[
                  { l: 20,  w: 50, h: 80,  c: "#8EC5FF" },
                  { l: 80,  w: 40, h: 60,  c: "#7EDC8A" },
                  { l: 130, w: 60, h: 100, c: "#5EA9FF" },
                  { l: 200, w: 45, h: 70,  c: "#FFAD5E" },
                  { l: 255, w: 55, h: 90,  c: "#A78BFA" },
                  { l: 320, w: 38, h: 55,  c: "#FFD45E" },
                ].map((b, i) => (
                  <div key={i} style={{
                    position: "absolute",
                    bottom: 30,
                    left: b.l,
                    width: b.w,
                    height: b.h + state.houseLevel * 5,
                    background: b.c,
                    borderRadius: "6px 6px 0 0",
                    opacity: 0.85,
                  }} />
                ))}
                <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 30, background: "#A8D98A" }} />
                <div style={{ position: "absolute", bottom: 28, left: "50%", transform: "translateX(-50%)", animation: "mascot-float 2s ease-in-out infinite" }}>
                  <Mascot size={40} mood="happy" />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }} className="animate-fade-up delay-1">
                <div className="fv-stat">
                  <div style={{ fontSize: "1.5rem" }}>🏠</div>
                  <div className="fv-stat-value" style={{ color: "#5EA9FF" }}>Lv.{state.houseLevel}</div>
                  <div className="fv-stat-label">House Level</div>
                </div>
                <div className="fv-stat">
                  <div style={{ fontSize: "1.5rem" }}>🏗</div>
                  <div className="fv-stat-value" style={{ color: "#7EDC8A" }}>
                    {state.businesses.filter((b) => b.level > 0).length}
                  </div>
                  <div className="fv-stat-label">Buildings</div>
                </div>
              </div>

              <div className="fv-card animate-fade-up delay-2">
                <p style={{ margin: "0 0 12px", fontWeight: 800, fontSize: "0.82rem", color: "#1D2B53" }}>
                  Buildings
                </p>
                {state.businesses.map((b) => (
                  <div key={b.id} className="row between gap-8" style={{ marginBottom: 10 }}>
                    <div className="row gap-10">
                      <div style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        background: b.level > 0 ? "#EBF5FF" : "#F5FAFF",
                        border: `1.5px solid ${b.level > 0 ? "#5EA9FF" : "#D6E9FF"}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "1.1rem",
                        opacity: b.level === 0 ? 0.5 : 1,
                      }}>
                        {b.icon}
                      </div>
                      <div>
                        <p style={{ margin: 0, fontWeight: 700, fontSize: "0.82rem", color: "#1D2B53" }}>{b.name}</p>
                        <p style={{ margin: "2px 0 0", fontSize: "0.68rem", color: "#6B7A99" }}>{b.benefit}</p>
                      </div>
                    </div>
                    <span className={`fv-badge ${b.level > 0 ? "fv-badge-blue" : "fv-badge-yellow"}`}>
                      {b.level > 0 ? `Lv.${b.level}` : "Locked"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === "Achievements" && (
            <div className="stack gap-12">
              <div className="fv-card animate-fade-up">
                <div className="row between" style={{ marginBottom: 12 }}>
                  <p style={{ margin: 0, fontWeight: 800, fontSize: "0.85rem", color: "#1D2B53" }}>
                    All Achievements
                  </p>
                  <span className="fv-badge fv-badge-blue">
                    {ACHIEVEMENTS.filter((a) => a.unlocked).length}/{ACHIEVEMENTS.length}
                  </span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
                  {ACHIEVEMENTS.map((a, i) => (
                    <div
                      key={a.id}
                      className="animate-fade-up"
                      style={{
                        animationDelay: `${i * 60}ms`,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <div
                        className="fv-achievement"
                        style={{
                          borderColor: a.border,
                          background: a.unlocked ? `${a.color}22` : "#F5FAFF",
                          opacity: a.unlocked ? 1 : 0.4,
                          filter: a.unlocked ? "none" : "grayscale(0.9)",
                        }}
                      >
                        {a.icon}
                      </div>
                      <p style={{ margin: 0, fontSize: "0.6rem", fontWeight: 700, color: a.unlocked ? "#1D2B53" : "#6B7A99", textAlign: "center" }}>
                        {a.label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Level progress */}
              <div className="fv-card animate-fade-up delay-1">
                <div className="row between" style={{ marginBottom: 8 }}>
                  <p style={{ margin: 0, fontWeight: 800, fontSize: "0.85rem", color: "#1D2B53" }}>
                    Level {state.level}
                  </p>
                  <span style={{ fontSize: "0.75rem", color: "#6B7A99", fontWeight: 600 }}>
                    {state.xp} XP
                  </span>
                </div>
                <div className="fv-progress-track" style={{ height: 12, marginBottom: 6 }}>
                  <div
                    className="fv-progress-fill"
                    style={{ width: `${(state.xp % 500) / 5}%` }}
                  />
                </div>
                <p style={{ margin: 0, fontSize: "0.72rem", color: "#6B7A99" }}>
                  {500 - (state.xp % 500)} XP to Level {state.level + 1}
                </p>
              </div>

              {/* Stats summary */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }} className="animate-fade-up delay-2">
                <div className="fv-stat">
                  <div style={{ fontSize: "1.4rem" }}>🪙</div>
                  <div className="fv-stat-value" style={{ color: "#C17D00" }}>{state.gold}</div>
                  <div className="fv-stat-label">Total Gold</div>
                </div>
                <div className="fv-stat">
                  <div style={{ fontSize: "1.4rem" }}>✅</div>
                  <div className="fv-stat-value" style={{ color: "#2E9E43" }}>{doneTasks}</div>
                  <div className="fv-stat-label">Tasks Done</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </FVShell>
  );
}
