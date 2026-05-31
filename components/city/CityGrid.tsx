"use client";

import { useState, useTransition } from "react";
import { placeBuilding, moveBuilding, sellBuilding, upgradeBuilding, rotatBuilding } from "@/lib/actions/city";
import type { DistrictType } from "@/lib/types";
import { RotateCcw, Move, Trash2, TrendingUp, X, Plus } from "lucide-react";

type PlacedBuilding = {
  id: string;
  itemId: string;
  name: string;
  icon: string;
  x: number;
  y: number;
  rotation: number;
  level: number;
};

type Props = {
  buildings: PlacedBuilding[];
  onUpdate: () => void;
  gold: number;
};

const GRID_COLS = 10;
const GRID_ROWS = 8;

type Mode = "view" | "place" | "move";

export function CityGrid({ buildings, onUpdate, gold }: Props) {
  const [selected, setSelected] = useState<PlacedBuilding | null>(null);
  const [toPlace, setToPlace] = useState<PlacedBuilding | null>(null);
  const [mode, setMode] = useState<Mode>("view");
  const [toast, setToast] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const CELL_SIZE = 52;
  const inventory = buildings.filter((b) => b.x < 0);
  const placed = buildings.filter((b) => b.x >= 0);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  function getCell(x: number, y: number) {
    return placed.find((b) => b.x === x && b.y === y);
  }

  function handleCellClick(x: number, y: number) {
    const occupant = getCell(x, y);

    if (mode === "place" && toPlace) {
      if (occupant) { showToast("Tile is already occupied!"); return; }
      startTransition(async () => {
        const result = await placeBuilding({ buildingId: toPlace.id, x, y, district: "residential" as DistrictType });
        if (result.error) { showToast(result.error); return; }
        setToPlace(null);
        setMode("view");
        onUpdate();
      });
      return;
    }

    if (mode === "move" && selected) {
      if (occupant && occupant.id !== selected.id) { showToast("Tile is already occupied!"); return; }
      if (occupant?.id === selected.id) return;
      startTransition(async () => {
        const result = await moveBuilding({ buildingId: selected.id, x, y, district: "residential" as DistrictType });
        if (result.error) { showToast(result.error); return; }
        setSelected(null);
        setMode("view");
        onUpdate();
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

  function handleInventorySelect(b: PlacedBuilding) {
    setToPlace(b);
    setMode("place");
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
      const result = await sellBuilding(selected.id);
      if (result.error) { showToast(result.error); return; }
      showToast(`Sold! +${result.refund}🪙 refunded`);
      setSelected(null);
      setMode("view");
      onUpdate();
    });
  }

  function handleUpgrade() {
    if (!selected) return;
    startTransition(async () => {
      const result = await upgradeBuilding(selected.id);
      if ("error" in result) { showToast(result.error ?? "Failed"); return; }
      showToast(`Upgraded to Level ${selected.level + 1}! 🎉`);
      setSelected({ ...selected, level: selected.level + 1 });
      onUpdate();
    });
  }

  function handleRotate() {
    if (!selected) return;
    startTransition(async () => {
      const result = await rotatBuilding(selected.id);
      if (result.error) { showToast(result.error); return; }
      setSelected({ ...selected, rotation: result.rotation ?? 0 });
      onUpdate();
    });
  }

  function handleCancel() {
    setMode("view");
    setToPlace(null);
    setSelected(null);
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
          borderRadius: 12, padding: "8px 14px", margin: "0 16px 10px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#1D2B53" }}>
            {mode === "place" ? `Placing: ${toPlace?.icon} ${toPlace?.name} — tap a tile` : `Moving: ${selected?.icon} ${selected?.name} — tap destination`}
          </div>
          <button onClick={handleCancel} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
            <X size={16} color="#6B7A99" />
          </button>
        </div>
      )}

      {/* City grid */}
      <div style={{ overflowX: "auto", padding: "0 12px", marginBottom: 12 }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: `repeat(${GRID_COLS}, ${CELL_SIZE}px)`,
          gridTemplateRows: `repeat(${GRID_ROWS}, ${CELL_SIZE}px)`,
          gap: 3,
          width: "fit-content",
          margin: "0 auto",
          background: "linear-gradient(180deg, #B8E4FF 0%, #D4EEFF 45%, #C8EBB5 75%, #A8D98A 100%)",
          borderRadius: 16,
          padding: 10,
        }}>
          {Array.from({ length: GRID_ROWS }).map((_, row) =>
            Array.from({ length: GRID_COLS }).map((_, col) => {
              const building = getCell(col, row);
              const isSelected = selected?.id === building?.id;
              const isMoveTarget = mode === "move" && !building;
              const isPlaceTarget = mode === "place" && !building;

              return (
                <div
                  key={`${col}-${row}`}
                  onClick={() => handleCellClick(col, row)}
                  style={{
                    width: CELL_SIZE,
                    height: CELL_SIZE,
                    borderRadius: 8,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    background: isSelected
                      ? "rgba(94,169,255,0.3)"
                      : building
                      ? "rgba(255,255,255,0.7)"
                      : "rgba(255,255,255,0.2)",
                    border: isSelected
                      ? "2px solid #5EA9FF"
                      : (isMoveTarget || isPlaceTarget)
                      ? "2px dashed #7EDC8A"
                      : "1.5px dashed rgba(255,255,255,0.4)",
                    transition: "all 0.15s",
                    userSelect: "none",
                  }}
                >
                  {building ? (
                    <>
                      <div style={{
                        fontSize: CELL_SIZE < 50 ? "1.2rem" : "1.5rem",
                        transform: `rotate(${building.rotation}deg)`,
                        transition: "transform 0.3s",
                        lineHeight: 1,
                      }}>
                        {building.icon}
                      </div>
                      {building.level > 1 && (
                        <div style={{
                          fontSize: "0.5rem", fontWeight: 800, color: "#5EA9FF",
                          background: "white", borderRadius: 4, padding: "1px 4px", marginTop: 1,
                        }}>
                          Lv{building.level}
                        </div>
                      )}
                    </>
                  ) : (isMoveTarget || isPlaceTarget) ? (
                    <Plus size={16} color="rgba(126,220,138,0.8)" />
                  ) : null}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Selected building panel */}
      {selected && mode === "view" && (
        <div className="fv-card" style={{ margin: "0 16px 12px" }}>
          <div className="row between" style={{ marginBottom: 10 }}>
            <div className="row gap-8">
              <span style={{ fontSize: "1.5rem" }}>{selected.icon}</span>
              <div>
                <p style={{ margin: 0, fontWeight: 800, fontSize: "0.9rem", color: "#1D2B53" }}>{selected.name}</p>
                <p style={{ margin: 0, fontSize: "0.72rem", color: "#6B7A99" }}>Level {selected.level}</p>
              </div>
            </div>
            <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", cursor: "pointer" }}>
              <X size={16} color="#6B7A99" />
            </button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
            <button
              className="fv-btn fv-btn-secondary fv-btn-sm"
              onClick={handleStartMove}
              style={{ flexDirection: "column", height: 52, gap: 4, fontSize: "0.68rem" }}
              disabled={isPending}
            >
              <Move size={14} />
              Move
            </button>
            <button
              className="fv-btn fv-btn-secondary fv-btn-sm"
              onClick={handleRotate}
              style={{ flexDirection: "column", height: 52, gap: 4, fontSize: "0.68rem" }}
              disabled={isPending}
            >
              <RotateCcw size={14} />
              Rotate
            </button>
            <button
              className="fv-btn fv-btn-secondary fv-btn-sm"
              onClick={handleUpgrade}
              style={{ flexDirection: "column", height: 52, gap: 4, fontSize: "0.68rem" }}
              disabled={isPending}
            >
              <TrendingUp size={14} />
              Upgrade
            </button>
            <button
              className="fv-btn fv-btn-sm"
              onClick={handleSell}
              style={{ flexDirection: "column", height: 52, gap: 4, fontSize: "0.68rem", background: "#FFF5F5", color: "#D94040", border: "1.5px solid #FFCCD5" }}
              disabled={isPending}
            >
              <Trash2 size={14} />
              Sell
            </button>
          </div>
        </div>
      )}

      {/* Inventory */}
      <div style={{ padding: "0 16px" }}>
        <p style={{ margin: "0 0 8px", fontWeight: 800, fontSize: "0.78rem", color: "#1D2B53" }}>
          Inventory ({inventory.length} items ready to place)
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
                  borderRadius: 12,
                  padding: "10px 6px",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 4,
                  fontFamily: "inherit",
                  transition: "all 0.15s",
                }}
              >
                <span style={{ fontSize: "1.4rem" }}>{b.icon}</span>
                <span style={{ fontSize: "0.6rem", fontWeight: 700, color: "#1D2B53", textAlign: "center", lineHeight: 1.2 }}>
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
