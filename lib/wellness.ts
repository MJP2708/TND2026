import type { AppState, MoodTone } from "./types";

export function inferMood(answers: string[]): MoodTone {
  const text = answers.join(" ").toLowerCase();
  if (text.includes("overwhelmed") || text.includes("too much") || text.includes("panic")) return "overloaded";
  if (text.includes("tired") || text.includes("low") || text.includes("drained")) return "tired";
  if (text.includes("rested") || text.includes("clear")) return "rested";
  return "steady";
}

export function getMoodMessage(tone: MoodTone) {
  const messages = {
    rested: "Today looks clearer than usual. A focused but humane plan should fit.",
    steady: "Today feels workable. Keep the plan simple and protect your recovery gaps.",
    tired: "วันนี้คุณน่าจะรู้สึกเหนื่อยสะสม",
    overloaded: "วันนี้อาจเป็นวันที่คุณต้องลดภาระงานลง",
  };
  return messages[tone];
}

export function getBurnoutRisk(state: AppState) {
  const recent = state.moods.slice(-4);
  const heavyMoodCount = recent.filter((m) => m.tone === "tired" || m.tone === "overloaded").length;
  const todayLoad = state.tasks.filter((task) => task.day === new Date().toISOString().slice(0, 10)).length;
  const risk = heavyMoodCount >= 2 && todayLoad >= 3 ? "high" : heavyMoodCount >= 1 ? "medium" : "low";

  return {
    risk,
    message:
      risk === "high"
        ? "ช่วงนี้เหนื่อยเหรอ หลายคนก็หมดไฟช่วงสอบนะ"
        : risk === "medium"
          ? "การพักก็เป็นส่วนหนึ่งของความสำเร็จนะ"
          : "Your recent pattern looks steady. Keep the small wins visible.",
    suggestion: risk === "high" ? "วันนี้ลองทำแค่ 3 งานก็พอ" : "Keep one real recovery gap after deep work.",
  };
}

