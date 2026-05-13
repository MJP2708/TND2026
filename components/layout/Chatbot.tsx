"use client";

import { useMemo, useState } from "react";
import { getCopy } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import type { AppState } from "@/lib/types";

type Message = {
  from: "bot" | "user";
  text: string;
};

function makeReply(input: string, state: AppState) {
  const text = input.toLowerCase();
  const nextTask = state.tasks.find((task) => task.status !== "completed" && !task.isRecovery);

  if (text.includes("next") || text.includes("task") || text.includes("start")) {
    return nextTask
      ? `Start with "${nextTask.title}". Set a ${Math.min(nextTask.minutes, 25)} minute timer and stop after one clean pass.`
      : "You are clear for today. A reset, walk, or review is the right next move.";
  }

  if (text.includes("tired") || text.includes("stress") || text.includes("hard")) {
    return "Lower the bar for ten minutes: open the material, choose one tiny action, and count that as momentum.";
  }

  if (text.includes("plan") || text.includes("goal")) {
    return state.goal
      ? `Your current goal is "${state.goal.title}". Keep the layout, but make today smaller: one focus block, one recovery break, one quick review.`
      : "Add one clear goal first. A good goal has a deadline, a daily time budget, and a reason you actually care about.";
  }

  return nextTask
    ? `I would protect your energy and do "${nextTask.title}" next. You can make it easier by only committing to the first five minutes.`
    : "You have no active task waiting. Use the win: reflect, rest, or set tomorrow up.";
}

export function Chatbot() {
  const { state } = useStore();
  const copy = getCopy(state.language);
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    { from: "bot", text: copy.chatbotGreeting },
  ]);

  const unread = useMemo(() => !open && messages[messages.length - 1]?.from === "bot", [messages, open]);

  function send() {
    const trimmed = input.trim();
    if (!trimmed) return;
    setMessages((current) => [
      ...current,
      { from: "user", text: trimmed },
      { from: "bot", text: makeReply(trimmed, state) },
    ]);
    setInput("");
  }

  return (
    <div className={`chatbot ${open ? "open" : ""}`}>
      {open && (
        <section className="chatbot-panel" aria-label={copy.chatbotTitle}>
          <div className="chatbot-header">
            <div>
              <strong>{copy.chatbotTitle}</strong>
              <p>{copy.chatbotPrompt}</p>
            </div>
            <button className="icon-button" type="button" onClick={() => setOpen(false)} aria-label="Close">
              x
            </button>
          </div>
          <div className="chatbot-messages">
            {messages.map((message, index) => (
              <div key={`${message.from}-${index}`} className={`chat-bubble ${message.from}`}>
                {message.text}
              </div>
            ))}
          </div>
          <form
            className="chatbot-input"
            onSubmit={(event) => {
              event.preventDefault();
              send();
            }}
          >
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder={copy.chatbotPlaceholder}
            />
            <button type="submit">{copy.chatbotSend}</button>
          </form>
        </section>
      )}
      <button className="chatbot-fab" type="button" onClick={() => setOpen((value) => !value)}>
        <span className="coach-mark" />
        <span>{copy.chatbotTitle}</span>
        {unread && <i />}
      </button>
    </div>
  );
}
