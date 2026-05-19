"use client";

import { useState, useEffect } from "react";
import { useStore } from "@/lib/store";
import { FVShell } from "@/components/focusville/FVShell";
import { Mascot } from "@/components/focusville/Mascot";
import { ShoppingBag, Check, X } from "lucide-react";

type ShopTab = "Buildings" | "Decor" | "Upgrades";

const SHOP_ITEMS: Record<ShopTab, {
  id: string;
  name: string;
  icon: string;
  cost: number;
  desc: string;
  color: string;
}[]> = {
  Buildings: [
    { id: "desk",     name: "Study Desk",  icon: "🪑", cost: 450,  desc: "Boosts focus sessions",  color: "#EBF5FF" },
    { id: "shelf",    name: "Bookshelf",   icon: "📚", cost: 350,  desc: "Increases XP per task",   color: "#F0FFF4" },
    { id: "plant",    name: "Plant",       icon: "🌿", cost: 200,  desc: "Calming decor",           color: "#F0FFF4" },
    { id: "lamp",     name: "Lamp",        icon: "💡", cost: 150,  desc: "Night study bonus",       color: "#FFFDF0" },
    { id: "sofa",     name: "Sofa",        icon: "🛋️", cost: 600,  desc: "Rest & recover faster",  color: "#FFF5F5" },
    { id: "board",    name: "Whiteboard",  icon: "📋", cost: 300,  desc: "Plan & strategy tool",   color: "#F5F0FF" },
  ],
  Decor: [
    { id: "trophy",   name: "Trophy",      icon: "🏆", cost: 800,  desc: "Show off your wins",     color: "#FFFDF0" },
    { id: "flag",     name: "Goal Flag",   icon: "🚩", cost: 250,  desc: "Mark your milestones",   color: "#FFF5F5" },
    { id: "stars",    name: "Star Lights", icon: "⭐", cost: 400,  desc: "Beautiful decoration",   color: "#FFFDF0" },
    { id: "fountain", name: "Fountain",    icon: "⛲", cost: 1200, desc: "Rare city feature",      color: "#EBF5FF" },
    { id: "garden",   name: "Garden",      icon: "🌸", cost: 550,  desc: "Peaceful environment",   color: "#FFF0F8" },
    { id: "art",      name: "Mural",       icon: "🎨", cost: 700,  desc: "Creative expression",    color: "#F5F0FF" },
  ],
  Upgrades: [
    { id: "xp2",      name: "XP Booster",    icon: "⚡", cost: 300,  desc: "+25% XP for 1 day",     color: "#F5F0FF" },
    { id: "gold2",    name: "Gold Rush",      icon: "🪙", cost: 200,  desc: "+20% Gold for 2 hrs",   color: "#FFFDF0" },
    { id: "timer",    name: "Focus Power",    icon: "⏰", cost: 500,  desc: "Extra focus minutes",   color: "#EBF5FF" },
    { id: "streak",   name: "Streak Shield",  icon: "🛡️", cost: 750,  desc: "Protect 1 streak day",  color: "#F0FFF4" },
    { id: "hint",     name: "AI Hint",        icon: "🤖", cost: 100,  desc: "AI task suggestion",    color: "#EBF5FF" },
    { id: "rest",     name: "Rest Pass",      icon: "😴", cost: 400,  desc: "Skip 1 day no penalty", color: "#FFF5F5" },
  ],
};

