"use client";

interface CurrencyDisplayProps {
  gold: number;
  energy: number;
  xp?: number;
  className?: string;
  stacked?: boolean; // vertical layout for mobile
}

export function CurrencyDisplay({ gold, energy, xp, className = "", stacked = false }: CurrencyDisplayProps) {
  return (
    <div
      className={className}
      style={{
        display: "flex",
        flexDirection: stacked ? "column" : "row",
        gap: stacked ? 4 : 8,
        alignItems: stacked ? "flex-end" : "center",
      }}
    >
      <div className="fv-gold">
        <span>⚡</span>
        <span>{energy.toLocaleString()}</span>
      </div>
      <div className="fv-gold">
        <span>🪙</span>
        <span>{gold.toLocaleString()}</span>
      </div>
      {xp !== undefined && (
        <div className="fv-xp">
          <span>💎</span>
          <span>{xp.toLocaleString()}</span>
        </div>
      )}
    </div>
  );
}
