export default function PlanLoading() {
  return (
    <div style={{ padding: "16px 20px" }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} style={{ height: 72, borderRadius: 16, background: "#EBF5FF", marginBottom: 10, animation: "pulse 1.5s ease-in-out infinite" }} />
      ))}
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }`}</style>
    </div>
  );
}
