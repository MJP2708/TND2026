"use client";

import { STREAK_MILESTONES } from "@/lib/game-utils";

interface Props {
  streak: number;
}

export function StreakMilestone({ streak }: Props) {
  const nextMilestone = STREAK_MILESTONES.find((m) => m.days > streak);
  const lastReached = [...STREAK_MILESTONES].reverse().find((m) => m.days <= streak);

  const daysToNext = nextMilestone ? nextMilestone.days - streak : 0;

  return (
    <div className="fv-card" style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <div>
          <p style={{ margin: 0, fontWeight: 800, fontSize: "0.88rem", color: "#1D2B53" }}>
            🔥 {streak}-day streak
          </p>
          {nextMilestone && (
            <p style={{ margin: "2px 0 0", fontSize: "0.7rem", color: "#6B7A99" }}>
              {daysToNext} day{daysToNext !== 1 ? "s" : ""} to {nextMilestone.icon} {nextMilestone.reward}
            </p>
          )}
          {!nextMilestone && (
            <p style={{ margin: "2px 0 0", fontSize: "0.7rem", color: "#7EDC8A", fontWeight: 700 }}>
              🏆 Max streak reached!
            </p>
          )}
        </div>
        {lastReached && (
          <div style={{
            background: "#FFF8E7",
            border: "1.5px solid #FFD45E",
            borderRadius: 10,
            padding: "4px 10px",
            fontSize: "0.68rem",
            fontWeight: 800,
            color: "#B8860B",
          }}>
            {lastReached.icon} {lastReached.reward}
          </div>
        )}
      </div>

      {/* Milestone track */}
      <div style={{ position: "relative", padding: "4px 0" }}>
        {/* Track line */}
        <div style={{
          position: "absolute",
          top: "50%",
          left: 12,
          right: 12,
          height: 3,
          background: "#EBF5FF",
          borderRadius: 999,
          transform: "translateY(-50%)",
          zIndex: 0,
        }} />

        {/* Progress fill */}
        {nextMilestone && (
          <div style={{
            position: "absolute",
            top: "50%",
            left: 12,
            width: `${Math.min(100, (streak / nextMilestone.days) * 100)}%`,
            height: 3,
            background: "linear-gradient(90deg, #FFD45E, #FFAD5E)",
            borderRadius: 999,
            transform: "translateY(-50%)",
            zIndex: 1,
            transition: "width 600ms ease",
          }} />
        )}

        {/* Milestone nodes */}
        <div style={{ display: "flex", justifyContent: "space-between", position: "relative", zIndex: 2 }}>
          {STREAK_MILESTONES.map((m) => {
            const reached = streak >= m.days;
            return (
              <div key={m.days} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                <div
                  title={m.reward}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    background: reached ? "linear-gradient(135deg, #FFD45E, #FFAD5E)" : "white",
                    border: reached ? "2px solid #FFD45E" : "2px solid #D6E9FF",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.75rem",
                    boxShadow: reached ? "0 2px 8px rgba(255,173,94,0.4)" : "none",
                    transition: "all 0.3s",
                  }}
                >
                  {m.icon}
                </div>
                <span style={{ fontSize: "0.55rem", fontWeight: 700, color: reached ? "#FFAD5E" : "#B0C4DE" }}>
                  {m.days}d
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
