"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { AppShell } from "@/components/layout/AppShell";
import type { Reward } from "@/lib/types";

function makeCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

export default function RewardsPage() {
  const { state, patch, ready } = useStore();
  const [title, setTitle] = useState("");
  const [cost, setCost] = useState(200);
  const [note, setNote] = useState("");
  const [redeemed, setRedeemed] = useState<string | null>(null);

  if (!ready) {
    return (
      <AppShell currentRoute="/rewards">
        <div className="empty-state" style={{ paddingTop: 80 }}><p>Loading…</p></div>
      </AppShell>
    );
  }

  function addReward() {
    if (!title.trim()) return;
    const r: Reward = {
      id: `r-${Date.now()}`,
      title: title.trim(),
      cost,
      note: note.trim(),
    };
    patch((s) => ({ ...s, rewards: [...s.rewards, r] }));
    setTitle("");
    setCost(200);
    setNote("");
  }

  function removeReward(id: string) {
    patch((s) => ({ ...s, rewards: s.rewards.filter((r) => r.id !== id) }));
  }

  function redeemReward(reward: Reward) {
    if (state.gold < reward.cost) return;
    const code = makeCode();
    patch((s) => ({
      ...s,
      gold: s.gold - reward.cost,
      vouchers: [
        ...s.vouchers,
        {
          id: `v-${Date.now()}`,
          rewardTitle: reward.title,
          code,
          used: false,
          createdAt: new Date().toISOString(),
        },
      ],
    }));
    setRedeemed(code);
  }

  function markUsed(voucherId: string) {
    patch((s) => ({
      ...s,
      vouchers: s.vouchers.map((v) =>
        v.id === voucherId ? { ...v, used: true } : v
      ),
    }));
  }

  return (
    <AppShell currentRoute="/rewards">
      <div className="page-header">
        <h1 className="page-title">Rewards 🎁</h1>
        <p className="page-subtitle">
          Spend your Gold on treats you actually care about. You&apos;ve earned them.
        </p>
      </div>

      <div className="stack gap-28">
        {/* Gold balance */}
        <div
          className="card"
          style={{
            background: "linear-gradient(135deg, #1A4540 0%, #2D6A61 100%)",
            color: "white",
            border: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <div>
            <p style={{ margin: 0, fontSize: "0.7rem", fontWeight: 800, opacity: 0.7, textTransform: "uppercase", letterSpacing: ".07em" }}>
              Your gold stash
            </p>
            <p style={{ margin: "4px 0 0", fontSize: "2rem", fontWeight: 900 }}>
              💰 {state.gold}
            </p>
          </div>
          <p style={{ margin: 0, fontSize: "0.82rem", opacity: 0.7, maxWidth: 160, textAlign: "right", lineHeight: 1.5 }}>
            Earned through focus sessions &amp; mood check-ins.
          </p>
        </div>

        {/* Redeem confirmation */}
        {redeemed && (
          <div
            className="card"
            style={{ background: "var(--color-accent-soft)", borderColor: "var(--color-accent)", textAlign: "center" }}
          >
            <div className="stack gap-8" style={{ alignItems: "center" }}>
              <span style={{ fontSize: "1.8rem" }}>🎉</span>
              <p style={{ margin: 0, fontWeight: 800 }}>Voucher redeemed!</p>
              <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--color-muted)" }}>
                Your voucher code:
              </p>
              <div
                style={{
                  fontFamily: "monospace",
                  fontSize: "1.4rem",
                  fontWeight: 900,
                  letterSpacing: ".15em",
                  color: "var(--color-accent)",
                }}
              >
                {redeemed}
              </div>
              <button className="btn btn-secondary" onClick={() => setRedeemed(null)} style={{ marginTop: 4 }}>
                Done
              </button>
            </div>
          </div>
        )}

        {/* Available rewards */}
        <div>
          <p className="section-label">Your treats</p>
          {state.rewards.length === 0 ? (
            <div className="empty-state" style={{ padding: "24px 0" }}>
              <p>No rewards yet — add something you&apos;ll look forward to 🎁</p>
            </div>
          ) : (
            <div className="stack gap-10">
              {state.rewards.map((r) => {
                const canAfford = state.gold >= r.cost;
                return (
                  <div key={r.id} className="card">
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: 0, fontWeight: 800, fontSize: "0.9rem" }}>{r.title}</p>
                        {r.note && (
                          <p style={{ margin: "2px 0 0", fontSize: "0.78rem", color: "var(--color-muted)" }}>
                            {r.note}
                          </p>
                        )}
                        <span className="badge badge-amber" style={{ marginTop: 6 }}>
                          {r.cost} Gold
                        </span>
                      </div>
                      <div className="row gap-6">
                        <button
                          className={`btn ${canAfford ? "btn-accent" : "btn-secondary"}`}
                          style={{ fontSize: "0.8rem", padding: "6px 12px" }}
                          disabled={!canAfford}
                          onClick={() => redeemReward(r)}
                        >
                          Redeem
                        </button>
                        <button
                          className="btn btn-ghost"
                          style={{ fontSize: "0.8rem", padding: "6px 10px", color: "var(--color-muted)" }}
                          onClick={() => removeReward(r.id)}
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Create reward */}
        <div>
          <p className="section-label">Add a new treat for yourself</p>
          <div className="card">
            <div className="stack gap-14">
              <div className="form-group">
                <label className="form-label" htmlFor="r-title">Reward name</label>
                <input
                  id="r-title"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Movie night, favourite snack…"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label" htmlFor="r-cost">Gold cost</label>
                  <select
                    id="r-cost"
                    className="form-select"
                    value={cost}
                    onChange={(e) => setCost(Number(e.target.value))}
                  >
                    {[100, 200, 300, 500, 750, 1000, 1500, 2000].map((v) => (
                      <option key={v} value={v}>{v} Gold</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="r-note">Note (optional)</label>
                  <input
                    id="r-note"
                    type="text"
                    className="form-input"
                    placeholder="Remind yourself why…"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                </div>
              </div>
              <button
                className="btn btn-primary"
                disabled={!title.trim()}
                onClick={addReward}
              >
                🎁 Add to my treats
              </button>
            </div>
          </div>
        </div>

        {/* Vouchers */}
        {state.vouchers.length > 0 && (
          <div>
            <p className="section-label">My vouchers</p>
            <div className="stack gap-10">
              {state.vouchers.map((v) => (
                <div
                  key={v.id}
                  className="voucher-card"
                  style={{ opacity: v.used ? 0.5 : 1 }}
                >
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontWeight: 800, fontSize: "0.9rem" }}>{v.rewardTitle}</p>
                    <p
                      style={{
                        margin: "4px 0 0",
                        fontFamily: "monospace",
                        fontWeight: 900,
                        fontSize: "1.1rem",
                        letterSpacing: ".12em",
                        color: v.used ? "var(--color-muted)" : "var(--color-accent)",
                      }}
                    >
                      {v.code}
                    </p>
                    <p style={{ margin: "2px 0 0", fontSize: "0.72rem", color: "var(--color-muted)" }}>
                      {new Date(v.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  {!v.used ? (
                    <button
                      className="btn btn-secondary"
                      style={{ fontSize: "0.78rem" }}
                      onClick={() => markUsed(v.id)}
                    >
                      Mark used
                    </button>
                  ) : (
                    <span className="badge badge-gray">Used</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
