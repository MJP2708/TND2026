"use client";

import type { LanguageCode, ThemeMode, UiTone } from "@/lib/types";
import { LANGUAGES, getCopy } from "@/lib/i18n";
import { useStore } from "@/lib/store";

const TONES: { value: UiTone; label: string }[] = [
  { value: "sunrise", label: "Sunrise" },
  { value: "ocean", label: "Ocean" },
  { value: "classic", label: "Classic" },
  { value: "mono", label: "Mono" },
];

export function PreferencesBar({ compact = false }: { compact?: boolean }) {
  const { state, patch } = useStore();
  const copy = getCopy(state.language);

  function setTheme(themeMode: ThemeMode) {
    patch((s) => ({ ...s, themeMode }));
  }

  function setTone(uiTone: UiTone) {
    patch((s) => ({ ...s, uiTone }));
  }

  function setLanguage(language: LanguageCode) {
    patch((s) => ({ ...s, language }));
  }

  return (
    <div className={`prefs-bar ${compact ? "prefs-bar-compact" : ""}`}>
      <div className="segmented-control" aria-label={copy.theme}>
        <button
          className={state.themeMode === "light" ? "active" : ""}
          onClick={() => setTheme("light")}
          type="button"
        >
          {copy.light}
        </button>
        <button
          className={state.themeMode === "dark" ? "active" : ""}
          onClick={() => setTheme("dark")}
          type="button"
        >
          {copy.dark}
        </button>
      </div>

      <label className="select-shell">
        <span>{copy.tone}</span>
        <select
          value={state.uiTone}
          onChange={(event) => setTone(event.target.value as UiTone)}
        >
          {TONES.map((tone) => (
            <option key={tone.value} value={tone.value}>
              {tone.label}
            </option>
          ))}
        </select>
      </label>

      <label className="select-shell">
        <span>{copy.language}</span>
        <select
          value={state.language}
          onChange={(event) => setLanguage(event.target.value as LanguageCode)}
        >
          {LANGUAGES.map((language) => (
            <option key={language.code} value={language.code}>
              {language.short}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
