"use client";

import { useState, useTransition, useEffect } from "react";
import { useStore } from "@/lib/store";

import { FVShell } from "@/components/focusville/FVShell";
import { Gift, Plus, Trash2, CheckCircle2, Lock } from "lucide-react";
import {
  getUserRewards,
  createCustomReward,
  claimCustomReward,
  deleteCustomReward,
} from "@/lib/actions/rewards";
import { fvToast } from "@/lib/toast";
import confetti from "canvas-confetti";

type Reward = {
  id: string;
  title: string;
  description: string | null;
  coinsRequired: number;
  icon: string;
  claimedAt: Date | null;
  unlockedAt: Date | null;
  createdAt: Date;
};

const ICON_OPTIONS = ["🎬", "🛍", "🍕", "🎮", "☕", "✈️", "🎵", "📚", "🏋️", "😴", "🎁", "🍦"];

export default function RewardsPage() {
  const { state, patch } = useStore();
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [form, setForm] = useState({
    title: "",
    description: "",
    coinsRequired: 200,
    icon: "🎁",
  });

  useEffect(() => {
    getUserRewards().then((d) => {
      setRewards(d.rewards as Reward[]);
    });
  }, []);

  function handleCreate() {
    if (!form.title.trim()) return;
    startTransition(async () => {
      const result = await createCustomReward({
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        coinsRequired: form.coinsRequired,
        icon: form.icon,
      });
      if (result.success) {
        fvToast.success("Reward added!");
        setShowAdd(false);
        setForm({ title: "", description: "", coinsRequired: 200, icon: "🎁" });
        const refreshed = await getUserRewards();
        setRewards(refreshed.rewards as Reward[]);
      } else {
        fvToast.error(result.error ?? "Failed to add reward");
      }
    });
  }

  function handleClaim(reward: Reward) {
    if (reward.claimedAt || state.gold < reward.coinsRequired) return;
    startTransition(async () => {
      const result = await claimCustomReward(reward.id);
      if (result.success) {
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
        fvToast.success(`🎉 Claimed: ${reward.title}!`);
        patch((s) => ({ ...s, gold: s.gold - reward.coinsRequired }));
        setRewards((prev) =>
          prev.map((r) =>
            r.id === reward.id ? { ...r, claimedAt: new Date(), unlockedAt: new Date() } : r
          )
        );
      } else {
        fvToast.error(result.error === "insufficient_coins" ? "Not enough 🪙" : result.error ?? "Failed");
      }
    });
  }

  function handleDelete(rewardId: string) {
    startTransition(async () => {
      await deleteCustomReward(rewardId);
      setRewards((prev) => prev.filter((r) => r.id !== rewardId));
    });
  }

  const unclaimed = rewards.filter((r) => !r.claimedAt);
  const claimed   = rewards.filter((r) => r.claimedAt);

  return (
    <FVShell>
      <div style={{ padding: "0 0 20px" }}>
        {/* Header */}
        <div style={{
          background: "linear-gradient(135deg, #FFF8E7, #FFEAB5)",
          padding: "18px 20px 14px",
          borderBottom: "1px solid #FFD980",
        }}>
          <div className="row between">
            <div className="row gap-8">
              <Gift size={20} color="#C17D00" />
              <h1 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 900, color: "#1D2B53" }}>My Rewards</h1>
            </div>
            <div className="fv-gold">
              <span>🪙</span>
              <span>{state.gold.toLocaleString()}</span>
            </div>
          </div>
          <p style={{ margin: "6px 0 0", fontSize: "0.78rem", color: "#6B7A99" }}>
            Set real-world rewards and unlock them with your coins
          </p>
        </div>

        <div style={{ padding: "16px 20px" }}>
          {/* Add reward button */}
          <button
            className="fv-btn fv-btn-primary fv-btn-full"
            style={{ marginBottom: 16, gap: 8 }}
            onClick={() => setShowAdd((v) => !v)}
          >
            <Plus size={16} />
            {showAdd ? "Cancel" : "Add a Reward"}
          </button>

          {/* Add reward form */}
          {showAdd && (
            <div className="fv-card animate-fade-up" style={{ marginBottom: 16, border: "1px solid #FFD980" }}>
              <p style={{ margin: "0 0 12px", fontWeight: 800, fontSize: "0.85rem", color: "#1D2B53" }}>New Reward</p>

              {/* Icon picker */}
              <div style={{ marginBottom: 10 }}>
                <p style={{ margin: "0 0 6px", fontSize: "0.75rem", fontWeight: 700, color: "#6B7A99" }}>Icon</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {ICON_OPTIONS.map((ic) => (
                    <button
                      key={ic}
                      onClick={() => setForm((f) => ({ ...f, icon: ic }))}
                      style={{
                        fontSize: "1.4rem",
                        width: 38,
                        height: 38,
                        borderRadius: 10,
                        border: form.icon === ic ? "2px solid #5EA9FF" : "1px solid #D6E9FF",
                        background: form.icon === ic ? "#EBF5FF" : "white",
                        cursor: "pointer",
                      }}
                    >
                      {ic}
                    </button>
                  ))}
                </div>
              </div>

              <div className="stack gap-8">
                <input
                  className="fv-input"
                  placeholder="Reward title (e.g. Watch 2 hrs Netflix)"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                />
                <input
                  className="fv-input"
                  placeholder="Description (optional)"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                />
                <div>
                  <p style={{ margin: "0 0 4px", fontSize: "0.75rem", fontWeight: 700, color: "#6B7A99" }}>
                    Coins required: 🪙 {form.coinsRequired}
                  </p>
                  <input
                    type="range"
                    min={50}
                    max={2000}
                    step={50}
                    value={form.coinsRequired}
                    onChange={(e) => setForm((f) => ({ ...f, coinsRequired: Number(e.target.value) }))}
                    style={{ width: "100%", accentColor: "#5EA9FF" }}
                  />
                  <div className="row between" style={{ marginTop: 2 }}>
                    <span style={{ fontSize: "0.68rem", color: "#6B7A99" }}>50</span>
                    <span style={{ fontSize: "0.68rem", color: "#6B7A99" }}>2,000</span>
                  </div>
                </div>
                <button
                  className="fv-btn fv-btn-primary fv-btn-full"
                  disabled={!form.title.trim() || isPending}
                  onClick={handleCreate}
                >
                  {isPending ? "Saving…" : "Save Reward"}
                </button>
              </div>
            </div>
          )}

          {/* Unclaimed rewards */}
          {unclaimed.length === 0 && !showAdd && (
            <div style={{ textAlign: "center", padding: "32px 0" }}>
              <div style={{ fontSize: "3rem", marginBottom: 10 }}>🎁</div>
              <p style={{ margin: 0, fontWeight: 700, color: "#1D2B53", fontSize: "0.95rem" }}>No rewards yet</p>
              <p style={{ margin: "4px 0 0", color: "#6B7A99", fontSize: "0.8rem" }}>
                Add a real-world reward and earn it with coins
              </p>
            </div>
          )}

          <div className="stack gap-10">
            {unclaimed.map((reward) => {
              const pct = Math.min(100, Math.round((state.gold / reward.coinsRequired) * 100));
              const canClaim = state.gold >= reward.coinsRequired;

              return (
                <div
                  key={reward.id}
                  className="fv-card"
                  style={{ border: canClaim ? "1px solid #7EDC8A" : "1px solid #D6E9FF" }}
                >
                  <div className="row between" style={{ marginBottom: 8 }}>
                    <div className="row gap-10">
                      <span style={{ fontSize: "1.6rem" }}>{reward.icon}</span>
                      <div>
                        <p style={{ margin: 0, fontWeight: 800, fontSize: "0.88rem", color: "#1D2B53" }}>
                          {reward.title}
                        </p>
                        {reward.description && (
                          <p style={{ margin: "2px 0 0", fontSize: "0.72rem", color: "#6B7A99" }}>
                            {reward.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(reward.id)}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "#D94040", padding: 4 }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  {/* Progress bar */}
                  <div style={{ background: "#EBF5FF", borderRadius: 999, height: 8, marginBottom: 8, overflow: "hidden" }}>
                    <div
                      style={{
                        height: "100%",
                        width: `${pct}%`,
                        background: canClaim ? "#7EDC8A" : "#5EA9FF",
                        borderRadius: 999,
                        transition: "width 0.5s ease",
                      }}
                    />
                  </div>

                  <div className="row between">
                    <span style={{ fontSize: "0.72rem", color: "#6B7A99", fontWeight: 600 }}>
                      🪙 {state.gold.toLocaleString()} / {reward.coinsRequired.toLocaleString()}
                    </span>
                    <button
                      className="fv-btn fv-btn-sm"
                      disabled={!canClaim || isPending}
                      onClick={() => handleClaim(reward)}
                      style={{
                        background: canClaim ? "#7EDC8A" : "#E8F4FF",
                        color: canClaim ? "white" : "#6B7A99",
                        border: "none",
                        gap: 4,
                      }}
                    >
                      {canClaim ? (
                        <><CheckCircle2 size={12} /> Claim</>
                      ) : (
                        <><Lock size={12} /> Locked</>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Claimed rewards */}
          {claimed.length > 0 && (
            <div style={{ marginTop: 24 }}>
              <p style={{ margin: "0 0 10px", fontWeight: 800, fontSize: "0.78rem", color: "#6B7A99" }}>
                CLAIMED ({claimed.length})
              </p>
              <div className="stack gap-8">
                {claimed.map((reward) => (
                  <div
                    key={reward.id}
                    className="fv-card"
                    style={{ background: "#F0FFF4", border: "1px solid #B8EDCA", opacity: 0.8 }}
                  >
                    <div className="row gap-10">
                      <span style={{ fontSize: "1.4rem" }}>{reward.icon}</span>
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: 0, fontWeight: 700, fontSize: "0.85rem", color: "#1D2B53", textDecoration: "line-through" }}>
                          {reward.title}
                        </p>
                        <p style={{ margin: "2px 0 0", fontSize: "0.68rem", color: "#059669", fontWeight: 700 }}>
                          ✅ Claimed · 🪙 {reward.coinsRequired.toLocaleString()} spent
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </FVShell>
  );
}
