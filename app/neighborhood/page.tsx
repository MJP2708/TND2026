"use client";

import { useState, useTransition, useEffect, useCallback } from "react";
import { FVShell } from "@/components/focusville/FVShell";
import { Users, Heart, MessageCircle, ChevronDown, ChevronUp, Send, Plus, X, Lock } from "lucide-react";
import {
  getNeighborhoodPosts,
  createNeighborhoodPost,
  likeNeighborhoodPost,
  addNeighborhoodReply,
} from "@/lib/actions/neighborhood";
import { fvToast } from "@/lib/toast";
import Link from "next/link";

type Reply = {
  id: string;
  content: string;
  anonymousName: string;
  createdAt: Date;
};

type Post = {
  id: string;
  content: string;
  goalTag: string | null;
  anonymousName: string;
  likesCount: number;
  likedByMe: boolean;
  repliesCount: number;
  replies: Reply[];
  createdAt: Date;
};

type GoalTag = "study" | "health" | "work" | "personal";

const TAG_LABELS: Record<GoalTag, string> = {
  study: "📚 Study",
  health: "💪 Health",
  work: "💼 Work",
  personal: "🌱 Personal",
};

function timeAgo(date: Date | string) {
  const d = new Date(date);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function PostCard({ post, onLike }: { post: Post; onLike: (id: string) => void }) {
  const [liked, setLiked] = useState(post.likedByMe);
  const [likesCount, setLikesCount] = useState(post.likesCount);
  const [showReplies, setShowReplies] = useState(false);
  const [replies, setReplies] = useState<Reply[]>(post.replies);
  const [replyText, setReplyText] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleLike() {
    setLiked((l) => !l);
    setLikesCount((c) => (liked ? c - 1 : c + 1));
    onLike(post.id);
  }

  function handleReply(e: React.FormEvent) {
    e.preventDefault();
    const text = replyText.trim();
    if (!text) return;
    setReplyText("");
    startTransition(async () => {
      const result = await addNeighborhoodReply(post.id, text);
      if ("success" in result && result.success && result.reply) {
        setReplies((prev) => [...prev, result.reply as Reply]);
      } else if ("error" in result) {
        fvToast.error(result.error ?? "Failed to reply");
      }
    });
  }

  const emojiLetter = post.anonymousName[0] ?? "?";

  return (
    <div className="fv-card" style={{ marginBottom: 10 }}>
      <div className="row between" style={{ marginBottom: 10 }}>
        <div className="row gap-8">
          <div style={{
            width: 36, height: 36, borderRadius: "50%",
            background: "linear-gradient(135deg, #A78BFA, #7C3AED)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "0.85rem", fontWeight: 800, color: "white", flexShrink: 0,
          }}>
            {emojiLetter}
          </div>
          <div>
            <p style={{ margin: 0, fontWeight: 800, fontSize: "0.82rem", color: "#1D2B53" }}>
              {post.anonymousName}
            </p>
            <p style={{ margin: 0, fontSize: "0.68rem", color: "#6B7A99" }}>
              {timeAgo(post.createdAt)}
              {post.goalTag && (
                <span style={{ marginLeft: 6, fontWeight: 700, color: "#A78BFA" }}>
                  · {TAG_LABELS[post.goalTag as GoalTag] ?? post.goalTag}
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      <p style={{ margin: "0 0 12px", fontSize: "0.88rem", color: "#1D2B53", lineHeight: 1.6 }}>
        {post.content}
      </p>

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
          onClick={() => setShowReplies((s) => !s)}
          className="row gap-4"
          style={{ background: "none", border: "none", cursor: "pointer", color: "#6B7A99", fontFamily: "inherit", padding: 0 }}
        >
          <MessageCircle size={16} />
          <span style={{ fontSize: "0.78rem", fontWeight: 700 }}>{replies.length}</span>
          {showReplies ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>
      </div>

      {showReplies && (
        <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid #EBF5FF" }}>
          <div className="stack gap-8" style={{ marginBottom: 10 }}>
            {replies.map((r) => (
              <div key={r.id} className="row gap-8" style={{ alignItems: "flex-start" }}>
                <div style={{
                  width: 24, height: 24, borderRadius: "50%",
                  background: "#F3E8FF",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "0.6rem", fontWeight: 800, color: "#7C3AED", flexShrink: 0,
                }}>
                  {r.anonymousName[0]}
                </div>
                <div style={{ background: "#F5F0FF", borderRadius: 10, padding: "6px 10px", flex: 1 }}>
                  <p style={{ margin: "0 0 2px", fontSize: "0.72rem", fontWeight: 700, color: "#1D2B53" }}>
                    {r.anonymousName}
                  </p>
                  <p style={{ margin: 0, fontSize: "0.78rem", color: "#6B7A99" }}>{r.content}</p>
                </div>
              </div>
            ))}
          </div>
          <form onSubmit={handleReply} className="row gap-8">
            <input
              className="fv-input"
              placeholder="Reply anonymously…"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              style={{ flex: 1, height: 36, fontSize: "0.8rem", padding: "0 12px" }}
            />
            <button
              type="submit"
              className="fv-btn fv-btn-primary fv-btn-sm"
              disabled={!replyText.trim() || isPending}
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

export default function NeighborhoodPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [filterTag, setFilterTag] = useState<GoalTag | null>(null);
  const [showCompose, setShowCompose] = useState(false);
  const [composeText, setComposeText] = useState("");
  const [composeTag, setComposeTag] = useState<GoalTag | null>(null);
  const [isPro, setIsPro] = useState<boolean | null>(null);
  const [isPending, startTransition] = useTransition();

  const loadPosts = useCallback((tag?: GoalTag | null) => {
    startTransition(async () => {
      const data = await getNeighborhoodPosts(tag ?? undefined);
      setPosts(data as Post[]);
    });
  }, []);

  useEffect(() => {
    loadPosts(filterTag);
  }, [filterTag, loadPosts]);

  function handleLike(postId: string) {
    likeNeighborhoodPost(postId).catch(() => {});
  }

  function handlePost() {
    if (!composeText.trim()) return;
    startTransition(async () => {
      const result = await createNeighborhoodPost({
        content: composeText.trim(),
        goalTag: composeTag ?? undefined,
      });
      if (result.success) {
        fvToast.success("Posted anonymously!");
        setComposeText("");
        setComposeTag(null);
        setShowCompose(false);
        setIsPro(true);
        loadPosts(filterTag);
      } else if (result.error === "pro_required") {
        setIsPro(false);
        setShowCompose(false);
      } else {
        fvToast.error(result.error ?? "Failed to post");
      }
    });
  }

  return (
    <FVShell>
      <div style={{ padding: "0 0 20px" }}>
        {/* Header */}
        <div style={{
          background: "linear-gradient(135deg, #F3E8FF, #E9D5FF)",
          padding: "18px 20px 14px",
          borderBottom: "1px solid #DDD6FE",
        }}>
          <div className="row between" style={{ marginBottom: 4 }}>
            <div className="row gap-8">
              <Users size={20} color="#7C3AED" />
              <h1 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 900, color: "#1D2B53" }}>
                Anonymous Neighborhood
              </h1>
            </div>
          </div>
          <p style={{ margin: "0 0 12px", fontSize: "0.75rem", color: "#6B7A99" }}>
            A space for people building their goals — no names, just progress
          </p>

          {/* Tag filter */}
          <div className="fv-scroll-tabs">
            <button
              className={`fv-scroll-tab ${filterTag === null ? "active" : ""}`}
              onClick={() => setFilterTag(null)}
            >
              All
            </button>
            {(Object.entries(TAG_LABELS) as [GoalTag, string][]).map(([tag, label]) => (
              <button
                key={tag}
                className={`fv-scroll-tab ${filterTag === tag ? "active" : ""}`}
                onClick={() => setFilterTag(tag)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ padding: "16px 20px" }}>
          {/* Pro gate banner */}
          {isPro === false && (
            <div style={{
              borderRadius: 16,
              border: "2px solid #DDD6FE",
              background: "linear-gradient(135deg, #F3E8FF, #EDE9FE)",
              padding: "16px",
              marginBottom: 16,
              textAlign: "center",
            }}>
              <Lock size={24} color="#7C3AED" style={{ marginBottom: 6 }} />
              <p style={{ margin: "0 0 4px", fontWeight: 800, color: "#1D2B53" }}>Pro Feature</p>
              <p style={{ margin: "0 0 12px", fontSize: "0.78rem", color: "#6B7A99" }}>
                Posting in the Neighborhood requires a Pro plan. Free users can read and like.
              </p>
              <Link
                href="/pricing"
                style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  background: "#7C3AED", color: "white", borderRadius: 12,
                  padding: "8px 20px", fontSize: "0.82rem", fontWeight: 700,
                  textDecoration: "none",
                }}
              >
                ⭐ Upgrade to Pro — 149 ฿/mo
              </Link>
            </div>
          )}

          {/* Compose box */}
          {showCompose ? (
            <div className="fv-card animate-fade-up" style={{ marginBottom: 16, border: "1px solid #DDD6FE" }}>
              <div className="row between" style={{ marginBottom: 10 }}>
                <p style={{ margin: 0, fontWeight: 800, fontSize: "0.85rem", color: "#1D2B53" }}>
                  Share anonymously
                </p>
                <button
                  onClick={() => setShowCompose(false)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "#6B7A99" }}
                >
                  <X size={16} />
                </button>
              </div>

              {/* Tag selector */}
              <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
                {(Object.entries(TAG_LABELS) as [GoalTag, string][]).map(([tag, label]) => (
                  <button
                    key={tag}
                    onClick={() => setComposeTag((t) => t === tag ? null : tag)}
                    className="fv-btn fv-btn-sm"
                    style={{
                      background: composeTag === tag ? "#7C3AED" : "white",
                      color: composeTag === tag ? "white" : "#6B7A99",
                      border: `1px solid ${composeTag === tag ? "#7C3AED" : "#DDD6FE"}`,
                      fontSize: "0.7rem",
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <textarea
                className="fv-textarea"
                rows={3}
                placeholder="Share what you're working on, a win, or a struggle…"
                value={composeText}
                onChange={(e) => setComposeText(e.target.value)}
                maxLength={500}
                style={{ minHeight: 80, marginBottom: 8 }}
              />
              <div className="row between">
                <span style={{ fontSize: "0.68rem", color: "#6B7A99" }}>{composeText.length}/500</span>
                <button
                  className="fv-btn fv-btn-primary fv-btn-sm"
                  disabled={!composeText.trim() || isPending}
                  onClick={handlePost}
                >
                  {isPending ? "Posting…" : "Post anonymously"}
                </button>
              </div>
            </div>
          ) : (
            <button
              className="fv-btn fv-btn-full"
              style={{
                marginBottom: 16,
                background: "white",
                border: "1px dashed #DDD6FE",
                color: "#6B7A99",
                gap: 8,
                justifyContent: "flex-start",
                padding: "12px 16px",
                borderRadius: 14,
              }}
              onClick={() => setShowCompose(true)}
            >
              <Plus size={16} />
              Share something anonymously…
            </button>
          )}

          {/* Posts feed */}
          {isPending ? (
            <div className="stack gap-10">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} style={{ height: 100, borderRadius: 14, background: "#F3E8FF", animation: "pulse 1.5s ease-in-out infinite", animationDelay: `${i * 150}ms` }} />
              ))}
              <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
            </div>
          ) : posts.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <div style={{ fontSize: "2.5rem", marginBottom: 8 }}>🏘</div>
              <p style={{ margin: 0, fontWeight: 700, color: "#1D2B53" }}>No posts yet</p>
              <p style={{ margin: "4px 0 0", fontSize: "0.78rem", color: "#6B7A99" }}>
                Be the first to share something in this neighborhood
              </p>
            </div>
          ) : (
            posts.map((post) => (
              <PostCard key={post.id} post={post} onLike={handleLike} />
            ))
          )}
        </div>
      </div>
    </FVShell>
  );
}
