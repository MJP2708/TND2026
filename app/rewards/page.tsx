"use client";

import { useState, useTransition, useOptimistic } from "react";
import { useStore } from "@/lib/store";
import { FVShell } from "@/components/focusville/FVShell";
import { ShoppingBag, Check, Loader2 } from "lucide-react";
import { buyItem as buyItemAction } from "@/lib/actions/shop";
import { fvToast } from "@/lib/toast";
import type { EraType } from "@/lib/types";

type ShopTab = "Buildings" | "Decor" | "Upgrades";

const ERA_ORDER: EraType[] = ["pioneer", "modern", "metropolis"];
const ERA_LABELS: Record<EraType, string> = {
  pioneer: "🪨 Pioneer",
  modern: "🏙 Modern",
  metropolis: "🌆 Metropolis",
};

const SHOP_ITEMS: Record<ShopTab, {
  id: string;
  name: string;
  icon: string;
  goldCost: number;
  energyCost: number;
  desc: string;
  color: string;
  era: EraType;
  district: string;
}[]> = {
  Buildings: [
    { id: "cottage",   name: "Cottage",     icon: "🏠", goldCost: 60,  energyCost: 80,  desc: "Residential — generates Gold/hr",        color: "#FFF8E7", era: "pioneer",    district: "residential" },
    { id: "farm",      name: "Farm",        icon: "🌾", goldCost: 50,  energyCost: 100, desc: "Industrial — generates Energy/hr",        color: "#F0FFF4", era: "pioneer",    district: "industrial" },
    { id: "market",    name: "Market",      icon: "🏪", goldCost: 80,  energyCost: 120, desc: "Knowledge — boosts XP from tasks",        color: "#EBF5FF", era: "pioneer",    district: "knowledge" },
    { id: "campfire",  name: "Campfire",    icon: "🔥", goldCost: 40,  energyCost: 50,  desc: "Green Zone — boosts Happiness",           color: "#F0FFF4", era: "pioneer",    district: "green" },
    { id: "park",      name: "Park",        icon: "🌳", goldCost: 55,  energyCost: 70,  desc: "Green Zone — boosts Happiness",           color: "#F0FFF4", era: "pioneer",    district: "green" },
    { id: "office",    name: "Office",      icon: "🏢", goldCost: 150, energyCost: 200, desc: "Industrial — +6 Energy/hr",               color: "#EBF5FF", era: "modern",     district: "industrial" },
    { id: "cafe",      name: "Café",        icon: "☕", goldCost: 130, energyCost: 160, desc: "Residential — +10 Gold/hr",               color: "#FFF8E7", era: "modern",     district: "residential" },
    { id: "apartment", name: "Apartment",   icon: "🏘", goldCost: 160, energyCost: 220, desc: "Residential — +10 Gold/hr",               color: "#FFF0F8", era: "modern",     district: "residential" },
    { id: "library",   name: "Library",     icon: "📚", goldCost: 150, energyCost: 200, desc: "Knowledge — +XP bonus on tasks",          color: "#F5F0FF", era: "modern",     district: "knowledge" },
    { id: "gym",       name: "Gym",         icon: "💪", goldCost: 120, energyCost: 180, desc: "Green Zone — boosts Happiness",           color: "#F0FFF4", era: "modern",     district: "green" },
    { id: "techlab",   name: "Tech Lab",    icon: "🔬", goldCost: 300, energyCost: 400, desc: "Knowledge — major XP bonus",              color: "#EBF5FF", era: "metropolis", district: "knowledge" },
    { id: "skygarden", name: "Sky Garden",  icon: "🌿", goldCost: 250, energyCost: 350, desc: "Green Zone — +5 Happiness/day",           color: "#F0FFF4", era: "metropolis", district: "green" },
    { id: "aicenter",  name: "AI Center",   icon: "🤖", goldCost: 400, energyCost: 500, desc: "Knowledge — ultimate XP bonus",           color: "#F5F0FF", era: "metropolis", district: "knowledge" },
    { id: "skyscraper",name: "Skyscraper",  icon: "🏙", goldCost: 500, energyCost: 600, desc: "Industrial — +9 Energy/hr",              color: "#EBF5FF", era: "metropolis", district: "industrial" },
  ],
  Decor: [
    { id: "fountain",  name: "Fountain",    icon: "⛲", goldCost: 180, energyCost: 120, desc: "Green — rare landmark, +Happiness",       color: "#EBF5FF", era: "pioneer", district: "green" },
    { id: "garden",    name: "Garden",      icon: "🌸", goldCost: 70,  energyCost: 90,  desc: "Green — +Happiness",                      color: "#FFF0F8", era: "pioneer", district: "green" },
    { id: "trophy",    name: "Trophy",      icon: "🏆", goldCost: 200, energyCost: 0,   desc: "Decor — show off your wins",              color: "#FFF8E7", era: "pioneer", district: "residential" },
    { id: "flag",      name: "Goal Flag",   icon: "🚩", goldCost: 60,  energyCost: 0,   desc: "Decor — mark your milestones",            color: "#FFF5F5", era: "pioneer", district: "residential" },
    { id: "stars",     name: "Star Lights", icon: "⭐", goldCost: 100, energyCost: 0,   desc: "Decor — beautiful decoration",            color: "#FFF8E7", era: "pioneer", district: "green" },
    { id: "art",       name: "Mural",       icon: "🎨", goldCost: 200, energyCost: 0,   desc: "Decor — creative expression",             color: "#F5F0FF", era: "pioneer", district: "residential" },
  ],
  Upgrades: [
    { id: "xp2",    name: "XP Booster",    icon: "⚡", goldCost: 300, energyCost: 0, desc: "+25% XP for 1 day",      color: "#F5F0FF", era: "pioneer", district: "residential" },
    { id: "gold2",  name: "Gold Rush",     icon: "🪙", goldCost: 200, energyCost: 0, desc: "+20% Gold for 2 hrs",    color: "#FFF8E7", era: "pioneer", district: "residential" },
    { id: "timer",  name: "Focus Power",   icon: "⏰", goldCost: 500, energyCost: 0, desc: "Extra focus minutes",    color: "#EBF5FF", era: "pioneer", district: "residential" },
    { id: "streak", name: "Streak Shield", icon: "🛡️", goldCost: 750, energyCost: 0, desc: "Protect 1 streak day",  color: "#F0FFF4", era: "pioneer", district: "residential" },
    { id: "hint",   name: "AI Hint",       icon: "🤖", goldCost: 100, energyCost: 0, desc: "AI task suggestion",    color: "#EBF5FF", era: "pioneer", district: "residential" },
    { id: "rest",   name: "Rest Pass",     icon: "😴", goldCost: 400, energyCost: 0, desc: "Skip 1 day no penalty", color: "#FFF5F5", era: "pioneer", district: "residential" },
  ],
};

