"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { AppShell } from "@/components/layout/AppShell";

const NEIGHBORS = [
  { id: "n1", name: "A", streak: 12, level: 6, tasksDone: 34, mood: "🌟", message: "Two weeks straight. Keep going!" },
  { id: "n2", name: "B", streak: 5,  level: 3, tasksDone: 18, mood: "💚", message: "Slow and steady wins the race." },
  { id: "n3", name: "C", streak: 3,  level: 2, tasksDone: 9,  mood: "🌙", message: "Hard day but showed up anyway." },
  { id: "n4", name: "D", streak: 21, level: 9, tasksDone: 71, mood: "🚀", message: "Best month yet. The system works." },
  { id: "n5", name: "E", streak: 1,  level: 1, tasksDone: 3,  mood: "🌱", message: "Day one. Excited to start." },
  { id: "n6", name: "F", streak: 8,  level: 4, tasksDone: 22, mood: "⚡", message: "Switched to morning focus — game changer." },
];

export default function CommunityPage() {
  const { state, ready } = useStore();
  const [encouraged, setEncouraged] = useState<Set<string>>(new Set());
  const [feed, setFeed] = useState<{ id: string; text: string }[]>([]);

  if (!ready) {
    return (
      <AppShell currentRoute="/community">
        <div className="empty-state" style={{ paddingTop: 80 }}><p>Loading…</p></div>
      </AppShell>
    );
  }

  function encourage(neighborId: string, name: string) {
    if (encouraged.has(neighborId)) return;
    setEncouraged((prev) => new Set([...prev, neighborId]));
    setFeed((prev) => [
      {
        id: `${neighborId}-${Date.now()}`,
        text: `You sent encouragement to neighbor ${name} 👋`,
      },
      ...prev,
    ]);
  }

  const doneTasks = state.tasks.filter((t) => t.status === "completed").length;

  return (
    <AppShell currentRoute="/community">
      <div className="page-header">
        <h1 className="page-title">Community</h1>
        <p className="page-subtitle">Anonymous neighbours on the same journey. Cheer each other on.</p>
      </div>

      <div className="stack gap-28">
        {/* Your card */}
        <div
          className="card card-lg"
          style={{
            background: "linear-gradient(135deg, #1A4540 0%, #2D6A61 100%)",
            color: "white",
            border: "none",
          }}
        >
          <div className="row gap-12" style={{ alignItems: "center" }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                background: "rgba(255,255,255,.15)",
                display: "grid",
                placeItems: "center",
                fontSize: "1.4rem",
                flexShrink: 0,
              }}
            >
              🏠
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontWeight: 900, fontSize: "1rem" }}>Your neighbourhood card</p>
              <p style={{ margin: "3px 0 0", opacity: 0.75, fontSize: "0.82rem" }}>
                Streak: {state.streak} days · Level {state.level} · {doneTasks} tasks done
              </p>
            </div>
          </div>
        </div>

        {/* Feed */}
        {feed.length > 0 && (
          <div className="card" style={{ background: "var(--color-primary-soft)", borderColor: "rgba(45,106,97,.2)" }}>
            <div className="stack gap-6">
              {feed.map((f) => (
                <p key={f.id} style={{ margin: 0, fontSize: "0.82rem", color: "var(--color-primary)", fontWeight: 600 }}>
                  ✓ {f.text}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Neighbours */}
        <div>
          <p className="section-label">Neighbours studying right now</p>
          <div className="stack gap-10">
            {NEIGHBORS.map((n) => {
              const sent = encouraged.has(n.id);
              return (
                <div key={n.id} className="card">
                  <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: "50%",
                        background: "var(--color-primary-soft)",
                        border: "1.5px solid var(--color-primary)",
                        display: "grid",
                        placeItems: "center",
                        fontSize: "1.1rem",
                        flexShrink: 0,
                        fontWeight: 900,
                        color: "var(--color-primary)",
                      }}
                    >
                      {n.mood}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div className="row gap-8" style={{ alignItems: "center", flexWrap: "wrap" }}>
                        <span className="badge badge-gray">Lv {n.level}</span>
                        <span className="badge badge-primary">🔥 {n.streak} days</span>
                        <span className="badge badge-gray">{n.tasksDone} tasks</span>
                      </div>
                      <p style={{ margin: "6px 0 0", fontSize: "0.82rem", color: "var(--color-text)", lineHeight: 1.5, fontStyle: "italic" }}>
                        &ldquo;{n.message}&rdquo;
                      </p>
                    </div>
                    <button
                      className={`btn ${sent ? "btn-secondary" : "btn-ghost"}`}
                      style={{ fontSize: "0.78rem", padding: "5px 12px", flexShrink: 0 }}
                      disabled={sent}
                      onClick={() => encourage(n.id, n.name)}
                    >
                      {sent ? "✓ Sent" : "👋 Cheer"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Info */}
        <div className="card" style={{ borderStyle: "dashed", background: "transparent" }}>
          <div className="stack gap-8">
            <p style={{ margin: 0, fontWeight: 700, fontSize: "0.875rem" }}>🔒 Anonymous by design</p>
            <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--color-muted)", lineHeight: 1.6 }}>
              No names, no profiles, no comparison pressure — just people showing up for their goals, same as you.
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
