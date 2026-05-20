"use client";

import { useState, useEffect, useTransition } from "react";
import { getMyDailyQuests, claimQuestReward } from "@/lib/actions/quests";
import { useStore } from "@/lib/store";

type Quest = {
  key: string;
  title: string;
  description: string;
  icon: string;
  goldReward: number;
  xpReward: number;
  target: number;
  progress: number;
  completed: boolean;
  claimed: boolean;
};

export function QuestPanel() {
  const { patch } = useStore();
  const [quests, setQuests] = useState<Quest[]>([]);
  const [isPending, startTransition] = useTransition();
  const [justClaimed, setJustClaimed] = useState<string | null>(null);

  useEffect(() => {
    getMyDailyQuests().then((q) => setQuests(q as Quest[])).catch(() => {});
  }, []);

  function handleClaim(questKey: string) {
    startTransition(async () => {
      const result = await claimQuestReward(questKey);
      if ("success" in result && result.success) {
        setQuests((prev) => prev.map((q) => q.key === questKey ? { ...q, claimed: true } : q));
        patch((s) => ({ ...s, gold: (result.newGold as number) ?? s.gold, xp: (result.newXp as number) ?? s.xp }));
        setJustClaimed(questKey);
        setTimeout(() => setJustClaimed(null), 2000);
      }
    });
  }

  const completedCount = quests.filter((q) => q.completed).length;
  const claimedCount   = quests.filter((q) => q.claimed).length;
  const allClaimed     = quests.length > 0 && quests.every((q) => q.claimed);

  if (quests.length === 0) return null;

  return (
    <div className="fv-card animate-fade-up" style={{ marginBottom: 14 }}>
      <div className="row between" style={{ marginBottom: 10 }}>
        <div>
          <p style={{ margin: 0, fontWeight: 800, fontSize: "0.85rem", color: "#1D2B53" }}>
            Daily Quests
          </p>
          <p style={{ margin: "2px 0 0", fontSize: "0.68rem", color: "#6B7A99" }}>
            Resets at midnight
          </p>
        </div>
        <div style={{
          background: allClaimed ? "#D1FAE5" : "#EBF5FF",
          borderRadius: 999,
          padding: "3px 10px",
          fontSize: "0.7rem",
          fontWeight: 800,
          color: allClaimed ? "#059669" : "#5EA9FF",
        }}>
          {allClaimed ? "🎉 All done!" : `⭐ ${completedCount}/${quests.length}`}
        </div>
      </div>

      <div className="stack gap-8">
        {quests.map((quest) => {
          const pct = Math.min(100, (quest.progress / quest.target) * 100);
          return (
            <div
              key={quest.key}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "8px 10px",
                borderRadius: 12,
                background: quest.claimed ? "#F0FFF4" : quest.completed ? "#EBF5FF" : "#F5FAFF",
                border: `1px solid ${quest.claimed ? "#B8EDCA" : quest.completed ? "#C4DEFF" : "#E8F0FF"}`,
              }}
            >
              <span style={{ fontSize: "1.2rem", flexShrink: 0 }}>{quest.icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                  margin: 0,
                  fontWeight: 700,
                  fontSize: "0.78rem",
                  color: quest.claimed ? "#059669" : "#1D2B53",
                }}>
                  {quest.title}
                </p>
                <div style={{ height: 4, background: "#E8F0FF", borderRadius: 999, marginTop: 4, overflow: "hidden" }}>
                  <div style={{
                    height: "100%",
                    width: `${pct}%`,
                    background: quest.claimed ? "#7EDC8A" : "#5EA9FF",
                    borderRadius: 999,
                    transition: "width 500ms ease",
                  }} />
                </div>
                <p style={{ margin: "2px 0 0", fontSize: "0.62rem", color: "#6B7A99" }}>
                  {quest.progress}/{quest.target} · 🪙+{quest.goldReward} 💎+{quest.xpReward}
                </p>
              </div>

              {quest.completed && !quest.claimed && (
                <button
                  onClick={() => handleClaim(quest.key)}
                  disabled={isPending}
                  className="fv-btn fv-btn-primary fv-btn-sm"
                  style={{ height: 28, padding: "0 10px", fontSize: "0.7rem", flexShrink: 0, gap: 4 }}
                >
                  {justClaimed === quest.key ? "✓" : "Claim!"}
                </button>
              )}
              {quest.claimed && (
                <span style={{ fontSize: "1.1rem", flexShrink: 0 }}>✅</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