export default function ShopPage() {
  const { state, patch } = useStore();
  const [tab, setTab] = useState<ShopTab>("Buildings");
  const [isPending, startTransition] = useTransition();
  const [buyingId, setBuyingId] = useState<string | null>(null);

  // Optimistic owned items — updates immediately on click
  const [optimisticOwned, addOptimisticOwned] = useOptimistic(
    new Set(state.purchasedItems ?? []),
    (current: Set<string>, newId: string) => new Set([...current, newId])
  );

  const currentEra = state.currentEra;

  function buyItem(itemId: string, goldCost: number, energyCost: number, itemName: string) {
    if (optimisticOwned.has(itemId) || isPending) return;

    if (state.gold < goldCost) {
      fvToast.error(`Need ${goldCost} 🪙 but you have ${state.gold} 🪙`);
      return;
    }
    if (state.energy < energyCost) {
      fvToast.error(`Need ${energyCost} ⚡ but you have ${state.energy} ⚡`);
      return;
    }

    setBuyingId(itemId);
    addOptimisticOwned(itemId);

    // Optimistic client state update — feels instant
    patch((s) => ({
      ...s,
      gold: s.gold - goldCost,
      energy: s.energy - energyCost,
      purchasedItems: [...(s.purchasedItems ?? []), itemId],
    }));

    startTransition(async () => {
      try {
        const result = await buyItemAction(itemId);
        if ("error" in result && result.error) {
          // Rollback optimistic update
          patch((s) => ({
            ...s,
            gold: s.gold + goldCost,
            energy: s.energy + energyCost,
            purchasedItems: (s.purchasedItems ?? []).filter((id) => id !== itemId),
          }));
          fvToast.error(result.error);
        } else {
          fvToast.purchase(itemName);
        }
      } catch {
        patch((s) => ({
          ...s,
          gold: s.gold + goldCost,
          energy: s.energy + energyCost,
          purchasedItems: (s.purchasedItems ?? []).filter((id) => id !== itemId),
        }));
        fvToast.error("Purchase failed — please try again");
      } finally {
        setBuyingId(null);
      }
    });
  }

  const items = SHOP_ITEMS[tab];
  const userEraIdx = ERA_ORDER.indexOf(currentEra);

  return (
    <FVShell>
      <div style={{ padding: "0 0 20px" }}>
        {/* Header */}
        <div style={{
          background: "linear-gradient(135deg, #EBF5FF, #DDEEFF)",
          padding: "18px 20px 14px",
          borderBottom: "1px solid #D6E9FF",
        }}>
          <div className="row between" style={{ marginBottom: 8 }}>
            <div className="row gap-8">
              <ShoppingBag size={20} color="#5EA9FF" />
              <h1 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 900, color: "#1D2B53" }}>Shop</h1>
            </div>
            {/* Dual-currency HUD */}
            <div style={{ display: "flex", gap: 8 }}>
              <div className="fv-gold"><span>⚡</span><span>{state.energy.toLocaleString()}</span></div>
              <div className="fv-gold"><span>🪙</span><span>{state.gold.toLocaleString()}</span></div>
            </div>
          </div>

          <div className="fv-scroll-tabs">
            {(["Buildings", "Decor", "Upgrades"] as ShopTab[]).map((t) => (
              <button
                key={t}
                className={`fv-scroll-tab ${tab === t ? "active" : ""}`}
                onClick={() => setTab(t)}
              >
                {t === "Buildings" ? "🏗 Buildings" : t === "Decor" ? "🎨 Decor" : "⚡ Upgrades"}
              </button>
            ))}
          </div>
        </div>

        <div style={{ padding: "16px 20px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 16 }}>
            {items.map((item, idx) => {
              const owned       = optimisticOwned.has(item.id);
              const itemEraIdx  = ERA_ORDER.indexOf(item.era);
              const isLocked    = itemEraIdx > userEraIdx;
              const canAfford   = state.gold >= item.goldCost && state.energy >= item.energyCost;
              const isLoading   = buyingId === item.id;

              return (
                <div
                  key={item.id}
                  className="fv-shop-card animate-fade-up"
                  style={{
                    animationDelay: `${idx * 40}ms`,
                    background: owned ? "#F0FFF4" : isLocked ? "#F5F5F5" : item.color,
                    border: owned ? "1px solid #B8EDCA" : isLocked ? "1px solid #E0E0E0" : "1px solid #D6E9FF",
                    cursor: owned || isLocked ? "default" : "pointer",
                    opacity: (!canAfford && !owned && !isLocked) ? 0.65 : isLocked ? 0.5 : 1,
                    position: "relative",
                  }}
                  onClick={() => !owned && !isLocked && !isPending && buyItem(item.id, item.goldCost, item.energyCost, item.name)}
                >
                  <div style={{ fontSize: "1.8rem", lineHeight: 1 }}>{item.icon}</div>
                  <p style={{ margin: "4px 0 2px", fontWeight: 800, fontSize: "0.75rem", color: isLocked ? "#9E9E9E" : "#1D2B53", textAlign: "center", lineHeight: 1.2 }}>
                    {item.name}
                  </p>

                  {isLocked ? (
                    <div style={{ fontSize: "0.6rem", color: "#9E9E9E", textAlign: "center", fontWeight: 600 }}>
                      {ERA_LABELS[item.era]}
                    </div>
                  ) : owned ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 3, background: "#D1FAE5", color: "#059669", borderRadius: 999, padding: "3px 8px", fontSize: "0.65rem", fontWeight: 700 }}>
                      <Check size={10} /> Owned
                    </div>
                  ) : isLoading ? (
                    <Loader2 size={14} color="#5EA9FF" style={{ animation: "spin 1s linear infinite" }} />
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                      {item.energyCost > 0 && (
                        <span style={{ fontSize: "0.6rem", fontWeight: 700, color: "#5EA9FF" }}>
                          ⚡ {item.energyCost}
                        </span>
                      )}
                      <span style={{ fontSize: "0.6rem", fontWeight: 700, color: "#C17D00" }}>
                        🪙 {item.goldCost}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Balance card */}
          <div className="fv-card" style={{ background: "linear-gradient(135deg, #F0F8FF, #E8F4FF)", border: "1px solid #C4DEFF", marginBottom: 12 }}>
            <div className="row between">
              <div>
                <p style={{ margin: 0, fontWeight: 800, fontSize: "0.85rem", color: "#1D2B53" }}>Your Balance</p>
                <div style={{ display: "flex", gap: 12, marginTop: 4 }}>
                  <span style={{ fontWeight: 700, fontSize: "0.88rem", color: "#5EA9FF" }}>⚡ {state.energy.toLocaleString()}</span>
                  <span style={{ fontWeight: 700, fontSize: "0.88rem", color: "#C17D00" }}>🪙 {state.gold.toLocaleString()}</span>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <p style={{ margin: 0, fontSize: "0.7rem", color: "#6B7A99" }}>Earn ⚡ via focus sessions</p>
                <p style={{ margin: "2px 0 0", fontSize: "0.7rem", color: "#6B7A99" }}>Earn 🪙 by completing tasks</p>
              </div>
            </div>
          </div>

          {/* Era info */}
          <div className="fv-card" style={{ background: "#EBF5FF", border: "1px solid #C4DEFF" }}>
            <p style={{ margin: 0, fontSize: "0.78rem", fontWeight: 700, color: "#1D2B53" }}>
              {ERA_LABELS[currentEra]} era
            </p>
            <p style={{ margin: "4px 0 0", fontSize: "0.72rem", color: "#6B7A99" }}>
              {currentEra === "pioneer" && "Build 10 buildings to unlock Modern City era"}
              {currentEra === "modern" && "Build 25 buildings + 30-day streak to unlock Metropolis"}
              {currentEra === "metropolis" && "You've reached the pinnacle! Consider Prestige for bonuses."}
            </p>
          </div>
        </div>
      </div>
    </FVShell>
  );
}