export default function ShopPage() {
  const { state, patch } = useStore();
  const [tab, setTab]               = useState<ShopTab>("Buildings");
  const [justBought, setJustBought] = useState<string | null>(null);
  const [toast, setToast]           = useState<string | null>(null);

  const ownedItems = new Set(state.purchasedItems ?? []);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  function buyItem(itemId: string, cost: number) {
    if (ownedItems.has(itemId)) return;
    if (state.gold < cost) {
      showToast(`Not enough gold! You need ${cost} 🪙 but have ${state.gold} 🪙. Keep focusing!`);
      return;
    }
    patch((s) => ({
      ...s,
      gold: s.gold - cost,
      purchasedItems: [...(s.purchasedItems ?? []), itemId],
    }));
    setJustBought(itemId);
    setTimeout(() => setJustBought(null), 2000);
  }

  const items = SHOP_ITEMS[tab];

  return (
    <FVShell>
      <div style={{ padding: "0 0 20px" }}>

        {/* Toast */}
        {toast && (
          <div style={{
            position: "fixed",
            bottom: 90,
            left: "50%",
            transform: "translateX(-50%)",
            background: "#1D2B53",
            color: "white",
            borderRadius: 14,
            padding: "12px 18px",
            fontSize: "0.82rem",
            fontWeight: 700,
            zIndex: 9999,
            maxWidth: "90vw",
            textAlign: "center",
            boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
            display: "flex",
            alignItems: "center",
            gap: 8,
            animation: "fade-in 0.2s ease",
          }}>
            <span>💰</span>
            <span>{toast}</span>
            <button
              onClick={() => setToast(null)}
              style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.6)", marginLeft: 4, padding: 0 }}
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Header */}
        <div style={{
          background: "linear-gradient(135deg, #EBF5FF, #DDEEFF)",
          padding: "18px 20px 14px",
          borderBottom: "1px solid #D6E9FF",
        }}>
          <div className="row between" style={{ marginBottom: 10 }}>
            <div className="row gap-8">
              <ShoppingBag size={20} color="#5EA9FF" />
              <h1 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 900, color: "#1D2B53" }}>Shop</h1>
            </div>
            <div className="fv-gold"><span>🪙</span><span>{state.gold.toLocaleString()}</span></div>
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
              const owned  = ownedItems.has(item.id);
              const canBuy = state.gold >= item.cost && !owned;
              const buying = justBought === item.id;

              return (
                <div
                  key={item.id}
                  className="fv-shop-card animate-fade-up"
                  style={{
                    animationDelay: `${idx * 40}ms`,
                    background: owned ? "#F0FFF4" : item.color,
                    border: owned ? "1px solid #B8EDCA" : "1px solid #D6E9FF",
                    cursor: owned ? "default" : "pointer",
                    opacity: !canBuy && !owned ? 0.65 : 1,
                  }}
                  onClick={() => buyItem(item.id, item.cost)}
                >
                  <div style={{ fontSize: "1.8rem", lineHeight: 1 }}>{item.icon}</div>
                  <p style={{ margin: "4px 0 2px", fontWeight: 800, fontSize: "0.78rem", color: "#1D2B53", textAlign: "center", lineHeight: 1.2 }}>
                    {item.name}
                  </p>
                  {owned || buying ? (
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 3,
                      background: "#D1FAE5",
                      color: "#059669",
                      borderRadius: 999,
                      padding: "3px 8px",
                      fontSize: "0.65rem",
                      fontWeight: 700,
                    }}>
                      <Check size={10} />
                      Owned
                    </div>
                  ) : (
                    <div className="fv-gold" style={{ fontSize: "0.72rem", padding: "3px 8px" }}>
                      🪙 {item.cost}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Your Gold */}
          <div className="fv-card" style={{ background: "linear-gradient(135deg, #FFF8E7, #FFEFC0)", border: "1px solid #FFE08A" }}>
            <div className="row between">
              <div>
                <p style={{ margin: 0, fontWeight: 800, fontSize: "0.85rem", color: "#1D2B53" }}>Your Gold</p>
                <div className="fv-gold" style={{ marginTop: 4, fontSize: "1.1rem" }}>
                  🪙 {state.gold.toLocaleString()}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <p style={{ margin: 0, fontSize: "0.72rem", color: "#6B7A99" }}>Earn more by</p>
                <p style={{ margin: "2px 0 0", fontSize: "0.72rem", fontWeight: 700, color: "#C17D00" }}>completing tasks →</p>
              </div>
            </div>
          </div>

          {/* Owned items */}
          {ownedItems.size > 0 && (
            <div className="fv-card" style={{ marginTop: 12 }}>
              <p style={{ margin: "0 0 10px", fontWeight: 800, fontSize: "0.82rem", color: "#1D2B53" }}>
                ✨ Owned ({ownedItems.size})
              </p>
              <div className="row gap-8 cluster">
                {[...ownedItems].map((id) => {
                  const item = Object.values(SHOP_ITEMS).flat().find((i) => i.id === id);
                  return item ? (
                    <span key={id} style={{
                      background: "#EBF5FF",
                      borderRadius: 999,
                      padding: "4px 10px",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      color: "#5EA9FF",
                    }}>
                      {item.icon} {item.name}
                    </span>
                  ) : null;
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </FVShell>
  );
}
