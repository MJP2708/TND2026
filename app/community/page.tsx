"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { FVShell } from "@/components/focusville/FVShell";
import { Mascot } from "@/components/focusville/Mascot";
import { CurrencyDisplay } from "@/components/focusville/CurrencyDisplay";
import { Settings, MapPin, MessageCircle, Rss, Search, Plus, ArrowUp, ArrowLeft, ArrowRight, ArrowDown } from "lucide-react";

type CityTab = "city" | "neighborhood";

/* Isometric building shapes */
const CITY_BUILDINGS = [
  { id: "b1", name: "Study Desk",  icon: "📚", unlocked: true,  x: 20,  y: 45, w: 70, h: 55, color: "#8EC5FF" },
  { id: "b2", name: "Bookshelf",   icon: "📖", unlocked: true,  x: 100, y: 30, w: 80, h: 70, color: "#7EDC8A" },
  { id: "b3", name: "Coffee Shop", icon: "☕", unlocked: true,  x: 195, y: 50, w: 65, h: 50, color: "#FFAD5E" },
  { id: "b4", name: "Tech Studio", icon: "💻", unlocked: false, x: 270, y: 35, w: 75, h: 65, color: "#A78BFA" },
  { id: "b5", name: "Bookstore",   icon: "🏫", unlocked: false, x: 50,  y: 120, w: 80, h: 60, color: "#FFD45E" },
  { id: "b6", name: "Park",        icon: "🌳", unlocked: true,  x: 160, y: 130, w: 60, h: 45, color: "#7EDC8A" },
  { id: "b7", name: "Home",        icon: "🏠", unlocked: true,  x: 250, y: 120, w: 85, h: 70, color: "#5EA9FF" },
];

const HASHTAGS = [
  { text: "#ExamSeason",       x: 30,  y: 25  },
  { text: "#MedSchoolJourney", x: 120, y: 60  },
  { text: "#Burnout",          x: 50,  y: 110 },
  { text: "#NeedMotivation",   x: 160, y: 140 },
  { text: "#StudyStreak",      x: 240, y: 85  },
];

const NEIGHBORS = [
  { id: "n1", emoji: "😊", name: "Anonymous A", streak: 12, level: 6, message: "Two weeks strong! Keep going!" },
  { id: "n2", emoji: "😌", name: "Anonymous B", streak: 5,  level: 3, message: "Slow and steady wins the race." },
  { id: "n3", emoji: "😴", name: "Anonymous C", streak: 3,  level: 2, message: "Hard day but still showed up." },
  { id: "n4", emoji: "🤩", name: "Anonymous D", streak: 20, level: 9, message: "20 days! What are you doing?!" },
];

