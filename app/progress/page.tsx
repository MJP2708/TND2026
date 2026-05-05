"use client";

import { useStore } from "@/lib/store";
import { AppShell } from "@/components/layout/AppShell";
import type { Business } from "@/lib/types";

function upgradeCost(biz: Business) {
  return Math.round(biz.baseCost * Math.pow(1.6, biz.level));
}

function houseCost(level: number) {
  return Math.round(300 * Math.pow(1.8, level));
}

export default function ProgressPage() {
  const { state, patch, ready } = useStore();

  if (!ready) {
    return (
      <AppShell currentRoute="/progress">
        <div className="empty-state" style={{ paddingTop: 80 }}><p>Loading…</p></div>
      </AppShell>
    );
  }

  function upgradeHouse() {
    const cost = houseCost(state.houseLevel);
    if (state.gold < cost) return;
    patch((s) => ({ ...s, gold: s.gold - cost, houseLevel: s.houseLevel + 1 }));
  }

  function upgradeBusiness(biz: Business) {
    const cost = upgradeCost(biz);
    if (state.gold < cost) return;
    patch((s) => ({
      ...s,
      gold: s.gold - cost,
      businesses: s.businesses.map((b) =>
        b.id === biz.id ? { ...b, level: b.level + 1 } : b
      ),
    }));
  }

  const hCost = houseCost(state.houseLevel);
  const canAffordHouse = state.gold >= hCost;

  return (
    <AppShell currentRoute="/progress">
      <div className="page-header">
        <h1 className="page-title">Your city</h1>
        <p className="page-subtitle">Focus time builds this world. Spend Gold to upgrade.</p>
      </div>

      <div className="stack gap-28">
        {/* City skyline */}
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div className="city-skyline" style={{ height: 120 }}>
            <div
              className="building building-home"
              style={{
                height: `${40 + state.houseLevel * 14}px`,
                flex: "0 0 38px",
              }}
            />
            {state.businesses.map((b) => (
              <div
                key={b.id}
                className={`building ${b.level > 0 ? "building-biz" : "building-empty"}`}
                style={{ height: `${28 + b.level * 14}px` }}
                title={b.name}
              />
            ))}
          </div>
          <div className="city-ground" />
          <div
            style={{
              padding: "10px 16px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--color-muted)" }}>
              Your city grows as you focus. Each upgrade is permanent.
            </p>
            <span className="badge badge-amber">💰 {state.gold} Gold</span>
          </div>
        </div>

        {/* Stats row */}
        <div className="stat-grid">
          <div className="stat-card">
            <div className="stat-label">⏱ Focus</div>
            <div className="stat-value">{(state.focusMinutes / 60).toFixed(1)}h</div>
            <div className="stat-detail">total time</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">🔥 Streak</div>
            <div className="stat-value">{state.streak}</div>
            <div className="stat-detail">days</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">⭐ Level</div>
            <div className="stat-value">{state.level}</div>
            <div className="stat-detail">{state.xp} XP</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">💰 Gold</div>
            <div className="stat-value" style={{ color: "var(--color-accent)" }}>{state.gold}</div>
            <div className="stat-detail">available</div>
          </div>
        </div>

        {/* House upgrade */}
        <div>
          <p className="section-label">Home</p>
          <div className="card card-lg">
            <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: "var(--r-lg)",
                  background: "var(--color-primary-soft)",
                  display: "grid",
                  placeItems: "center",
                  fontSize: "1.6rem",
                  flexShrink: 0,
                }}
              >
                🏠
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontWeight: 800, fontSize: "0.95rem" }}>
                  Your House — Level {state.houseLevel}
                </p>
                <p style={{ margin: "3px 0 0", fontSize: "0.82rem", color: "var(--color-muted)", lineHeight: 1.5 }}>
                  Your home base. Upgrade it to unlock new building slots and show your progress.
                </p>
                <div className="row gap-8" style={{ marginTop: 12, alignItems: "center" }}>
                  <button
                    className={`btn ${canAffordHouse ? "btn-primary" : "btn-secondary"}`}
                    onClick={upgradeHouse}
                    disabled={!canAffordHouse}
                  >
                    Upgrade — {hCost} Gold
                  </button>
                  {!canAffordHouse && (
                    <span style={{ fontSize: "0.75rem", color: "var(--color-muted)" }}>
                      Need {hCost - state.gold} more Gold
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Business upgrades */}
        <div>
          <p className="section-label">Businesses</p>
          <div className="stack gap-12">
            {state.businesses.map((biz) => {
              const cost = upgradeCost(biz);
              const canAfford = state.gold >= cost;
              return (
                <div key={biz.id} className="card card-lg">
                  <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                    <div
                      style={{
                        width: 52,
                        height: 52,
                        borderRadius: "var(--r-lg)",
                        background: biz.level > 0 ? "var(--color-primary-soft)" : "var(--color-bg)",
                        border: `1.5px solid ${biz.level > 0 ? "var(--color-primary)" : "var(--color-border)"}`,
                        display: "grid",
                        placeItems: "center",
                        fontSize: "1.6rem",
                        flexShrink: 0,
                        opacity: biz.level === 0 ? 0.5 : 1,
                      }}
                    >
                      {biz.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div className="row gap-8" style={{ alignItems: "center" }}>
                        <p style={{ margin: 0, fontWeight: 800, fontSize: "0.95rem" }}>{biz.name}</p>
                        {biz.level > 0 && (
                          <span className="badge badge-primary">Lv {biz.level}</span>
                        )}
                        {biz.level === 0 && (
                          <span className="badge badge-gray">Locked</span>
                        )}
                      </div>
                      <p style={{ margin: "3px 0 0", fontSize: "0.82rem", color: "var(--color-muted)", lineHeight: 1.5 }}>
                        {biz.description}
                      </p>
                      <p style={{ margin: "4px 0 0", fontSize: "0.78rem", fontWeight: 700, color: "var(--color-primary)" }}>
                        {biz.benefit}
                      </p>

                      <LevelBar level={biz.level} />

                      <div className="row gap-8" style={{ marginTop: 12, alignItems: "center" }}>
                        <button
                          className={`btn ${canAfford ? "btn-primary" : "btn-secondary"}`}
                          onClick={() => upgradeBusiness(biz)}
                          disabled={!canAfford}
                        >
                          {biz.level === 0 ? "Unlock" : "Upgrade"} — {cost} Gold
                        </button>
                        {!canAfford && (
                          <span style={{ fontSize: "0.75rem", color: "var(--color-muted)" }}>
                            Need {cost - state.gold} more
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function LevelBar({ level }: { level: number }) {
  const max = 5;
  return (
    <div className="row gap-4" style={{ marginTop: 8 }}>
      {Array.from({ length: max }).map((_, i) => (
        <div
          key={i}
          style={{
            height: 4,
            flex: 1,
            borderRadius: 2,
            background: i < level ? "var(--color-primary)" : "var(--color-border)",
          }}
        />
      ))}
    </div>
  );
}
