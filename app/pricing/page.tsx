import Link from "next/link";
import { Check, X } from "lucide-react";

const FREE_FEATURES = [
  { label: "5 tasks per day", included: true },
  { label: "Focus timer", included: true },
  { label: "Basic city (Pioneer + Modern era)", included: true },
  { label: "Daily mood check-in", included: true },
  { label: "Read neighborhood posts", included: true },
  { label: "1 AI goal (lifetime)", included: true },
  { label: "2 custom rewards", included: true },
  { label: "Basic achievements", included: true },
  { label: "Passive income", included: false },
  { label: "Full analytics", included: false },
  { label: "Post in Neighborhood", included: false },
  { label: "Unlimited AI goals", included: false },
  { label: "All 4 city eras", included: false },
];

const PRO_FEATURES = [
  { label: "Unlimited tasks per day", included: true },
  { label: "Focus timer + cumulative stats", included: true },
  { label: "All 4 city eras incl. Metropolis", included: true },
  { label: "Daily mood check-in + burnout AI", included: true },
  { label: "Post + reply in Neighborhood", included: true },
  { label: "Unlimited AI goals", included: true },
  { label: "Unlimited custom rewards", included: true },
  { label: "Full achievements + stats", included: true },
  { label: "Passive income from buildings", included: true },
  { label: "Full analytics & history", included: true },
  { label: "No ads", included: true },
  { label: "Priority support", included: true },
];

export default function PricingPage() {
  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(180deg, #F0F5FF 0%, #FFFFFF 100%)", padding: "40px 20px" }}>
      {/* Back link */}
      <div style={{ maxWidth: 680, margin: "0 auto" }}>
        <Link
          href="/dashboard"
          style={{ fontSize: "0.82rem", color: "#5EA9FF", fontWeight: 700, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4, marginBottom: 24 }}
        >
          ← Back to app
        </Link>

        {/* Title */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <h1 style={{ margin: "0 0 8px", fontSize: "2rem", fontWeight: 900, color: "#1D2B53" }}>
            Choose Your Plan
          </h1>
          <p style={{ margin: 0, color: "#6B7A99", fontSize: "0.92rem" }}>
            Every effort counts. Pro unlocks the full experience.
          </p>
        </div>

        {/* Plans */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 32 }}>
          {/* Free */}
          <div style={{
            borderRadius: 20,
            border: "2px solid #D6E9FF",
            background: "white",
            padding: "24px 20px",
          }}>
            <p style={{ margin: "0 0 4px", fontSize: "0.75rem", fontWeight: 800, color: "#6B7A99", letterSpacing: "0.1em" }}>FREE</p>
            <p style={{ margin: "0 0 16px", fontSize: "2rem", fontWeight: 900, color: "#1D2B53" }}>฿0</p>
            <div className="stack gap-8">
              {FREE_FEATURES.map((f) => (
                <div key={f.label} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                  {f.included
                    ? <Check size={14} color="#7EDC8A" style={{ flexShrink: 0, marginTop: 1 }} />
                    : <X size={14} color="#D1D5DB" style={{ flexShrink: 0, marginTop: 1 }} />}
                  <span style={{ fontSize: "0.75rem", color: f.included ? "#1D2B53" : "#9CA3AF", fontWeight: f.included ? 600 : 400 }}>
                    {f.label}
                  </span>
                </div>
              ))}
            </div>
            <Link
              href="/dashboard"
              style={{
                display: "block", textAlign: "center", marginTop: 20,
                padding: "10px 0", borderRadius: 12, fontSize: "0.85rem", fontWeight: 700,
                border: "1px solid #D6E9FF", color: "#6B7A99", textDecoration: "none",
              }}
            >
              Get Started Free
            </Link>
          </div>

          {/* Pro */}
          <div style={{
            borderRadius: 20,
            border: "2px solid #7C3AED",
            background: "linear-gradient(135deg, #F3E8FF, #EDE9FE)",
            padding: "24px 20px",
            position: "relative",
          }}>
            <div style={{
              position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)",
              background: "#7C3AED", color: "white", borderRadius: 999,
              padding: "4px 14px", fontSize: "0.7rem", fontWeight: 800, whiteSpace: "nowrap",
            }}>
              ⭐ Most Popular
            </div>

            <p style={{ margin: "0 0 4px", fontSize: "0.75rem", fontWeight: 800, color: "#7C3AED", letterSpacing: "0.1em" }}>PRO</p>
            <div style={{ marginBottom: 4 }}>
              <span style={{ fontSize: "2rem", fontWeight: 900, color: "#1D2B53" }}>฿149</span>
              <span style={{ fontSize: "0.8rem", color: "#6B7A99" }}>/month</span>
            </div>
            <p style={{ margin: "0 0 16px", fontSize: "0.72rem", color: "#7C3AED", fontWeight: 700 }}>
              or ฿1,190/year (save 33%)
            </p>
            <div className="stack gap-8">
              {PRO_FEATURES.map((f) => (
                <div key={f.label} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                  <Check size={14} color="#7C3AED" style={{ flexShrink: 0, marginTop: 1 }} />
                  <span style={{ fontSize: "0.75rem", color: "#1D2B53", fontWeight: 600 }}>
                    {f.label}
                  </span>
                </div>
              ))}
            </div>
            <a
              href="mailto:focusville@dekds.com?subject=Pro Upgrade"
              style={{
                display: "block", textAlign: "center", marginTop: 20,
                padding: "12px 0", borderRadius: 12, fontSize: "0.88rem", fontWeight: 800,
                background: "#7C3AED", color: "white", textDecoration: "none",
              }}
            >
              Start 7-Day Free Trial
            </a>
            <p style={{ margin: "8px 0 0", fontSize: "0.68rem", color: "#6B7A99", textAlign: "center" }}>
              No credit card required · Cancel anytime
            </p>
          </div>
        </div>

        {/* FAQ */}
        <div style={{ background: "white", borderRadius: 20, border: "1px solid #D6E9FF", padding: "24px 20px" }}>
          <h2 style={{ margin: "0 0 16px", fontSize: "1rem", fontWeight: 800, color: "#1D2B53" }}>Common Questions</h2>
          <div className="stack gap-16">
            {[
              { q: "What happens to my data if I downgrade?", a: "Your tasks, goals, and city are always yours. Some Pro features will be locked but nothing is deleted." },
              { q: "Can I try Pro for free?", a: "Yes — new users get a 7-day free trial. No credit card needed to start." },
              { q: "How do I pay?", a: "We accept PromptPay (Thai QR code), credit/debit cards, and line pay. Contact us to get started." },
              { q: "Is my progress saved between plans?", a: "Absolutely. Your streak, XP, city, and coins are never reset when switching plans." },
            ].map(({ q, a }) => (
              <div key={q}>
                <p style={{ margin: "0 0 4px", fontWeight: 700, fontSize: "0.85rem", color: "#1D2B53" }}>{q}</p>
                <p style={{ margin: 0, fontSize: "0.78rem", color: "#6B7A99" }}>{a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
