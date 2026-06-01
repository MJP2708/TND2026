"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { FVShell } from "@/components/focusville/FVShell";
import { Mascot } from "@/components/focusville/Mascot";
import { ChevronLeft, Send, Loader2 } from "lucide-react";
import { useStore } from "@/lib/store";

type Message = {
  id: string;
  content: string;
  createdAt: string;
  sender: { id: string; name?: string | null; displayName?: string | null };
};

export default function ChatPage({ params }: { params: { roomId: string } }) {
  const { state } = useStore();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const userId = state.userId;

  async function loadMessages() {
    try {
      const res = await fetch(`/api/chat/${params.roomId}/messages`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages ?? []);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMessages();
    // Poll every 5 seconds
    pollingRef.current = setInterval(loadMessages, 5000);
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.roomId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const msg = text.trim();
    if (!msg || sending) return;
    setText("");
    setSending(true);
    try {
      const res = await fetch(`/api/chat/${params.roomId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: msg }),
      });
      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [...prev, data.message]);
      }
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <FVShell hideNav>
        <div className="fv-loading"><Mascot size={60} mood="idle" float /></div>
      </FVShell>
    );
  }

  return (
    <FVShell hideNav>
      <div style={{ display: "flex", flexDirection: "column", height: "100dvh" }}>
        {/* Header */}
        <div style={{
          background: "white",
          padding: "12px 16px",
          borderBottom: "1px solid #D6E9FF",
          display: "flex",
          alignItems: "center",
          gap: 10,
          flexShrink: 0,
        }}>
          <button
            onClick={() => router.back()}
            className="fv-btn fv-btn-ghost fv-btn-sm"
            style={{ padding: "0 8px", height: 36 }}
          >
            <ChevronLeft size={18} />
          </button>
          <p style={{ margin: 0, fontWeight: 800, fontSize: "0.9rem", color: "#1D2B53" }}>Chat</p>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: 8 }}>
          {messages.length === 0 && (
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <Mascot size={60} mood="idle" />
              <p style={{ margin: "12px 0 0", color: "#6B7A99", fontSize: "0.82rem" }}>
                No messages yet. Say hi! 👋
              </p>
            </div>
          )}
          {messages.map((m) => {
            const isMe = m.sender.id === userId;
            const name = m.sender.displayName ?? m.sender.name ?? "User";
            return (
              <div key={m.id} style={{ display: "flex", justifyContent: isMe ? "flex-end" : "flex-start", gap: 8 }}>
                {!isMe && (
                  <div style={{
                    width: 28, height: 28, borderRadius: "50%",
                    background: "linear-gradient(135deg, #5EA9FF, #7EDC8A)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "0.6rem", fontWeight: 800, color: "white", flexShrink: 0, alignSelf: "flex-end",
                  }}>
                    {name.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div style={{ maxWidth: "75%" }}>
                  {!isMe && (
                    <p style={{ margin: "0 0 2px 4px", fontSize: "0.65rem", color: "#6B7A99", fontWeight: 600 }}>
                      {name}
                    </p>
                  )}
                  <div style={{
                    background: isMe ? "#5EA9FF" : "white",
                    color: isMe ? "white" : "#1D2B53",
                    border: isMe ? "none" : "1px solid #D6E9FF",
                    borderRadius: isMe ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                    padding: "8px 14px",
                    fontSize: "0.85rem",
                    lineHeight: 1.5,
                  }}>
                    {m.content}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <form
          onSubmit={handleSend}
          style={{
            padding: "10px 16px",
            borderTop: "1px solid #D6E9FF",
            background: "white",
            display: "flex",
            gap: 8,
            flexShrink: 0,
          }}
        >
          <input
            className="fv-input"
            placeholder="Type a message…"
            value={text}
            onChange={(e) => setText(e.target.value)}
            style={{ flex: 1 }}
          />
          <button
            type="submit"
            className="fv-btn fv-btn-primary"
            disabled={!text.trim() || sending}
            style={{ height: 44, padding: "0 14px" }}
          >
            {sending ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : <Send size={16} />}
          </button>
        </form>
      </div>
    </FVShell>
  );
}
