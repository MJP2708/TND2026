"use client";

export default function PlanError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div style={{ padding: "60px 20px", textAlign: "center" }}>
      <div style={{ fontSize: "3rem", marginBottom: 12 }}>📋</div>
      <h2 style={{ margin: "0 0 8px", fontWeight: 900, color: "#1D2B53" }}>Plan error</h2>
      <p style={{ margin: "0 0 20px", color: "#6B7A99", fontSize: "0.85rem" }}>
        {error.message || "Something went wrong loading your plan."}
      </p>
      <button
        onClick={reset}
        style={{
          background: "#5EA9FF", color: "white", border: "none", borderRadius: 12,
          padding: "10px 24px", fontSize: "0.88rem", fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
        }}
      >
        Try again
      </button>
    </div>
  );
}
