"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { FVShell } from "@/components/focusville/FVShell";
import { Mascot } from "@/components/focusville/Mascot";
import { logout } from "@/lib/auth";
import { User, Shield, Bell, LogOut, ChevronRight, RotateCcw } from "lucide-react";

export default function SettingsPage() {
  const router = useRouter();
  const { state, patch, resetDemo, ready } = useStore();
  const [name, setName]               = useState("");
  const [nameEditing, setNameEditing] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  if (!ready) {
    return (
      <FVShell>
        <div className="fv-loading">
          <Mascot size={60} mood="idle" float />
        </div>
      </FVShell>
    );
  }

  function saveName() {
    if (!name.trim()) return;
    patch((s) => ({ ...s, displayName: name.trim() }));
    setNameEditing(false);
    setName("");
  }

  function handleLogout() { logout(); router.replace("/login"); }
  function handleReset()  { resetDemo(); setConfirmReset(false); }

  const MENU_SECTIONS = [
    {
      title: "Profile",
      items: [
        { icon: <User size={16} />, label: "Display Name", value: state.displayName, onPress: () => { setName(state.displayName); setNameEditing(true); } },
        { icon: "⭐", label: "Level", value: `Level ${state.level} · ${state.xp} XP` },
        { icon: "🔥", label: "Streak", value: `${state.streak} days` },
      ],
    },
    {
      title: "Your Stats",
      items: [
        { icon: "🪙", label: "Gold", value: state.gold.toLocaleString() },
        { icon: "⏱", label: "Focus Time", value: `${(state.focusMinutes / 60).toFixed(1)}h` },
        { icon: "✅", label: "Tasks Done", value: `${state.tasks.filter((t) => t.status === "completed").length}` },
        { icon: "🏠", label: "House Level", value: `Level ${state.houseLevel}` },
      ],
    },
  ];

  return (
    <FVShell>
      <div style={{ padding: "0 0 20px" }}>

        {/* Profile header */}
        <div style={{
          background: "linear-gradient(135deg, #5EA9FF, #3D8FE8)",
          padding: "28px 20px 24px",
          textAlign: "center",
        }}>
          <Mascot size={72} mood={state.streak > 7 ? "celebrate" : "happy"} float />
          <h2 style={{ margin: "10px 0 2px", fontWeight: 900, color: "white", fontSize: "1.2rem" }}>
            {state.displayName}
          </h2>
          <p style={{ margin: 0, color: "rgba(255,255,255,0.8)", fontSize: "0.82rem" }}>
            Level {state.level} · 🔥 {state.streak} day streak
          </p>
          <div className="row gap-8 center" style={{ marginTop: 12 }}>
            <div style={{
              background: "rgba(255,255,255,0.2)",
              borderRadius: 999,
              padding: "4px 14px",
              fontSize: "0.78rem",
              fontWeight: 700,
              color: "white",
            }}>
              🪙 {state.gold} Gold
            </div>
            <div style={{
              background: "rgba(255,255,255,0.2)",
              borderRadius: 999,
              padding: "4px 14px",
              fontSize: "0.78rem",
              fontWeight: 700,
              color: "white",
            }}>
              💎 {state.xp} XP
            </div>
          </div>
        </div>

        <div style={{ padding: "16px 20px" }}>

          {/* Name editor */}
          {nameEditing && (
            <div className="fv-card animate-fade-up" style={{ marginBottom: 12 }}>
              <p style={{ margin: "0 0 10px", fontWeight: 800, fontSize: "0.85rem", color: "#1D2B53" }}>
                Change Display Name
              </p>
              <div className="row gap-8">
                <input
                  type="text"
                  className="fv-input"
                  style={{ flex: 1 }}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name…"
                  autoFocus
                  onKeyDown={(e) => e.key === "Enter" && saveName()}
                />
                <button className="fv-btn fv-btn-primary fv-btn-sm" onClick={saveName} disabled={!name.trim()}>
                  Save
                </button>
              </div>
              <button className="fv-btn fv-btn-ghost fv-btn-sm" onClick={() => setNameEditing(false)} style={{ marginTop: 6 }}>
                Cancel
              </button>
            </div>
          )}

          {/* Menu sections */}
          {MENU_SECTIONS.map((section) => (
            <div key={section.title} style={{ marginBottom: 16 }} className="animate-fade-up">
              <p className="fv-label" style={{ margin: "0 0 8px", paddingLeft: 4 }}>{section.title}</p>
              <div className="fv-card" style={{ padding: 0, overflow: "hidden" }}>
                {section.items.map((item, i) => (
                  <div
                    key={item.label}
                    onClick={item.onPress}
                    style={{
                      padding: "14px 16px",
                      borderBottom: i < section.items.length - 1 ? "1px solid #F0F5FF" : "none",
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      cursor: item.onPress ? "pointer" : "default",
                    }}
                  >
                    <div style={{
                      width: 32,
                      height: 32,
                      borderRadius: 10,
                      background: "#EBF5FF",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "1rem",
                      flexShrink: 0,
                    }}>
                      {item.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontWeight: 700, fontSize: "0.85rem", color: "#1D2B53" }}>{item.label}</p>
                    </div>
                    <p style={{ margin: 0, fontSize: "0.82rem", color: "#6B7A99", fontWeight: 600 }}>{item.value}</p>
                    {item.onPress && <ChevronRight size={14} color="#B0BFCC" />}
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Data section */}
          <div style={{ marginBottom: 16 }} className="animate-fade-up delay-1">
            <p className="fv-label" style={{ margin: "0 0 8px", paddingLeft: 4 }}>Data</p>
            <div className="fv-card">
              <p style={{ margin: "0 0 12px", fontSize: "0.82rem", color: "#6B7A99", lineHeight: 1.6 }}>
                All data is stored locally in your browser. No account required, nothing sent to any server.
              </p>
              {!confirmReset ? (
                <button
                  className="fv-btn fv-btn-secondary fv-btn-sm row gap-6"
                  onClick={() => setConfirmReset(true)}
                  style={{ color: "#D94040", borderColor: "#FFCCD5" }}
                >
                  <RotateCcw size={14} />
                  Reset to demo data
                </button>
              ) : (
                <div style={{
                  background: "#FFF5F5",
                  border: "1px solid #FFCCD5",
                  borderRadius: 12,
                  padding: "12px",
                }}>
                  <p style={{ margin: "0 0 10px", fontWeight: 700, fontSize: "0.82rem", color: "#D94040" }}>
                    This will erase all your progress and restore demo data.
                  </p>
                  <div className="row gap-8">
                    <button
                      className="fv-btn fv-btn-sm"
                      style={{ background: "#D94040", color: "white", border: "none" }}
                      onClick={handleReset}
                    >
                      Yes, reset
                    </button>
                    <button className="fv-btn fv-btn-ghost fv-btn-sm" onClick={() => setConfirmReset(false)}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sign out */}
          <button
            className="fv-btn fv-btn-secondary fv-btn-full animate-fade-up delay-2"
            onClick={handleLogout}
            style={{ gap: 8, color: "#D94040", borderColor: "#FFCCD5", marginBottom: 12 }}
          >
            <LogOut size={16} />
            Sign Out
          </button>

          <p style={{ textAlign: "center", fontSize: "0.72rem", color: "#B0BFCC", fontWeight: 600 }}>
            FocusVille · Browser-only · Your data stays private
          </p>
        </div>
      </div>
    </FVShell>
  );
}
