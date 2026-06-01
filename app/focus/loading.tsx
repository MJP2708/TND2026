export default function FocusLoading() {
  return (
    <div style={{ padding: "20px", display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 60 }}>
      <div style={{ width: 240, height: 240, borderRadius: "50%", background: "#EBF5FF", animation: "pulse 1.5s ease-in-out infinite", marginBottom: 24 }} />
      <div style={{ width: 200, height: 52, borderRadius: 16, background: "#EBF5FF", animation: "pulse 1.5s ease-in-out infinite" }} />
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }`}</style>
    </div>
  );
}
