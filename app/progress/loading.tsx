export default function ProgressLoading() {
  return (
    <div style={{ padding: "16px 20px" }}>
      <div style={{ height: 200, borderRadius: 16, background: "#EBF5FF", marginBottom: 16, animation: "pulse 1.5s ease-in-out infinite" }} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} style={{ height: 80, borderRadius: 14, background: "#EBF5FF", animation: "pulse 1.5s ease-in-out infinite" }} />
        ))}
      </div>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }`}</style>
    </div>
  );
}
