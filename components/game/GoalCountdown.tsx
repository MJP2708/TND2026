"use client";

import type { Goal } from "@/lib/types";

type Urgency = "safe" | "warning" | "critical" | "failed" | "completed";

const COLORS: Record<Urgency, { ring: string; bg: string; border: string; text: string }> = {
  safe:      { ring: "#7EDC8A", bg: "#F0FFF4", border: "#B8EDCA", text: "#2E9E43" },
  warning:   { ring: "#FFD45E", bg: "#FFFDF0", border: "#FFE88A", text: "#9E6E00" },
  critical:  { ring: "#FF7B7B", bg: "#FFF5F5", border: "#FFCCD5", text: "#D94040" },
  failed:    { ring: "#B0BFCC", bg: "#F5FAFF", border: "#D6E9FF", text: "#6B7A99" },
  completed: { ring: "#7EDC8A", bg: "#F0FFF4", border: "#B8EDCA", text: "#2E9E43" },
};

function getUrgency(daysLeft: number, progress: number): Urgency {
  if (progress >= 100) return "completed";
  if (daysLeft < 0)    return "failed";
  if (daysLeft <= 3)   return "critical";
  if (daysLeft <= 7)   return "warning";
  return "safe";
}

function getMotivation(urgency: Urgency, daysLeft: number, progress: number): string {
  if (urgency === "completed") return "🎉 Goal complete! Amazing work!";
  if (urgency === "failed")    return "Goal deadline has passed";
  if (daysLeft === 0)          return "Last chance — focus everything today! 💪";
  if (daysLeft === 1)          return "1 day left — push hard today!";
  if (urgency === "critical")  return `Only ${daysLeft} days left — let's push hard!`;
  if (urgency === "warning")   return `Final stretch — ${daysLeft} days remaining`;
  if (progress >= 80)          return "Almost there! You're crushing it! 🎉";
  if (progress >= 50)          return "You're halfway there — keep going!";
  if (progress >= 25)          return "Good momentum — stay consistent!";
  return `${daysLeft} days to reach your goal`;
}

export function GoalCountdown({
  goal,
  progress,
  onMenu,
}: {
  goal: Goal;
  progress: number;
  onMenu?: () => void;
}) {
  const today    = new Date();
  const deadline = new Date(goal.deadline + "T23:59:59");
  const msLeft   = deadline.getTime() - today.getTime();
  const daysLeft = Math.floor(msLeft / (1000 * 60 * 60 * 24));

  const startDate   = goal.createdAt ? new Date(goal.createdAt) : today;
  const totalDays   = Math.max(1, Math.round((deadline.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
  const urgency     = getUrgency(daysLeft, progress);
  const motivation  = getMotivation(urgency, daysLeft, progress);
  const c           = COLORS[urgency];

  const CIRC        = 2 * Math.PI * 38;
  const ringFill    = progress / 100;

  return (
    <div style={{
      background: c.bg,
      border: `1px solid ${c.border}`,
      borderRadius: 20,
      padding: "14px 16px 12px",
      marginBottom: 14,
    }} className="animate-fade-up">
      <div className="row between" style={{ marginBottom: 10 }}>
        <p style={{ margin: 0, fontSize: "0.68rem", fontWeight: 700, color: "#6B7A99", textTransform: "uppercase", letterSpacing: "0.06em" }}>
          Goal Countdown
        </p>
        {onMenu && (
          <button
            onClick={onMenu}
            style={{ background: "none", border: "none", cursor: "pointer", padding: "0 4px", color: "#6B7A99", fontSize: "1.1rem", lineHeight: 1 }}
            aria-label="Goal options"
          >
            ⋯
          </button>
        )}
      </div>

      <div className="row gap-14" style={{ alignItems: "center" }}>
        {/* Ring */}
        <div style={{ position: "relative", width: 88, height: 88, flexShrink: 0 }}>
          <svg width={88} height={88} style={{ transform: "rotate(-90deg)" }}>
            <circle cx={44} cy={44} r={38} fill="none" stroke={`${c.ring}44`} strokeWidth={9} />
            <circle
              cx={44} cy={44} r={38}
              fill="none"
              stroke={c.ring}
              strokeWidth={9}
              strokeLinecap="round"
              strokeDasharray={CIRC}
              strokeDashoffset={CIRC * (1 - ringFill)}
              style={{ transition: "stroke-dashoffset 800ms ease" }}
            />
          </svg>
          <div style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}>
            {urgency === "failed" ? (
              <span style={{ fontSize: "1.3rem" }}>✗</span>
            ) : urgency === "completed" ? (
              <span style={{ fontSize: "1.3rem" }}>🎉</span>
            ) : (
              <>
                <span style={{ fontSize: "1.2rem", fontWeight: 900, color: "#1D2B53", lineHeight: 1 }}>
                  {daysLeft}
                </span>
                <span style={{ fontSize: "0.5rem", fontWeight: 700, color: "#6B7A99", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  days
                </span>
              </>
            )}
          </div>
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: "0 0 3px", fontWeight: 800, fontSize: "0.88rem", color: "#1D2B53", lineHeight: 1.3 }}>
            {goal.title}
          </p>
          <p style={{ margin: "0 0 8px", fontSize: "0.7rem", color: "#6B7A99" }}>
            📅 {new Date(goal.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            {totalDays > 0 && ` · ${totalDays} day goal`}
          </p>

          <div style={{ height: 7, background: `${c.ring}33`, borderRadius: 999, overflow: "hidden" }}>
            <div style={{
              height: "100%",
              width: `${progress}%`,
              background: c.ring,
              borderRadius: 999,
              transition: "width 600ms ease",
            }} />
          </div>
          <p style={{ margin: "4px 0 0", fontSize: "0.66rem", color: "#6B7A99" }}>
            {progress}% tasks complete
          </p>
        </div>
      </div>

      <div style={{
        marginTop: 10,
        background: `${c.ring}22`,
        borderRadius: 10,
        padding: "7px 12px",
        fontSize: "0.74rem",
        fontWeight: 700,
        color: c.text,
        textAlign: "center",
      }}>
        {motivation}
      </div>
    </div>
  );
}
