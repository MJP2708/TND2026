"use client";

import { useState, useTransition } from "react";
import { payMaintenance } from "@/lib/actions/maintenance";
import { Wrench, X, CheckCircle, AlertTriangle, XCircle } from "lucide-react";

type MaintenanceItem = {
  id: string;
  name: string;
  icon: string;
  health: string;
  maintenanceDue: string;
  daysUntilDue: number;
  cost: number;
  tier: number;
};

interface Props {
  items: MaintenanceItem[];
  userGold: number;
  onUpdate: () => void;
}

function HealthIcon({ health }: { health: string }) {
  if (health === "healthy")      return <CheckCircle size={14} color="#7EDC8A" />;
  if (health === "due_soon")     return <AlertTriangle size={14} color="#FFD45E" />;
  if (health === "deteriorating")return <AlertTriangle size={14} color="#FFAD5E" />;
  return <XCircle size={14} color="#FF7B7B" />;
}

function healthLabel(health: string, days: number): string {
  if (health === "collapsed")      return "⚠ Collapsed";
  if (health === "deteriorating")  return "🔴 Deteriorating";
  if (health === "due_soon")       return "🟡 Due soon";
  if (days > 0)                    return `✅ Due in ${days}d`;
  return "🔴 Overdue";
}

export function MaintenancePanel({ items, userGold, onUpdate }: Props) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState<string | null>(null);

  const urgentCount = items.filter((i) => i.health !== "healthy" || i.daysUntilDue <= 3).length;

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  function handlePay(item: MaintenanceItem) {
    if (userGold < item.cost) {
      showToast(`Need ${item.cost}🪙 — you have ${userGold}🪙`);
      return;
    }
    startTransition(async () => {
      const result = await payMaintenance(item.id);
      if (result.success) {
        showToast(`${item.icon} ${item.name} maintained! -${result.cost}🪙`);
        onUpdate();
      } else {
        showToast(result.error ?? "Failed");
      }
    });
  }

  return (
    <>
      {/* Wrench button */}
      <button
        onClick={() => setOpen(true)}
        style={{
          position: "relative",
          background: urgentCount > 0 ? "#FFF8E7" : "white",
          border: `1.5px solid ${urgentCount > 0 ? "#FFD45E" : "#D6E9FF"}`,
          borderRadius: 12,
          width: 40,
          height: 40,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Wrench size={18} color={urgentCount > 0 ? "#B8860B" : "#6B7A99"} />
        {urgentCount > 0 && (
          <div style={{
            position: "absolute",
            top: -4,
            right: -4,
            width: 16,
            height: 16,
            background: "#FF7B7B",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "0.55rem",
            fontWeight: 900,
            color: "white",
          }}>
            {urgentCount}
          </div>
        )}
      </button>

      {/* Panel drawer */}
      {open && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 8000,
            background: "rgba(0,0,0,0.4)",
          }}
          onClick={() => setOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              background: "white",
              borderRadius: "20px 20px 0 0",
              padding: "16px 20px 32px",
              maxHeight: "70vh",
              overflowY: "auto",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div>
                <p style={{ margin: 0, fontWeight: 900, fontSize: "0.95rem", color: "#1D2B53" }}>
                  🔧 Maintenance Panel
                </p>
                <p style={{ margin: 0, fontSize: "0.72rem", color: "#6B7A99" }}>
                  Your gold: {userGold}🪙
                </p>
              </div>
              <button onClick={() => setOpen(false)} style={{ background: "none", border: "none", cursor: "pointer" }}>
                <X size={18} color="#6B7A99" />
              </button>
            </div>

            {items.length === 0 ? (
              <div style={{ textAlign: "center", padding: "24px 0" }}>
                <p style={{ margin: 0, color: "#6B7A99", fontSize: "0.85rem" }}>
                  No buildings placed yet. Start building!
                </p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {items.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      background: item.health === "collapsed" ? "#FFF5F5" : item.health === "deteriorating" ? "#FFF8F0" : "white",
                      border: `1.5px solid ${item.health === "collapsed" ? "#FFCCD5" : item.health === "deteriorating" ? "#FFD4A0" : "#D6E9FF"}`,
                      borderRadius: 12,
                      padding: "10px 12px",
                    }}
                  >
                    <span style={{ fontSize: "1.4rem" }}>{item.icon}</span>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontWeight: 700, fontSize: "0.82rem", color: "#1D2B53" }}>{item.name}</p>
                      <p style={{ margin: "2px 0 0", fontSize: "0.68rem", color: "#6B7A99" }}>
                        {healthLabel(item.health, item.daysUntilDue)} · {item.cost}🪙/week
                      </p>
                    </div>
                    <HealthIcon health={item.health} />
                    {item.health !== "healthy" || item.daysUntilDue <= 3 ? (
                      <button
                        onClick={() => handlePay(item)}
                        disabled={isPending || userGold < item.cost}
                        className="fv-btn fv-btn-primary fv-btn-sm"
                        style={{ height: 30, padding: "0 10px", fontSize: "0.7rem", flexShrink: 0 }}
                      >
                        Pay {item.cost}🪙
                      </button>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

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
    </>
  );
}
