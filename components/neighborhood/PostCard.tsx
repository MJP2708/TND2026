"use client";

import { useState, useTransition } from "react";
import { Heart, MessageCircle, ChevronDown, ChevronUp, Send } from "lucide-react";

type User = { id: string; displayName?: string | null; name?: string | null; image?: string | null; streak?: number; level?: number };

type Comment = { id: string; content: string; createdAt: string | Date; user: User };

type Post = {
  id: string;
  content: string;
  type: string;
  createdAt: string | Date;
  user: User;
  likesCount: number;
  commentsCount: number;
  likedByMe: boolean;
  comments: Comment[];
};

type Props = { post: Post; currentUserId: string };

export function PostCard({ post }: Props) {
  const [liked, setLiked] = useState(post.likedByMe);
  const [likesCount, setLikesCount] = useState(post.likesCount);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState(post.comments);
  const [commentText, setCommentText] = useState("");
  const [isPending, startTransition] = useTransition();

  const userName = post.user.displayName ?? post.user.name ?? "User";
  const initials = userName.slice(0, 2).toUpperCase();
  const timeAgo = getTimeAgo(post.createdAt);

  function handleLike() {
    setLiked((l) => !l);
    setLikesCount((c) => liked ? c - 1 : c + 1);
    startTransition(async () => {
      await fetch(`/api/posts/${post.id}/like`, { method: "POST" });
    });
  }

  function handleComment(e: React.FormEvent) {
    e.preventDefault();
    const text = commentText.trim();
    if (!text) return;
    setCommentText("");
    startTransition(async () => {
      const res = await fetch(`/api/posts/${post.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text }),
      });
      if (res.ok) {
        const data = await res.json();
        setComments((prev) => [...prev, data.comment]);
      }
    });
  }

  const typeEmoji: Record<string, string> = {
    text: "💬",
    achievement: "🏆",
    mood: "💚",
    milestone: "🌟",
  };

  return (
    <div className="fv-card" style={{ marginBottom: 10 }}>
      {/* Author */}
      <div className="row between" style={{ marginBottom: 10 }}>
        <div className="row gap-8">
          <div style={{
            width: 36, height: 36, borderRadius: "50%",
            background: "linear-gradient(135deg, #5EA9FF, #3D8FE8)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "0.75rem", fontWeight: 800, color: "white", flexShrink: 0,
          }}>
            {initials}
          </div>
          <div>
            <p style={{ margin: 0, fontWeight: 800, fontSize: "0.82rem", color: "#1D2B53" }}>
              {userName}
              {(post.user.level ?? 0) > 0 && (
                <span style={{ marginLeft: 6, fontSize: "0.65rem", color: "#5EA9FF", fontWeight: 700 }}>
                  Lv.{post.user.level}
                </span>
              )}
            </p>
            <p style={{ margin: 0, fontSize: "0.68rem", color: "#6B7A99" }}>
              {(post.user.streak ?? 0) > 0 && `🔥${post.user.streak} · `}{timeAgo}
            </p>
          </div>
        </div>
        <span style={{ fontSize: "0.9rem" }}>{typeEmoji[post.type] ?? "💬"}</span>
      </div>

      {/* Content */}
      <p style={{ margin: "0 0 12px", fontSize: "0.88rem", color: "#1D2B53", lineHeight: 1.6 }}>
        {post.content}
      </p>

      {/* Actions */}
      <div className="row gap-16">
        <button
          onClick={handleLike}
          className="row gap-4"
          style={{ background: "none", border: "none", cursor: "pointer", color: liked ? "#FF7B7B" : "#6B7A99", fontFamily: "inherit", padding: 0 }}
        >
          <Heart size={16} fill={liked ? "#FF7B7B" : "none"} color={liked ? "#FF7B7B" : "#6B7A99"} />
          <span style={{ fontSize: "0.78rem", fontWeight: 700 }}>{likesCount}</span>
        </button>
        <button
          onClick={() => setShowComments((s) => !s)}
          className="row gap-4"
          style={{ background: "none", border: "none", cursor: "pointer", color: "#6B7A99", fontFamily: "inherit", padding: 0 }}
        >
          <MessageCircle size={16} />
          <span style={{ fontSize: "0.78rem", fontWeight: 700 }}>{comments.length}</span>
          {showComments ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>
      </div>

      {/* Comments */}
      {showComments && (
        <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid #EBF5FF" }}>
          <div className="stack gap-8" style={{ marginBottom: 10 }}>
            {comments.map((c) => (
              <div key={c.id} className="row gap-8" style={{ alignItems: "flex-start" }}>
                <div style={{
                  width: 24, height: 24, borderRadius: "50%",
                  background: "#EBF5FF",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "0.6rem", fontWeight: 800, color: "#5EA9FF", flexShrink: 0,
                }}>
                  {(c.user.displayName ?? c.user.name ?? "U").slice(0, 2).toUpperCase()}
                </div>
                <div style={{ background: "#F5FAFF", borderRadius: 10, padding: "6px 10px", flex: 1 }}>
                  <p style={{ margin: "0 0 2px", fontSize: "0.72rem", fontWeight: 700, color: "#1D2B53" }}>
                    {c.user.displayName ?? c.user.name}
                  </p>
                  <p style={{ margin: 0, fontSize: "0.78rem", color: "#6B7A99" }}>{c.content}</p>
                </div>
              </div>
            ))}
          </div>
          <form onSubmit={handleComment} className="row gap-8">
            <input
              className="fv-input"
              placeholder="Add a comment…"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              style={{ flex: 1, height: 36, fontSize: "0.8rem", padding: "0 12px" }}
            />
            <button
              type="submit"
              className="fv-btn fv-btn-primary fv-btn-sm"
              disabled={!commentText.trim() || isPending}
              style={{ height: 36, padding: "0 12px" }}
            >
              <Send size={14} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

function getTimeAgo(date: string | Date): string {
  const d = new Date(date);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}
