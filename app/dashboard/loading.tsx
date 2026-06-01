export default function DashboardLoading() {
  return (
    <div style={{ padding: "0 0 20px" }}>
      <div style={{ background: "white", padding: "16px 20px 12px", borderBottom: "1px solid #D6E9FF" }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          {[60, 60, 50].map((w, i) => (
            <div key={i} style={{ width: w, height: 28, borderRadius: 8, background: "#EBF5FF", animation: "pulse 1.5s ease-in-out infinite" }} />
          ))}
        </div>
        <div style={{ width: 160, height: 20, borderRadius: 6, background: "#EBF5FF", animation: "pulse 1.5s ease-in-out infinite" }} />
      </div>
      <div style={{ padding: "16px 20px" }}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} style={{ height: 80, borderRadius: 16, background: "#EBF5FF", marginBottom: 12, animation: "pulse 1.5s ease-in-out infinite" }} />
        ))}
      </div>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }`}</style>
    </div>
  );
}
