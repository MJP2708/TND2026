"use client";

import { useState, useTransition } from "react";
import { placeBuilding, moveBuilding, sellBuilding, upgradeBuilding, rotatBuilding } from "@/lib/actions/city";
import { RotateCcw, Move, Trash2, TrendingUp, X, Plus } from "lucide-react";
import type { DistrictType } from "@/lib/types";

type BuildingData = {
  id: string;
  itemId: string;
  name: string;
  icon: string;
  x: number;
  y: number;
  rotation: number;
  level: number;
  district: string;
  tier: number;
  health: string;
  maintenanceDue: string;
  citizens: number;
};

type Props = {
  buildings: BuildingData[];
  onUpdate: () => void;
  gold: number;
  energy?: number;
  districtMastery: Record<string, boolean>;
};

const DISTRICTS: { key: DistrictType; label: string; icon: string; bonus: string; color: string }[] = [
  { key: "residential", label: "Residential",  icon: "🏘", bonus: "+Gold/day from citizens",    color: "#FFD45E" },
  { key: "industrial",  label: "Industrial",   icon: "🏭", bonus: "+Energy/day from production", color: "#FFAD5E" },
  { key: "green",       label: "Green Zone",   icon: "🌳", bonus: "+Happiness/day",              color: "#7EDC8A" },
  { key: "knowledge",   label: "Knowledge",    icon: "🎓", bonus: "+XP multiplier on tasks",     color: "#A78BFA" },
];

const SLOTS_PER_ROW = 3;
const SLOTS_PER_COL = 2;
const CELL = 64;

function healthStyle(health: string): React.CSSProperties {
  switch (health) {
    case "due_soon":     return { outline: "2px solid #FFD45E", animation: "pulse-yellow 2s ease-in-out infinite" };
    case "deteriorating":return { filter: "brightness(0.6) saturate(0.4)", outline: "2px solid #FFAD5E" };
    case "collapsed":    return { filter: "grayscale(1) brightness(0.5)" };
    default:             return {};
  }
}

type Mode = "view" | "place" | "move";

