export default function RewardsLoading() {
  return (
    <div style={{ padding: "0 0 20px" }}>
      <div style={{ background: "linear-gradient(135deg, #EBF5FF, #DDEEFF)", padding: "18px 20px 14px", borderBottom: "1px solid #D6E9FF" }}>
        <div style={{ width: 80, height: 28, borderRadius: 8, background: "rgba(255,255,255,0.5)", marginBottom: 12, animation: "pulse 1.5s ease-in-out infinite" }} />
        <div style={{ display: "flex", gap: 8 }}>
          {[60, 60, 70].map((w, i) => (
            <div key={i} style={{ width: w, height: 32, borderRadius: 20, background: "rgba(255,255,255,0.5)", animation: "pulse 1.5s ease-in-out infinite" }} />
          ))}
        </div>
      </div>
      <div style={{ padding: "16px 20px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} style={{ height: 100, borderRadius: 14, background: "#EBF5FF", animation: "pulse 1.5s ease-in-out infinite" }} />
          ))}
        </div>
      </div>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }`}</style>
    </div>
  );
}
