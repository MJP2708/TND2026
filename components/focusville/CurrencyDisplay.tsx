"use client";

interface CurrencyDisplayProps {
  gold: number;
  xp?: number;
  className?: string;
}

export function CurrencyDisplay({ gold, xp, className = "" }: CurrencyDisplayProps) {
  return (
    <div className={`row gap-8 ${className}`}>
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