export default function CommunityPage() {
  const { state } = useStore();
  const [tab, setTab]               = useState<CityTab>("city");
  const [mascotPos, setMascotPos]   = useState({ x: 140, y: 90 });
  const [selected, setSelected]     = useState<string | null>(null);

  function moveMascot(dx: number, dy: number) {
    setMascotPos((p) => ({
      x: Math.max(10, Math.min(330, p.x + dx)),
      y: Math.max(10, Math.min(180, p.y + dy)),
    }));
  }

  return (
    <FVShell>
      <div style={{ padding: "0 0 20px" }}>

        {/* Header */}
        <div style={{
          background: "white",
          padding: "14px 20px 10px",
          borderBottom: "1px solid #D6E9FF",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}>
          <div>
            <div className="row gap-10">
              <div style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #5EA9FF, #3D8FE8)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.75rem",
                fontWeight: 800,
                color: "white",
              }}>
                {state.displayName.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <p style={{ margin: 0, fontWeight: 800, fontSize: "0.85rem", color: "#1D2B53" }}>
                  {state.displayName} · Lv.{state.level}
                </p>
              </div>
            </div>
          </div>
          <div className="row gap-8">
            <div className="fv-gold"><span>🪙</span><span>{state.gold.toLocaleString()}</span></div>
            <div className="fv-xp"><span>💎</span><span>{state.xp.toLocaleString()}</span></div>
            <button style={{ background: "none", border: "none", cursor: "pointer" }}>
              <Settings size={18} color="#6B7A99" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ padding: "12px 20px 0" }}>
          <div className="fv-tabs">
            <button className={`fv-tab ${tab === "city" ? "active" : ""}`} onClick={() => setTab("city")}>
              🏙 My City
            </button>
            <button className={`fv-tab ${tab === "neighborhood" ? "active" : ""}`} onClick={() => setTab("neighborhood")}>
              🤝 Neighborhood
            </button>
          </div>
        </div>

        {tab === "city" ? (
          <div style={{ padding: "16px 20px" }}>
            {/* City canvas */}
            <div style={{
              background: "linear-gradient(180deg, #B8E4FF 0%, #D4EEFF 45%, #C8EBB5 75%, #A8D98A 100%)",
              borderRadius: 20,
              position: "relative",
              height: 240,
              overflow: "hidden",
              marginBottom: 12,
            }}>
              {/* Sky dots / stars */}
              {[{x:10,y:12},{x:60,y:8},{x:130,y:15},{x:200,y:7},{x:280,y:12},{x:330,y:18}].map((p,i)=>(
                <div key={i} style={{position:"absolute",left:p.x,top:p.y,width:3,height:3,borderRadius:"50%",background:"rgba(255,255,255,0.8)"}}/>
              ))}

              {/* Buildings */}
              {CITY_BUILDINGS.map((b) => (
                <div
                  key={b.id}
                  onClick={() => setSelected(selected === b.id ? null : b.id)}
                  style={{
                    position: "absolute",
                    left: b.x,
                    top: b.y,
                    width: b.w,
                    height: b.h,
                    background: b.unlocked ? b.color : "#D6E9FF",
                    borderRadius: "8px 8px 4px 4px",
                    cursor: "pointer",
                    border: selected === b.id ? "2px solid #1D2B53" : "1px solid rgba(255,255,255,0.4)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: b.unlocked ? "2px 4px 12px rgba(0,0,0,0.12)" : "none",
                    opacity: b.unlocked ? 1 : 0.5,
                    transition: "transform 150ms ease",
                    transform: selected === b.id ? "scale(1.06)" : "scale(1)",
                  }}
                >
                  <span style={{ fontSize: b.h > 55 ? "1.4rem" : "1rem" }}>{b.icon}</span>
                  {b.w > 65 && b.h > 50 && (
                    <p style={{ margin: "2px 0 0", fontSize: "0.6rem", fontWeight: 700, color: b.unlocked ? "#1D2B53" : "#6B7A99", textAlign: "center", lineHeight: 1.2 }}>
                      {b.name}
                    </p>
                  )}
                  {!b.unlocked && (
                    <div style={{
                      position: "absolute",
                      top: -8,
                      right: -8,
                      width: 20,
                      height: 20,
                      borderRadius: "50%",
                      background: "#6B7A99",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "0.6rem",
                    }}>🔒</div>
                  )}
                </div>
              ))}

              {/* Trees */}
              {[{x:10,y:185},{x:90,y:190},{x:175,y:190},{x:230,y:185},{x:305,y:188}].map((t,i)=>(
                <div key={i} style={{position:"absolute",left:t.x,top:t.y,fontSize:"1.6rem",lineHeight:1}}>🌳</div>
              ))}

              {/* Ground path */}
              <div style={{
                position: "absolute",
                bottom: 0,
                left: "50%",
                transform: "translateX(-50%)",
                width: 20,
                height: "60%",
                background: "rgba(255,255,255,0.3)",
                borderRadius: 4,
              }} />
              <div style={{
                position: "absolute",
                bottom: "30%",
                left: 0,
                right: 0,
                height: 20,
                background: "rgba(255,255,255,0.3)",
                borderRadius: 4,
              }} />

              {/* Mascot */}
              <div style={{
                position: "absolute",
                left: mascotPos.x,
                top: mascotPos.y,
                transform: "translate(-50%, -100%)",
                animation: "mascot-float 2s ease-in-out infinite",
                zIndex: 10,
                transition: "left 200ms ease, top 200ms ease",
              }}>
                <Mascot size={36} mood="happy" />
              </div>

              {/* Building tooltip */}
              {selected && (() => {
                const b = CITY_BUILDINGS.find((b) => b.id === selected);
                return b ? (
                  <div style={{
                    position: "absolute",
                    bottom: 8,
                    left: "50%",
                    transform: "translateX(-50%)",
                    background: "rgba(29, 43, 83, 0.92)",
                    color: "white",
                    borderRadius: 10,
                    padding: "6px 14px",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    whiteSpace: "nowrap",
                    zIndex: 20,
                  }}>
                    {b.icon} {b.name} {!b.unlocked && "— Locked"}
                  </div>
                ) : null;
              })()}
            </div>

            <p style={{ margin: "0 0 12px", textAlign: "center", fontSize: "0.75rem", color: "#6B7A99", fontWeight: 600 }}>
              Walk around, build, and expand your city!
            </p>

            {/* Controls */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              {/* D-pad */}
              <div style={{ position: "relative", width: 96, height: 96 }}>
                {/* Up */}
                <button
                  onClick={() => moveMascot(0, -20)}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: 32,
                    height: 32,
                    background: "white",
                    border: "1px solid #D6E9FF",
                    borderRadius: 8,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <ArrowUp size={14} color="#5EA9FF" />
                </button>
                {/* Left */}
                <button
                  onClick={() => moveMascot(-20, 0)}
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: 0,
                    transform: "translateY(-50%)",
                    width: 32,
                    height: 32,
                    background: "white",
                    border: "1px solid #D6E9FF",
                    borderRadius: 8,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <ArrowLeft size={14} color="#5EA9FF" />
                </button>
                {/* Center */}
                <div style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  width: 32,
                  height: 32,
                  background: "#EBF5FF",
                  borderRadius: 8,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}>
                  <Mascot size={20} mood="happy" />
                </div>
                {/* Right */}
                <button
                  onClick={() => moveMascot(20, 0)}
                  style={{
                    position: "absolute",
                    top: "50%",
                    right: 0,
                    transform: "translateY(-50%)",
                    width: 32,
                    height: 32,
                    background: "white",
                    border: "1px solid #D6E9FF",
                    borderRadius: 8,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <ArrowRight size={14} color="#5EA9FF" />
                </button>
                {/* Down */}
                <button
                  onClick={() => moveMascot(0, 20)}
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: 32,
                    height: 32,
                    background: "white",
                    border: "1px solid #D6E9FF",
                    borderRadius: 8,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <ArrowDown size={14} color="#5EA9FF" />
                </button>
              </div>

              {/* Build/Edit/Move/Sell */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {[
                  { label: "Edit",  icon: "✏️" },
                  { label: "Move",  icon: "↔️" },
                  { label: "Build", icon: "🏗" },
                  { label: "Sell",  icon: "💰" },
                ].map((action) => (
                  <button
                    key={action.label}
                    style={{
                      background: "white",
                      border: "1px solid #D6E9FF",
                      borderRadius: 12,
                      padding: "6px 10px",
                      cursor: "pointer",
                      fontFamily: "inherit",
                      fontSize: "0.72rem",
                      fontWeight: 700,
                      color: "#6B7A99",
                    }}
                  >
                    {action.icon} {action.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* ── Neighborhood tab ── */
          <div style={{ padding: "16px 20px" }}>
            {/* Map */}
            <div style={{
              background: "linear-gradient(135deg, #C8EBB5, #A8D98A, #B8E4FF)",
              borderRadius: 20,
              position: "relative",
              height: 200,
              overflow: "hidden",
              marginBottom: 12,
            }}>
              {/* Houses on map */}
              {[
                { x: 30,  y: 30,  size: 44, c: "#5EA9FF"  },
                { x: 100, y: 60,  size: 38, c: "#FFD45E"  },
                { x: 200, y: 25,  size: 50, c: "#7EDC8A"  },
                { x: 270, y: 70,  size: 42, c: "#FFAD5E"  },
                { x: 60,  y: 130, size: 36, c: "#A78BFA"  },
                { x: 160, y: 120, size: 48, c: "#5EA9FF"  },
                { x: 290, y: 130, size: 40, c: "#FF7B7B"  },
              ].map((h, i) => (
                <div key={i} style={{
                  position: "absolute",
                  left: h.x,
                  top: h.y,
                  width: h.size,
                  height: h.size,
                  background: h.c,
                  borderRadius: 10,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.4rem",
                  boxShadow: "2px 3px 10px rgba(0,0,0,0.12)",
                  border: "2px solid white",
                }}>
                  🏠
                </div>
              ))}

              {/* Hashtag bubbles */}
              {HASHTAGS.map((h, i) => (
                <div
                  key={i}
                  className="fv-hashtag"
                  style={{ position: "absolute", left: h.x, top: h.y, zIndex: 5 }}
                >
                  {h.text}
                </div>
              ))}

              {/* Roads */}
              <div style={{ position: "absolute", top: "50%", left: 0, right: 0, height: 3, background: "rgba(255,255,255,0.5)", transform: "translateY(-50%)" }} />
              <div style={{ position: "absolute", left: "50%", top: 0, bottom: 0, width: 3, background: "rgba(255,255,255,0.5)", transform: "translateX(-50%)" }} />
            </div>

            <p style={{ margin: "0 0 12px", textAlign: "center", fontSize: "0.75rem", color: "#6B7A99", fontWeight: 600 }}>
              Visit neighbors, send love, and support each other!
            </p>

            {/* Community actions */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 16 }}>
              {[
                { icon: <MapPin size={18} />, label: "Map" },
                { icon: <MessageCircle size={18} />, label: "Chat" },
                { icon: <Rss size={18} />, label: "Feed" },
                { icon: <Search size={18} />, label: "Search" },
              ].map((a) => (
                <button
                  key={a.label}
                  style={{
                    background: "white",
                    border: "1px solid #D6E9FF",
                    borderRadius: 14,
                    padding: "10px 4px",
                    cursor: "pointer",
                    fontFamily: "inherit",
                    color: "#6B7A99",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 4,
                    fontSize: "0.65rem",
                    fontWeight: 700,
                  }}
                >
                  {a.icon}
                  {a.label}
                </button>
              ))}
            </div>

            {/* Neighbors */}
            <div className="stack gap-10">
              {NEIGHBORS.map((n) => (
                <div key={n.id} className="fv-card" style={{ padding: "12px 14px" }}>
                  <div className="row between">
                    <div className="row gap-10">
                      <div style={{
                        width: 40,
                        height: 40,
                        borderRadius: "50%",
                        background: "linear-gradient(135deg, #EBF5FF, #DDEEFF)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "1.3rem",
                        border: "2px solid #D6E9FF",
                      }}>
                        {n.emoji}
                      </div>
                      <div>
                        <p style={{ margin: 0, fontWeight: 700, fontSize: "0.83rem", color: "#1D2B53" }}>{n.name}</p>
                        <p style={{ margin: "2px 0 0", fontSize: "0.68rem", color: "#6B7A99" }}>
                          🔥 {n.streak} streak · Lv.{n.level}
                        </p>
                      </div>
                    </div>
                    <button style={{
                      background: "linear-gradient(135deg, #EBF5FF, #DDEEFF)",
                      border: "1px solid #D6E9FF",
                      borderRadius: 999,
                      padding: "4px 12px",
                      fontSize: "0.72rem",
                      fontWeight: 700,
                      color: "#5EA9FF",
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}>
                      ❤️ Send love
                    </button>
                  </div>
                  <p style={{ margin: "8px 0 0", fontSize: "0.78rem", color: "#6B7A99", fontStyle: "italic" }}>
                    "{n.message}"
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </FVShell>
  );
}
