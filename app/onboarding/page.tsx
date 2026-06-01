"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { Mascot } from "@/components/focusville/Mascot";
import { useTranslations } from "next-intl";

type Step = 1 | 2 | 3 | 4;

const SUGGESTIONS = [
  "Study for 30 minutes",
  "Complete homework",
  "Read a chapter",
  "Review notes",
];


export default function OnboardingPage() {
  const { patch } = useStore();
  const router = useRouter();
  const t = useTranslations("onboarding");
  const [step, setStep] = useState<Step>(1);
  const [cityName, setCityName] = useState("");
  const [firstTask, setFirstTask] = useState("");
  const [isPending, startTransition] = useTransition();

  function nextStep() {
    if (step === 4) {
      finish();
    } else {
      setStep((s) => (s + 1) as Step);
    }
  }

  function prevStep() {
    if (step > 1) setStep((s) => (s - 1) as Step);
  }

  function finish() {
    startTransition(async () => {
      patch((s) => ({
        ...s,
        hasOnboarded: true,
        // City name would be saved to DB; for now patch local state
      }));
      router.push("/plan");
    });
  }

  const steps: Step[] = [1, 2, 3, 4];

  return (
    <div style={{
      minHeight: "100dvh",
      background: "linear-gradient(180deg, #B8E4FF 0%, #D4EEFF 35%, #F5FAFF 70%)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "flex-end",
      fontFamily: "var(--font-poppins, var(--font-sarabun, Poppins, system-ui, sans-serif))",
      position: "relative",
      overflow: "hidden",
      maxWidth: 430,
      margin: "0 auto",
    }}>

      {/* City skyline backdrop */}
      <div style={{ position: "absolute", bottom: 200, left: 0, right: 0, height: 260, overflow: "hidden" }}>
        {[
          { l: "0%",  w: 60, h: 160, c: "#7BBBF5" }, { l: "8%",  w: 45, h: 100, c: "#8EC5FF" },
          { l: "16%", w: 55, h: 130, c: "#5EA9FF" }, { l: "24%", w: 40, h: 80,  c: "#A8D4FF" },
          { l: "32%", w: 70, h: 200, c: "#6EAEF0" }, { l: "44%", w: 50, h: 140, c: "#9AC8F8" },
          { l: "54%", w: 45, h: 110, c: "#7BBBF5" }, { l: "63%", w: 65, h: 180, c: "#5EA9FF" },
          { l: "74%", w: 40, h: 90,  c: "#8EC5FF" }, { l: "82%", w: 55, h: 150, c: "#6EAEF0" },
          { l: "90%", w: 50, h: 120, c: "#9AC8F8" },
        ].map((b, i) => (
          <div key={i} style={{ position: "absolute", bottom: 0, left: b.l, width: b.w, height: b.h, background: b.c, borderRadius: "6px 6px 0 0", opacity: 0.7 }} />
        ))}
        {["5%", "22%", "50%", "78%", "93%"].map((x, i) => (
          <div key={i} style={{ position: "absolute", bottom: 0, left: x, fontSize: "2rem" }}>🌳</div>
        ))}
      </div>

      {/* Clouds */}
      {[{ top: "8%", left: "10%", sz: 1.0 }, { top: "12%", left: "60%", sz: 0.7 }, { top: "20%", left: "30%", sz: 0.85 }].map((c, i) => (
        <div key={i} style={{ position: "absolute", top: c.top, left: c.left, fontSize: `${c.sz * 2.5}rem`, opacity: 0.8, animation: `mascot-float ${3 + i}s ease-in-out infinite`, animationDelay: `${i * 0.7}s` }}>
          ☁️
        </div>
      ))}

      {/* Card panel */}
      <div style={{
        background: "white",
        borderRadius: "32px 32px 0 0",
        padding: "32px 28px 48px",
        width: "100%",
        textAlign: "center",
        boxShadow: "0 -8px 40px rgba(94,169,255,0.15)",
        position: "relative",
        zIndex: 10,
        minHeight: 340,
      }}>
        {/* Mascot peeking above card */}
        <div style={{ position: "absolute", top: -60, left: "50%", transform: "translateX(-50%)", animation: "mascot-float 3s ease-in-out infinite" }}>
          <Mascot size={80} mood={step === 4 ? "celebrate" : step === 3 ? "thinking" : "happy"} />
        </div>

        {/* Step indicator */}
        <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 20, marginTop: 28 }}>
          {steps.map((s) => (
            <div key={s} style={{
              width: s === step ? 20 : 8,
              height: 8,
              borderRadius: 4,
              background: s <= step ? "#5EA9FF" : "#D6E9FF",
              transition: "all 0.3s ease",
            }} />
          ))}
        </div>

        {/* ── Step 1: Welcome ── */}
        {step === 1 && (
          <div style={{ animation: "animate-fade-up 0.3s ease" }}>
            <p style={{ margin: "0 0 4px", fontSize: "0.7rem", fontWeight: 800, color: "#6B7A99", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              {t("step", { current: 1, total: 4 })}
            </p>
            <h1 style={{ margin: "0 0 8px", fontSize: "1.9rem", fontWeight: 900, color: "#1D2B53" }}>
              <span style={{ color: "#5EA9FF" }}>Focus</span>Ville
            </h1>
            <p style={{ margin: "0 0 24px", fontSize: "0.92rem", fontWeight: 600, color: "#6B7A99", lineHeight: 1.5 }}>
              {t("tagline")}
            </p>
            <div style={{ display: "flex", gap: 8, marginBottom: 16, justifyContent: "center" }}>
              {["✅", "⚡", "🏙"].map((icon, i) => (
                <div key={i} style={{ width: 52, height: 52, borderRadius: 16, background: "#EBF5FF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.4rem" }}>
                  {icon}
                </div>
              ))}
            </div>
            <div className="stack gap-12">
              <button className="fv-btn fv-btn-primary fv-btn-lg fv-btn-full" onClick={nextStep}>
                {t("get_started")}
              </button>
              <Link href="/login" className="fv-btn fv-btn-ghost fv-btn-full" style={{ textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {t("has_account")}
              </Link>
            </div>
          </div>
        )}

        {/* ── Step 2: Name your city ── */}
        {step === 2 && (
          <div style={{ textAlign: "left" }}>
            <p style={{ margin: "0 0 4px", fontSize: "0.7rem", fontWeight: 800, color: "#6B7A99", textTransform: "uppercase", letterSpacing: "0.08em", textAlign: "center" }}>
              {t("step", { current: 2, total: 4 })}
            </p>
            <h2 style={{ margin: "0 0 6px", fontSize: "1.4rem", fontWeight: 900, color: "#1D2B53", textAlign: "center" }}>
              {t("name_city_title")}
            </h2>
            <p style={{ margin: "0 0 20px", fontSize: "0.82rem", color: "#6B7A99", textAlign: "center" }}>
              {t("name_city_subtitle")}
            </p>
            <input
              type="text"
              className="fv-input"
              style={{ marginBottom: 12, fontSize: "0.95rem", fontWeight: 700 }}
              placeholder={t("name_city_placeholder")}
              value={cityName}
              onChange={(e) => setCityName(e.target.value)}
              autoFocus
              maxLength={40}
              onKeyDown={(e) => e.key === "Enter" && nextStep()}
            />
            <div style={{ display: "flex", gap: 8 }}>
              <button className="fv-btn fv-btn-ghost fv-btn-sm" onClick={prevStep} style={{ flexShrink: 0 }}>
                {t("back")}
              </button>
              <button className="fv-btn fv-btn-primary fv-btn-full" onClick={nextStep}>
                {t("next")}
              </button>
            </div>
          </div>
        )}

        {/* ── Step 3: First task ── */}
        {step === 3 && (
          <div style={{ textAlign: "left" }}>
            <p style={{ margin: "0 0 4px", fontSize: "0.7rem", fontWeight: 800, color: "#6B7A99", textTransform: "uppercase", letterSpacing: "0.08em", textAlign: "center" }}>
              {t("step", { current: 3, total: 4 })}
            </p>
            <h2 style={{ margin: "0 0 6px", fontSize: "1.4rem", fontWeight: 900, color: "#1D2B53", textAlign: "center" }}>
              {t("first_task_title")}
            </h2>
            <p style={{ margin: "0 0 16px", fontSize: "0.82rem", color: "#6B7A99", textAlign: "center" }}>
              {t("first_task_subtitle")}
            </p>
            <input
              type="text"
              className="fv-input"
              style={{ marginBottom: 12 }}
              placeholder={t("first_task_placeholder")}
              value={firstTask}
              onChange={(e) => setFirstTask(e.target.value)}
              autoFocus
              maxLength={120}
              onKeyDown={(e) => e.key === "Enter" && firstTask.trim() && nextStep()}
            />
            <p style={{ margin: "0 0 8px", fontSize: "0.72rem", fontWeight: 700, color: "#6B7A99" }}>{t("suggestions")}</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => setFirstTask(s)}
                  style={{
                    background: firstTask === s ? "#EBF5FF" : "white",
                    border: `1px solid ${firstTask === s ? "#5EA9FF" : "#D6E9FF"}`,
                    borderRadius: 20,
                    padding: "4px 12px",
                    fontSize: "0.72rem",
                    fontWeight: 600,
                    color: firstTask === s ? "#5EA9FF" : "#6B7A99",
                    cursor: "pointer",
                    fontFamily: "inherit",
                    transition: "all 0.15s",
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="fv-btn fv-btn-ghost fv-btn-sm" onClick={prevStep} style={{ flexShrink: 0 }}>
                {t("back")}
              </button>
              <button
                className="fv-btn fv-btn-primary fv-btn-full"
                onClick={nextStep}
                disabled={!firstTask.trim()}
                style={{ opacity: !firstTask.trim() ? 0.5 : 1 }}
              >
                {t("next")}
              </button>
            </div>
          </div>
        )}

        {/* ── Step 4: How it works ── */}
        {step === 4 && (
          <div>
            <p style={{ margin: "0 0 4px", fontSize: "0.7rem", fontWeight: 800, color: "#6B7A99", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              {t("step", { current: 4, total: 4 })}
            </p>
            <h2 style={{ margin: "0 0 20px", fontSize: "1.4rem", fontWeight: 900, color: "#1D2B53" }}>
              {t("how_title")}
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24, textAlign: "left" }}>
              {[
                { icon: "✅", label: t("step1_label"), desc: t("step1_desc") },
                { icon: "⚡", label: t("step2_label"), desc: t("step2_desc") },
                { icon: "🏙", label: t("step3_label"), desc: t("step3_desc") },
              ].map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, background: "#F5FAFF", borderRadius: 14, padding: "12px 14px" }}>
                  <div style={{ width: 44, height: 44, borderRadius: 14, background: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.4rem", flexShrink: 0, boxShadow: "0 2px 8px rgba(94,169,255,0.12)" }}>
                    {item.icon}
                  </div>
                  <div>
                    <p style={{ margin: 0, fontWeight: 800, fontSize: "0.88rem", color: "#1D2B53" }}>{item.label}</p>
                    <p style={{ margin: "1px 0 0", fontSize: "0.75rem", color: "#6B7A99" }}>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="fv-btn fv-btn-ghost fv-btn-sm" onClick={prevStep} style={{ flexShrink: 0 }}>
                {t("back")}
              </button>
              <button
                className="fv-btn fv-btn-primary fv-btn-full fv-btn-lg"
                onClick={finish}
                disabled={isPending}
              >
                {isPending ? "…" : t("lets_go")}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
