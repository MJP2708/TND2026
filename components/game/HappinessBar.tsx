"use client";

interface HappinessBarProps {
  happiness: number;
  compact?: boolean;
}

function getHappinessColor(h: number): string {
  if (h >= 80) return "#7EDC8A";
  if (h >= 50) return "#FFD45E";
  if (h >= 25) return "#FFAD5E";
  return "#FF7B7B";
}

function getCityStatusMessage(h: number): string {
  if (h >= 80) return "Your city is thriving 🌟";
  if (h >= 50) return "Citizens are content 😊";
  if (h >= 25) return "Citizens are getting restless...";
  return "Your city is in crisis 🔥";
}

export function HappinessBar({ happiness, compact = false }: HappinessBarProps) {
  const color = getHappinessColor(happiness);

  if (compact) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#6B7A99", minWidth: 64 }}>😊 Happiness</span>
        <div style={{ flex: 1, height: 6, background: "#EBF5FF", borderRadius: 999, overflow: "hidden" }}>
          <div style={{
            height: "100%",
            width: `${happiness}%`,
            background: color,
            borderRadius: 999,
            transition: "width 800ms ease",
          }} />
        </div>
        <span style={{ fontSize: "0.7rem", fontWeight: 800, color: "#1D2B53", minWidth: 28, textAlign: "right" }}>
          {happiness}
        </span>
      </div>
    );
  }

  return (
    <div style={{ padding: "10px 20px 8px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#6B7A99" }}>City Happiness</span>
        <span style={{ fontSize: "0.72rem", fontWeight: 800, color: "#1D2B53" }}>{happiness}/100</span>
      </div>
      <div style={{ height: 8, background: "#EBF5FF", borderRadius: 999, overflow: "hidden", marginBottom: 5 }}>
        <div style={{
          height: "100%",
          width: `${happiness}%`,
          background: color,
          borderRadius: 999,
          transition: "width 800ms ease",
        }} />
      </div>
      <p style={{ margin: 0, fontSize: "0.7rem", color: "#6B7A99", fontWeight: 600 }}>
        {getCityStatusMessage(happiness)}
        {happiness >= 80 && <span style={{ marginLeft: 6, color: "#7EDC8A", fontWeight: 700 }}>+25% earnings</span>}
        {happiness < 25 && <span style={{ marginLeft: 6, color: "#FF7B7B", fontWeight: 700 }}>Passive income halved</span>}
      </p>
    </div>
  );
}