export function DistrictGrid({ buildings, onUpdate, districtMastery }: Props) {
  const [selected, setSelected] = useState<BuildingData | null>(null);
  const [toPlace, setToPlace] = useState<BuildingData | null>(null);
  const [mode, setMode] = useState<Mode>("view");
  const [toast, setToast] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const inventory = buildings.filter((b) => b.x < 0);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  function getBuildingAt(district: DistrictType, x: number, y: number) {
    return buildings.find((b) => b.district === district && b.x === x && b.y === y && b.x >= 0);
  }

  function handleCellClick(district: DistrictType, x: number, y: number) {
    const occupant = getBuildingAt(district, x, y);

    if (mode === "place" && toPlace) {
      if (occupant) { showToast("Slot already occupied!"); return; }
      startTransition(async () => {
        try {
          const result = await placeBuilding({ buildingId: toPlace.id, x, y, district });
          if ("error" in result && result.error) { showToast(result.error); return; }
          setToPlace(null);
          setMode("view");
          onUpdate();
        } catch { showToast("Failed — please try again"); }
      });
      return;
    }

    if (mode === "move" && selected) {
      if (occupant && occupant.id !== selected.id) { showToast("Slot already occupied!"); return; }
      if (occupant?.id === selected.id) return;
      startTransition(async () => {
        try {
          const result = await moveBuilding({ buildingId: selected.id, x, y, district });
          if ("error" in result && result.error) { showToast(result.error); return; }
          setSelected(null);
          setMode("view");
          onUpdate();
        } catch { showToast("Failed — please try again"); }
      });
      return;
    }

    if (occupant) {
      setSelected(occupant);
      setMode("view");
    } else {
      setSelected(null);
    }
  }

  function handleInventorySelect(b: BuildingData) {
    setToPlace(b);
    setMode("place");
    setSelected(null);
  }

  function handleCancel() {
    setMode("view");
    setToPlace(null);
    setSelected(null);
  }

  function handleStartMove() {
    if (!selected) return;
    setMode("move");
    setToPlace(null);
  }

  function handleSell() {
    if (!selected) return;
    startTransition(async () => {
      try {
        const result = await sellBuilding(selected.id);
        if ("error" in result && result.error) { showToast(result.error); return; }
        showToast(`Sold! +${"refund" in result ? result.refund : 0}🪙 refunded`);
        setSelected(null);
        setMode("view");
        onUpdate();
      } catch { showToast("Failed — please try again"); }
    });
  }

  function handleUpgrade() {
    if (!selected) return;
    startTransition(async () => {
      try {
        const result = await upgradeBuilding(selected.id);
        if ("error" in result && result.error) { showToast(result.error ?? "Failed"); return; }
        showToast(`Upgraded to Level ${selected.level + 1}! 🎉`);
        setSelected({ ...selected, level: selected.level + 1 });
        onUpdate();
      } catch { showToast("Failed — please try again"); }
    });
  }

  function handleRotate() {
    if (!selected) return;
    startTransition(async () => {
      try {
        const result = await rotatBuilding(selected.id);
        if ("error" in result && result.error) { showToast(result.error); return; }
        setSelected({ ...selected, rotation: "rotation" in result ? (result.rotation ?? 0) : 0 });
        onUpdate();
      } catch { showToast("Failed — please try again"); }
    });
  }

  return (
    <div style={{ padding: "0 0 20px" }}>
      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", bottom: 90, left: "50%", transform: "translateX(-50%)",
          background: "#1D2B53", color: "white", borderRadius: 14, padding: "10px 18px",
          fontSize: "0.82rem", fontWeight: 700, zIndex: 9999, boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
          maxWidth: "90vw", textAlign: "center",
        }}>
          {toast}
        </div>
      )}

      {/* Mode indicator */}
      {mode !== "view" && (
        <div style={{
          background: mode === "place" ? "#EBF5FF" : "#FFF8E7",
          border: `1px solid ${mode === "place" ? "#5EA9FF" : "#FFD45E"}`,
          borderRadius: 12, padding: "8px 14px", margin: "0 16px 12px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <p style={{ margin: 0, fontSize: "0.82rem", fontWeight: 700, color: "#1D2B53" }}>
            {mode === "place"
              ? `Placing ${toPlace?.icon} ${toPlace?.name} — tap a district slot`
              : `Moving ${selected?.icon} ${selected?.name} — tap destination`}
          </p>
          <button onClick={handleCancel} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
            <X size={16} color="#6B7A99" />
          </button>
        </div>
      )}

      {/* District zones */}
      <div style={{ padding: "0 12px" }}>
        {DISTRICTS.map((d) => {
          const mastered = districtMastery[d.key];
          const inDistrict = buildings.filter((b) => b.x >= 0 && b.district === d.key);
          const isTargetMode = mode !== "view";

          return (
            <div key={d.key} style={{ marginBottom: 12 }}>
              {/* District header */}
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 6,
                padding: "4px 0",
              }}>
                <span style={{ fontSize: "1rem" }}>{d.icon}</span>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontWeight: 800, fontSize: "0.8rem", color: "#1D2B53" }}>
                    {d.label}
                    {mastered && (
                      <span style={{
                        marginLeft: 6,
                        background: d.color,
                        color: "white",
                        borderRadius: 6,
                        padding: "1px 6px",
                        fontSize: "0.6rem",
                        fontWeight: 900,
                        animation: "glow-pulse 2s ease-in-out infinite",
                      }}>
                        ✦ Mastered
                      </span>
                    )}
                  </p>
                  <p style={{ margin: 0, fontSize: "0.62rem", color: "#6B7A99" }}>{d.bonus}</p>
                </div>
                <span style={{ fontSize: "0.62rem", color: "#6B7A99" }}>
                  {inDistrict.length}/6
                </span>
              </div>

              {/* 3×2 slot grid */}
              <div style={{
                display: "grid",
                gridTemplateColumns: `repeat(${SLOTS_PER_ROW}, ${CELL}px)`,
                gridTemplateRows: `repeat(${SLOTS_PER_COL}, ${CELL}px)`,
                gap: 4,
                background: `${d.color}22`,
                borderRadius: 14,
                padding: 8,
                border: mastered ? `2px solid ${d.color}` : `1px dashed ${d.color}88`,
                transition: "border-color 0.3s",
                overflowX: "auto",
              }}>
                {Array.from({ length: SLOTS_PER_COL }).map((_, row) =>
                  Array.from({ length: SLOTS_PER_ROW }).map((_, col) => {
                    const building = getBuildingAt(d.key, col, row);
                    const isSelected = selected?.id === building?.id;
                    const isEmpty = !building;
                    const isTarget = isTargetMode && isEmpty;

                    return (
                      <div
                        key={`${col}-${row}`}
                        onClick={() => handleCellClick(d.key, col, row)}
                        style={{
                          width: CELL,
                          height: CELL,
                          borderRadius: 10,
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          background: isSelected
                            ? "rgba(94,169,255,0.3)"
                            : building
                            ? "rgba(255,255,255,0.85)"
                            : "rgba(255,255,255,0.3)",
                          border: isSelected
                            ? "2px solid #5EA9FF"
                            : isTarget
                            ? "2px dashed #7EDC8A"
                            : "1.5px dashed rgba(255,255,255,0.6)",
                          transition: "all 0.15s",
                          userSelect: "none",
                          position: "relative",
                          ...(building ? healthStyle(building.health) : {}),
                        }}
                      >
                        {building ? (
                          <>
                            {/* Collapsed rubble */}
                            {building.health === "collapsed" ? (
                              <div style={{ textAlign: "center" }}>
                                <span style={{ fontSize: "1.2rem" }}>🪨</span>
                                <p style={{ margin: "2px 0 0", fontSize: "0.5rem", fontWeight: 800, color: "#FF7B7B" }}>
                                  Collapsed
                                </p>
                              </div>
                            ) : (
                              <>
                                <span style={{
                                  fontSize: "1.5rem",
                                  transform: `rotate(${building.rotation}deg)`,
                                  transition: "transform 0.3s",
                                  lineHeight: 1,
                                }}>
                                  {building.icon}
                                </span>
                                {building.level > 1 && (
                                  <span style={{ fontSize: "0.45rem", fontWeight: 800, color: "#5EA9FF", background: "white", borderRadius: 3, padding: "0 3px", marginTop: 1 }}>
                                    Lv{building.level}
                                  </span>
                                )}
                                {building.citizens > 0 && (
                                  <span style={{ position: "absolute", top: 2, right: 3, fontSize: "0.5rem", color: "#7EDC8A", fontWeight: 700 }}>
                                    {building.citizens}👤
                                  </span>
                                )}
                                {building.health === "due_soon" && (
                                  <span style={{ position: "absolute", bottom: 2, right: 3, fontSize: "0.55rem" }}>🔔</span>
                                )}
                                {building.health === "deteriorating" && (
                                  <span style={{ position: "absolute", bottom: 2, right: 3, fontSize: "0.55rem" }}>⚠️</span>
                                )}
                              </>
                            )}
                          </>
                        ) : isTarget ? (
                          <Plus size={18} color="rgba(126,220,138,0.7)" />
                        ) : null}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected building detail panel */}
      {selected && mode === "view" && (
        <div className="fv-card" style={{ margin: "0 12px 12px" }}>
          <div className="row between" style={{ marginBottom: 10 }}>
            <div className="row gap-8">
              <span style={{ fontSize: "1.5rem" }}>{selected.icon}</span>
              <div>
                <p style={{ margin: 0, fontWeight: 800, fontSize: "0.9rem", color: "#1D2B53" }}>{selected.name}</p>
                <p style={{ margin: "1px 0 0", fontSize: "0.68rem", color: "#6B7A99" }}>
                  Lv{selected.level} · Tier {selected.tier} ·{" "}
                  {DISTRICTS.find((d) => d.key === selected.district)?.label}
                  {selected.citizens > 0 && ` · ${selected.citizens} 👤`}
                </p>
                <p style={{ margin: "1px 0 0", fontSize: "0.68rem", color: "#6B7A99" }}>
                  Maintenance:{" "}
                  <span style={{
                    fontWeight: 700,
                    color: selected.health === "collapsed" ? "#FF7B7B"
                      : selected.health === "deteriorating" ? "#FFAD5E"
                      : selected.health === "due_soon" ? "#FFD45E"
                      : "#7EDC8A",
                  }}>
                    {selected.health === "collapsed" ? "Collapsed — rebuild needed"
                      : selected.health === "deteriorating" ? "Deteriorating!"
                      : selected.health === "due_soon" ? "Due soon 🔔"
                      : `Due ${new Date(selected.maintenanceDue).toLocaleDateString()}`}
                  </span>
                </p>
              </div>
            </div>
            <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", cursor: "pointer" }}>
              <X size={16} color="#6B7A99" />
            </button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
            {[
              { icon: <Move size={14} />, label: "Move",    action: handleStartMove },
              { icon: <RotateCcw size={14} />, label: "Rotate", action: handleRotate },
              { icon: <TrendingUp size={14} />, label: "Upgrade", action: handleUpgrade },
              { icon: <Trash2 size={14} />, label: "Sell",    action: handleSell, danger: true },
            ].map((btn) => (
              <button
                key={btn.label}
                className={`fv-btn ${btn.danger ? "" : "fv-btn-secondary"} fv-btn-sm`}
                onClick={btn.action}
                disabled={isPending}
                style={{
                  flexDirection: "column", height: 52, gap: 4, fontSize: "0.68rem",
                  ...(btn.danger ? { background: "#FFF5F5", color: "#D94040", border: "1.5px solid #FFCCD5" } : {}),
                }}
              >
                {btn.icon}
                {btn.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Inventory */}
      <div style={{ padding: "0 12px" }}>
        <p style={{ margin: "0 0 8px", fontWeight: 800, fontSize: "0.78rem", color: "#1D2B53" }}>
          Inventory ({inventory.length} ready to place)
        </p>
        {inventory.length === 0 ? (
          <p style={{ margin: 0, fontSize: "0.78rem", color: "#6B7A99", textAlign: "center", padding: "12px 0" }}>
            No items in inventory. Buy from the Shop! 🛍
          </p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
            {inventory.map((b) => (
              <button
                key={b.id}
                onClick={() => handleInventorySelect(b)}
                style={{
                  background: toPlace?.id === b.id ? "#EBF5FF" : "white",
                  border: `1.5px solid ${toPlace?.id === b.id ? "#5EA9FF" : "#D6E9FF"}`,
                  borderRadius: 12, padding: "8px 4px", cursor: "pointer",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
                  fontFamily: "inherit", transition: "all 0.15s",
                }}
              >
                <span style={{ fontSize: "1.3rem" }}>{b.icon}</span>
                <span style={{ fontSize: "0.55rem", fontWeight: 700, color: "#1D2B53", textAlign: "center", lineHeight: 1.2 }}>
                  {b.name}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
