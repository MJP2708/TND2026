"use client";

import { useTransition } from "react";
import { useStore } from "@/lib/store";
import { setLocale } from "@/lib/actions/locale";

const LANGUAGES = [
  { code: "en" as const, label: "EN", flag: "🇬🇧", name: "English" },
  { code: "th" as const, label: "TH", flag: "🇹🇭", name: "ภาษาไทย" },
];

interface Props {
  currentLocale: string;
  compact?: boolean;
}

export function LanguageToggle({ currentLocale, compact = false }: Props) {
  const [isPending, startTransition] = useTransition();
  const { patch } = useStore();

  function handleChange(locale: "en" | "th") {
    if (locale === currentLocale) return;
    // Also update the in-memory state so fv-copy hooks stay in sync
    patch((s) => ({ ...s, language: locale }));
    startTransition(async () => {
      await setLocale(locale);
    });
  }

  return (
    <div style={{
      display: "inline-flex",
      background: "#EBF5FF",
      borderRadius: 10,
      padding: 3,
      gap: 2,
    }}>
      {LANGUAGES.map((lang) => {
        const active = currentLocale === lang.code;
        return (
          <button
            key={lang.code}
            onClick={() => handleChange(lang.code)}
            disabled={isPending}
            title={lang.name}
            style={{
              display: "flex",
              alignItems: "center",
              gap: compact ? 0 : 4,
              padding: compact ? "4px 8px" : "5px 10px",
              borderRadius: 8,
              border: "none",
              cursor: isPending ? "not-allowed" : "pointer",
              fontFamily: "inherit",
              fontSize: "0.75rem",
              fontWeight: 800,
              transition: "all 0.15s",
              background: active ? "white" : "transparent",
              color: active ? "#1D2B53" : "#6B7A99",
              boxShadow: active ? "0 1px 4px rgba(94,169,255,0.15)" : "none",
              opacity: isPending ? 0.6 : 1,
            }}
          >
            <span>{lang.flag}</span>
            {!compact && <span>{lang.label}</span>}
          </button>
        );
      })}
    </div>
  );
}
