export default function CommunityLoading() {
  return (
    <div style={{ padding: "0 0 20px" }}>
      <div style={{ background: "white", padding: "14px 20px 10px", borderBottom: "1px solid #D6E9FF" }}>
        <div style={{ width: 120, height: 24, borderRadius: 6, background: "#EBF5FF", animation: "pulse 1.5s ease-in-out infinite" }} />
      </div>
      <div style={{ padding: "16px 20px" }}>
        <div style={{ height: 130, borderRadius: 20, background: "#EBF5FF", marginBottom: 16, animation: "pulse 1.5s ease-in-out infinite" }} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} style={{ height: 80, borderRadius: 12, background: "#EBF5FF", animation: "pulse 1.5s ease-in-out infinite" }} />
          ))}
        </div>
      </div>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }`}</style>
    </div>
  );
}
