"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { AppShell } from "@/components/layout/AppShell";
import { logout } from "@/lib/auth";

export default function SettingsPage() {
  const router = useRouter();
  const { state, patch, resetDemo, ready } = useStore();
  const [name, setName] = useState("");
  const [nameEditing, setNameEditing] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  if (!ready) {
    return (
      <AppShell currentRoute="/settings">
        <div className="empty-state" style={{ paddingTop: 80 }}><p>Loading…</p></div>
      </AppShell>
    );
  }

  function saveName() {
    if (!name.trim()) return;
    patch((s) => ({ ...s, displayName: name.trim() }));
    setNameEditing(false);
    setName("");
  }

  function handleLogout() {
    logout();
    router.replace("/login");
  }

  function handleReset() {
    resetDemo();
    setConfirmReset(false);
  }

  const doneTasks = state.tasks.filter((t) => t.status === "completed").length;
  const totalTasks = state.tasks.filter((t) => !t.isRecovery).length;

  return (
    <AppShell currentRoute="/settings">
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Manage your workspace and account.</p>
      </div>

      <div className="stack gap-28" style={{ maxWidth: 540 }}>
        {/* Profile */}
        <div>
          <p className="section-label">Profile</p>
          <div className="card">
            <div className="stack gap-14">
              <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: "50%",
                    background: "var(--color-primary)",
                    display: "grid",
                    placeItems: "center",
                    color: "white",
                    fontWeight: 900,
                    fontSize: "1.3rem",
                    flexShrink: 0,
                  }}
                >
                  {state.displayName[0]?.toUpperCase() ?? "U"}
                </div>
                <div>
                  <p style={{ margin: 0, fontWeight: 800, fontSize: "1rem" }}>{state.displayName}</p>
                  <p style={{ margin: "2px 0 0", fontSize: "0.78rem", color: "var(--color-muted)" }}>
                    Level {state.level} · {state.xp} XP · 🔥 {state.streak} day streak
                  </p>
                </div>
              </div>

              {!nameEditing ? (
                <button
                  className="btn btn-secondary"
                  style={{ alignSelf: "flex-start" }}
                  onClick={() => { setName(state.displayName); setNameEditing(true); }}
                >
                  Change display name
                </button>
              ) : (
                <div className="row gap-8">
                  <input
                    type="text"
                    className="form-input"
                    style={{ flex: 1 }}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="New name…"
                    autoFocus
                    onKeyDown={(e) => e.key === "Enter" && saveName()}
                  />
                  <button className="btn btn-primary" onClick={saveName} disabled={!name.trim()}>
                    Save
                  </button>
                  <button className="btn btn-ghost" onClick={() => setNameEditing(false)}>
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats snapshot */}
        <div>
          <p className="section-label">Your stats</p>
          <div className="stat-grid">
            <div className="stat-card">
              <div className="stat-label">💰 Gold</div>
              <div className="stat-value" style={{ color: "var(--color-accent)" }}>{state.gold}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">⏱ Focus</div>
              <div className="stat-value">{(state.focusMinutes / 60).toFixed(1)}h</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">✅ Done</div>
              <div className="stat-value">{doneTasks}/{totalTasks}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">🏙 House</div>
              <div className="stat-value">Lv {state.houseLevel}</div>
            </div>
          </div>
        </div>

        {/* Data */}
        <div>
          <p className="section-label">Data</p>
          <div className="card">
            <div className="stack gap-14">
              <div>
                <p style={{ margin: "0 0 4px", fontWeight: 700, fontSize: "0.875rem" }}>
                  All data is local
                </p>
                <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--color-muted)", lineHeight: 1.55 }}>
                  Your plan, focus history, and city are stored in this browser only. No account required, no data sent to any server.
                </p>
              </div>

              {!confirmReset ? (
                <button
                  className="btn btn-secondary"
                  style={{ alignSelf: "flex-start", color: "var(--color-danger)" }}
                  onClick={() => setConfirmReset(true)}
                >
                  Reset to demo data
                </button>
              ) : (
                <div className="card" style={{ background: "#FEF2F2", borderColor: "#FCA5A5" }}>
                  <div className="stack gap-10">
                    <p style={{ margin: 0, fontWeight: 700, fontSize: "0.875rem", color: "#991B1B" }}>
                      This will erase all your progress and restore the demo state.
                    </p>
                    <div className="row gap-8">
                      <button
                        className="btn btn-danger"
                        onClick={handleReset}
                      >
                        Yes, reset everything
                      </button>
                      <button className="btn btn-ghost" onClick={() => setConfirmReset(false)}>
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Account */}
        <div>
          <p className="section-label">Account</p>
          <div className="card">
            <div className="stack gap-10">
              <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--color-muted)", lineHeight: 1.55 }}>
                Signed in as demo@tycoon.app
              </p>
              <button
                className="btn btn-secondary"
                style={{ alignSelf: "flex-start" }}
                onClick={handleLogout}
              >
                Sign out
              </button>
            </div>
          </div>
        </div>

        {/* About */}
        <div>
          <p className="section-label">About</p>
          <div className="card" style={{ borderStyle: "dashed" }}>
            <div className="stack gap-6">
              <div className="row gap-10">
                <div className="brand-mark" style={{ width: 32, height: 32, borderRadius: 8, fontSize: "0.75rem" }}>TF</div>
                <strong style={{ fontWeight: 900 }}>Tycoon Focus</strong>
              </div>
              <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--color-muted)", lineHeight: 1.6 }}>
                Turn one goal into today&apos;s plan. Focus, earn Gold, grow your city.
                Browser-only demo — all your data stays private.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
