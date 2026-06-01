export default function SettingsLoading() {
  return (
    <div style={{ padding: "0 0 20px" }}>
      <div style={{ height: 180, background: "linear-gradient(135deg, #5EA9FF, #3D8FE8)", animation: "pulse 1.5s ease-in-out infinite" }} />
      <div style={{ padding: "16px 20px" }}>
        {[1, 2, 3].map((i) => (
          <div key={i} style={{ height: 60, borderRadius: 14, background: "#EBF5FF", marginBottom: 12, animation: "pulse 1.5s ease-in-out infinite" }} />
        ))}
      </div>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }`}</style>
    </div>
  );
}
