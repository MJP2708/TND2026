"use client";

type MascotMood = "happy" | "idle" | "tired" | "celebrate" | "thinking";

interface MascotProps {
  mood?: MascotMood;
  size?: number;
  float?: boolean;
  className?: string;
}

export function Mascot({ mood = "happy", size = 80, float = false, className = "" }: MascotProps) {
  const floatClass = float ? "fv-mascot-float" : "";

  const eyes = {
    happy:     { left: "M28,34 Q32,30 36,34", right: "M44,34 Q48,30 52,34", style: "curved" },
    idle:      { left: "M29,35 Q33,32 37,35", right: "M43,35 Q47,32 51,35", style: "curved" },
    tired:     { left: "M28,36 Q32,33 36,36", right: "M44,36 Q48,33 52,36", style: "flat" },
    celebrate: { left: "M28,32 Q32,27 36,32", right: "M44,32 Q48,27 52,32", style: "curved" },
    thinking:  { left: "M29,35 Q33,32 37,35", right: "M44,35 Q47,34 50,36", style: "curved" },
  };

  const mouths = {
    happy:     "M36,46 Q40,52 44,46",
    idle:      "M37,46 Q40,48 43,46",
    tired:     "M36,48 Q40,46 44,48",
    celebrate: "M34,44 Q40,54 46,44",
    thinking:  "M38,47 Q40,45 42,47",
  };

  const cheeks = mood === "happy" || mood === "celebrate";

  return (
    <div className={`${floatClass} ${className}`} style={{ display: "inline-block" }}>
      <svg
        width={size}
        height={size * 1.1}
        viewBox="0 0 80 88"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Shadow */}
        <ellipse cx="40" cy="86" rx="22" ry="5" fill="rgba(94,169,255,0.18)" />

        {/* Body - blue blob */}
        <path
          d="M12,48 C8,38 10,22 18,16 C26,10 32,8 40,8 C48,8 56,10 62,18 C68,26 68,36 66,46 C64,56 60,66 52,72 C44,78 36,78 28,72 C20,66 14,58 12,48 Z"
          fill="url(#bodyGrad)"
        />

        {/* Leaf sprout */}
        <path
          d="M40,8 C40,8 36,0 30,2 C24,4 26,10 30,10"
          fill="url(#leafGrad1)"
        />
        <path
          d="M40,8 C40,8 44,0 50,2 C56,4 54,10 50,10"
          fill="url(#leafGrad2)"
        />
        <line x1="40" y1="8" x2="40" y2="12" stroke="#5DC96B" strokeWidth="1.5" strokeLinecap="round" />

        {/* Eyes */}
        <path
          d={eyes[mood].left}
          stroke="#1D2B53"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d={eyes[mood].right}
          stroke="#1D2B53"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />

        {/* Tired eye half-lids */}
        {mood === "tired" && (
          <>
            <path d="M28,32 Q32,35 36,32" stroke="#1D2B53" strokeWidth="1.5" fill="none" opacity="0.4" />
            <path d="M44,32 Q48,35 52,32" stroke="#1D2B53" strokeWidth="1.5" fill="none" opacity="0.4" />
          </>
        )}

        {/* Cheeks */}
        {cheeks && (
          <>
            <ellipse cx="25" cy="46" rx="7" ry="5" fill="rgba(255,182,193,0.5)" />
            <ellipse cx="55" cy="46" rx="7" ry="5" fill="rgba(255,182,193,0.5)" />
          </>
        )}

        {/* Mouth */}
        <path
          d={mouths[mood]}
          stroke="#1D2B53"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />

        {/* Celebrate stars */}
        {mood === "celebrate" && (
          <>
            <text x="6" y="30" fontSize="10" opacity="0.8">✦</text>
            <text x="64" y="30" fontSize="10" opacity="0.8">✦</text>
            <text x="60" y="20" fontSize="8" opacity="0.6">⭐</text>
          </>
        )}

        <defs>
          <radialGradient id="bodyGrad" cx="40%" cy="35%" r="60%">
            <stop offset="0%" stopColor="#A8D4FF" />
            <stop offset="50%" stopColor="#5EA9FF" />
            <stop offset="100%" stopColor="#3A8FE8" />
          </radialGradient>
          <linearGradient id="leafGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#A8E6B4" />
            <stop offset="100%" stopColor="#5DC96B" />
          </linearGradient>
          <linearGradient id="leafGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#A8E6B4" />
            <stop offset="100%" stopColor="#5DC96B" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}
