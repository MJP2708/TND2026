"use client";

import { useState, useEffect, useTransition, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { useStore } from "@/lib/store";
import { FVShell } from "@/components/focusville/FVShell";
import { Mascot } from "@/components/focusville/Mascot";
import { CityGrid } from "@/components/city/CityGrid";
import { PostCard } from "@/components/neighborhood/PostCard";
import { createPost, getOrCreateDM } from "@/lib/actions/posts";
import {
  Search, Send, MessageCircle, UserPlus, X, Loader2,
  MapPin, Rss, ChevronLeft,
} from "lucide-react";

type MainTab = "city" | "neighborhood";
type NeighborhoodTab = "feed" | "map" | "chat" | "search";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

// ── Day/Night helpers ─────────────────────────────────────────────────────────

function getDayPhase() {
  const h = new Date().getHours();
  if (h >= 6  && h < 9)  return { label: "🌅 Dawn",     sky: "linear-gradient(180deg,#FFB347 0%,#FFD580 40%,#FFEEB5 100%)", ambient: "rgba(255,180,80,0.15)" };
  if (h >= 9  && h < 17) return { label: "☀️ Day",      sky: "linear-gradient(180deg,#87CEEB 0%,#B8E4FF 45%,#D4F4C8 100%)", ambient: "rgba(255,255,255,0)"    };
  if (h >= 17 && h < 20) return { label: "🌇 Dusk",     sky: "linear-gradient(180deg,#FF7043 0%,#FFA07A 40%,#FFD4B0 100%)", ambient: "rgba(255,100,50,0.2)"   };
  return                        { label: "🌙 Night",     sky: "linear-gradient(180deg,#1A237E 0%,#283593 40%,#3949AB 100%)", ambient: "rgba(20,30,100,0.6)"    };
}

const NPC_MESSAGES = [
  "You focused a lot today! 💪",
  "The city is growing! 🏙",
  "Keep up the streak! 🔥",
  "Looking productive! ⚡",
  "The library is buzzing! 📚",
  "Great energy today! ✨",
];

function CityNPCs({ count }: { count: number }) {
  const npcs = Array.from({ length: Math.min(count + 2, 6) }, (_, i) => ({
    id: i,
    x: 10 + (i * 16) % 80,
    y: 55 + (i % 3) * 12,
    color: ["#5EA9FF", "#7EDC8A", "#FFD45E", "#FF7B7B", "#A78BFA", "#FFAD5E"][i % 6],
    delay: i * 0.8,
    message: i === 0 ? NPC_MESSAGES[Math.floor(Date.now() / 60000) % NPC_MESSAGES.length] : null,
  }));

  return (
    <>
      {npcs.map((npc) => (
        <div key={npc.id} style={{
          position: "absolute",
          left: `${npc.x}%`,
          bottom: `${npc.y - 30}px`,
          animation: `npc-walk 6s ${npc.delay}s ease-in-out infinite`,
        }}>
          {npc.message && (
            <div style={{
              position: "absolute",
              bottom: "100%",
              left: "50%",
              transform: "translateX(-50%)",
              background: "white",
              border: "1px solid #D6E9FF",
              borderRadius: 8,
              padding: "3px 7px",
              fontSize: "0.52rem",
              fontWeight: 700,
              color: "#1D2B53",
              whiteSpace: "nowrap",
              marginBottom: 4,
              boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
              animation: "speech-pop 4s 1s ease forwards",
            }}>
              {npc.message}
            </div>
          )}
          <div style={{
            width: 14,
            height: 14,
            borderRadius: "50%",
            background: npc.color,
            border: "2px solid white",
            boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
          }} />
        </div>
      ))}
    </>
  );
}

// ── City tab ──────────────────────────────────────────────────────────────────

function CityTab() {
  const { state, patch } = useStore();
  const { data: cityData, mutate: mutateCity } = useSWR("/api/user/state", fetcher, { refreshInterval: 0 });

  const buildings  = cityData?.city?.buildings ?? [];
  const placed     = buildings.filter((b: { x: number }) => b.x >= 0).length;
  const gold       = cityData?.user?.gold ?? state.gold;
  const dayPhase   = getDayPhase();

  // City happiness: based on buildings placed (0-100)
  const happiness  = Math.min(100, placed * 14);
  const happyLabel = happiness >= 80 ? "🎉 Thriving!" : happiness >= 50 ? "😊 Happy" : happiness >= 20 ? "😐 Growing" : "🌱 New city";

  function handleCityUpdate() {
    mutateCity();
    fetch("/api/user/state").then((r) => r.json()).then((d) => {
      if (d.user) patch((s) => ({ ...s, gold: d.user.gold }));
    });
  }

  return (
    <div>
      {/* City header */}
      <div style={{
        padding: "12px 20px",
        borderBottom: "1px solid #D6E9FF",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}>
        <div>
          <p style={{ margin: 0, fontWeight: 900, fontSize: "1rem", color: "#1D2B53" }}>
            {cityData?.city?.name ?? "My City"}
            <span style={{ marginLeft: 6, fontSize: "0.72rem", fontWeight: 600, color: "#6B7A99" }}>{dayPhase.label}</span>
          </p>
          <p style={{ margin: 0, fontSize: "0.72rem", color: "#6B7A99" }}>
            {placed} buildings · {happyLabel}
          </p>
        </div>
        <div className="fv-gold"><span>🪙</span><span>{gold.toLocaleString()}</span></div>
      </div>

      {/* City happiness bar */}
      <div style={{ padding: "8px 20px 0" }}>
        <div className="row between" style={{ marginBottom: 3 }}>
          <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "#6B7A99" }}>City Happiness</span>
          <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "#1D2B53" }}>{happiness}%</span>
        </div>
        <div style={{ height: 5, background: "#EBF5FF", borderRadius: 999, overflow: "hidden", marginBottom: 8 }}>
          <div style={{
            height: "100%",
            width: `${happiness}%`,
            background: "linear-gradient(90deg, #7EDC8A, #5EA9FF)",
            borderRadius: 999,
            transition: "width 800ms ease",
          }} />
        </div>
      </div>

      {/* Living city preview */}
      <div style={{ position: "relative", margin: "0 16px 0" }}>
        <div style={{
          background: dayPhase.sky,
          borderRadius: 20,
          height: 160,
          position: "relative",
          overflow: "hidden",
          marginBottom: 0,
        }}>
          {/* Day/night ambient overlay */}
          <div style={{
            position: "absolute",
            inset: 0,
            background: dayPhase.ambient,
            borderRadius: 20,
            zIndex: 2,
            pointerEvents: "none",
          }} />

          {/* Stars at night */}
          {dayPhase.label.includes("Night") && [
            { x: 15, y: 12 }, { x: 35, y: 8 }, { x: 55, y: 15 }, { x: 75, y: 10 }, { x: 88, y: 18 },
          ].map((s, i) => (
            <div key={i} style={{
              position: "absolute",
              left: `${s.x}%`,
              top: `${s.y}%`,
              width: 3,
              height: 3,
              background: "white",
              borderRadius: "50%",
              opacity: 0.8,
              animation: `twinkle ${1.5 + i * 0.3}s ease-in-out infinite`,
              zIndex: 1,
            }} />
          ))}

          {/* Ground */}
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 32, background: "#A8D98A", zIndex: 1 }} />

          {/* Building silhouettes (scale with placed count) */}
          {[
            { l: "5%",  w: 44, h: 65,  c: "#8EC5FF" },
            { l: "18%", w: 36, h: 50,  c: "#7EDC8A" },
            { l: "30%", w: 56, h: 88,  c: "#5EA9FF" },
            { l: "48%", w: 40, h: 60,  c: "#FFAD5E" },
            { l: "62%", w: 50, h: 78,  c: "#A78BFA" },
            { l: "76%", w: 34, h: 48,  c: "#FFD45E" },
            { l: "87%", w: 44, h: 62,  c: "#FF7B7B" },
          ].slice(0, Math.max(2, Math.min(7, placed + 2))).map((b, i) => (
            <div key={i} style={{
              position: "absolute",
              bottom: 28,
              left: b.l,
              width: b.w,
              height: b.h + (placed * 3),
              background: dayPhase.label.includes("Night") ? `${b.c}99` : b.c,
              borderRadius: "6px 6px 0 0",
              opacity: 0.85,
              zIndex: 1,
            }}>
              {/* Window lights at night */}
              {dayPhase.label.includes("Night") && (
                <div style={{ padding: "8px 6px", display: "flex", flexWrap: "wrap", gap: 3 }}>
                  {Array.from({ length: 4 }).map((_, wi) => (
                    <div key={wi} style={{ width: 4, height: 4, background: "#FFD45E", borderRadius: 1, opacity: Math.random() > 0.3 ? 0.9 : 0 }} />
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* NPCs */}
          <CityNPCs count={placed} />
        </div>
      </div>

      <CityGrid buildings={buildings} onUpdate={handleCityUpdate} gold={gold} />

      {/* CTA to shop */}
      <div style={{ padding: "0 16px" }}>
        <div className="fv-card" style={{ background: "linear-gradient(135deg, #EBF5FF, #DDEEFF)", textAlign: "center", padding: "16px 20px" }}>
          <p style={{ margin: "0 0 8px", fontWeight: 800, fontSize: "0.88rem", color: "#1D2B53" }}>
            Grow your city!
          </p>
          <p style={{ margin: "0 0 12px", fontSize: "0.78rem", color: "#6B7A99" }}>
            Earn gold by focusing and buy buildings in the Shop.
          </p>
          <a href="/rewards" className="fv-btn fv-btn-primary fv-btn-sm" style={{ display: "inline-flex", gap: 6, padding: "0 16px", height: 36, textDecoration: "none" }}>
            🛍 Go to Shop
          </a>
        </div>
      </div>
    </div>
  );
}

// ── Neighborhood tab ──────────────────────────────────────────────────────────

function FeedSection({ userId }: { userId: string }) {
  const [page, setPage] = useState(0);
  const [allPosts, setAllPosts] = useState<any[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [postText, setPostText] = useState("");
  const [posting, startPosting] = useTransition();

  async function loadMore() {
    if (loading || !hasMore) return;
    setLoading(true);
    const res = await fetch(`/api/posts?page=${page}`);
    const data = await res.json();
    setAllPosts((prev) => page === 0 ? data.posts : [...prev, ...data.posts]);
    setHasMore(data.hasMore);
    setPage((p) => p + 1);
    setLoading(false);
  }

  useEffect(() => { loadMore(); }, []);

  async function handlePost(e: React.FormEvent) {
    e.preventDefault();
    if (!postText.trim()) return;
    const fd = new FormData();
    fd.append("content", postText.trim());
    startPosting(async () => {
      const result = await createPost(fd);
      if (result.success) {
        setPostText("");
        setPage(0);
        setAllPosts([]);
        setHasMore(true);
        const res = await fetch("/api/posts?page=0");
        const data = await res.json();
        setAllPosts(data.posts);
        setHasMore(data.hasMore);
        setPage(1);
      }
    });
  }

  return (
    <div style={{ padding: "12px 16px" }}>
      {/* Create post */}
      <form onSubmit={handlePost} style={{ marginBottom: 14 }}>
        <div className="fv-card" style={{ padding: "10px 12px" }}>
          <textarea
            className="fv-textarea"
            placeholder="Share your progress, a win, or a thought… 🌟"
            value={postText}
            onChange={(e) => setPostText(e.target.value)}
            rows={2}
            style={{ minHeight: 60, marginBottom: 8, fontSize: "0.85rem" }}
          />
          <div className="row between">
            <span style={{ fontSize: "0.72rem", color: "#6B7A99" }}>{postText.length}/500</span>
            <button
              type="submit"
              className="fv-btn fv-btn-primary fv-btn-sm"
              disabled={!postText.trim() || postText.length > 500 || posting}
              style={{ height: 32, padding: "0 14px", gap: 5 }}
            >
              <Send size={13} /> Post
            </button>
          </div>
        </div>
      </form>

      {/* Posts */}
      {allPosts.length === 0 && !loading && (
        <div style={{ textAlign: "center", padding: "40px 20px" }}>
          <Mascot size={60} mood="idle" />
          <p style={{ margin: "12px 0 0", color: "#6B7A99", fontSize: "0.85rem" }}>
            No posts yet. Be the first to share! 🎉
          </p>
        </div>
      )}

      {allPosts.map((post) => (
        <PostCard key={post.id} post={post} currentUserId={userId} />
      ))}

      {hasMore && (
        <button
          className="fv-btn fv-btn-ghost fv-btn-full"
          onClick={loadMore}
          disabled={loading}
          style={{ marginTop: 8 }}
        >
          {loading ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : "Load more"}
        </button>
      )}
    </div>
  );
}

function MapSection() {
  const { data, isLoading } = useSWR("/api/search?q=a", fetcher);
  const users = data?.users ?? [];

  return (
    <div style={{ padding: "12px 16px" }}>
      <div style={{
        background: "linear-gradient(180deg, #B8E4FF 0%, #D4EEFF 45%, #C8EBB5 75%, #A8D98A 100%)",
        borderRadius: 20,
        height: 180,
        position: "relative",
        overflow: "hidden",
        marginBottom: 16,
      }}>
        {users.slice(0, 6).map((u: any, i: number) => (
          <div key={u.id} style={{
            position: "absolute",
            left: `${15 + (i % 3) * 30}%`,
            top: `${20 + Math.floor(i / 3) * 45}%`,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 2,
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: "50%",
              background: `hsl(${(i * 60) % 360}, 70%, 65%)`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "0.7rem", fontWeight: 800, color: "white",
              border: "2px solid white",
            }}>
              {(u.displayName ?? u.name ?? "U").slice(0, 2).toUpperCase()}
            </div>
            <span style={{ fontSize: "0.55rem", fontWeight: 700, color: "#1D2B53", background: "rgba(255,255,255,0.8)", borderRadius: 4, padding: "1px 4px" }}>
              🔥{u.streak}
            </span>
          </div>
        ))}
        {users.length === 0 && (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Mascot size={50} mood="idle" float />
          </div>
        )}
      </div>

      <div className="stack gap-8">
        {users.map((u: any) => (
          <NeighborCard key={u.id} user={u} />
        ))}
        {users.length === 0 && (
          <p style={{ margin: 0, textAlign: "center", color: "#6B7A99", fontSize: "0.82rem" }}>
            No neighbors yet. Invite friends!
          </p>
        )}
      </div>
    </div>
  );
}

function NeighborCard({ user }: { user: any }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const name = user.displayName ?? user.name ?? "User";

  function handleChat() {
    startTransition(async () => {
      const result = await getOrCreateDM(user.id);
      if (result.roomId) router.push(`/chat/${result.roomId}`);
    });
  }

  return (
    <div className="fv-card" style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px" }}>
      <div style={{
        width: 40, height: 40, borderRadius: "50%",
        background: "linear-gradient(135deg, #5EA9FF, #7EDC8A)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "0.78rem", fontWeight: 800, color: "white", flexShrink: 0,
      }}>
        {name.slice(0, 2).toUpperCase()}
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ margin: 0, fontWeight: 800, fontSize: "0.85rem", color: "#1D2B53" }}>{name}</p>
        <p style={{ margin: "1px 0 0", fontSize: "0.7rem", color: "#6B7A99" }}>
          🔥{user.streak} · Lv.{user.level} · {Math.round((user.focusMinutes ?? 0) / 60)}h focus
        </p>
      </div>
      <button
        onClick={handleChat}
        className="fv-btn fv-btn-secondary fv-btn-sm"
        style={{ height: 32, padding: "0 10px", gap: 4 }}
        disabled={isPending}
      >
        <MessageCircle size={13} /> Chat
      </button>
    </div>
  );
}

function SearchSection() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 400);
    return () => clearTimeout(t);
  }, [query]);

  const { data, isLoading } = useSWR(
    debouncedQuery.length >= 2 ? `/api/search?q=${encodeURIComponent(debouncedQuery)}` : null,
    fetcher
  );

  return (
    <div style={{ padding: "12px 16px" }}>
      <div style={{ position: "relative", marginBottom: 14 }}>
        <Search size={16} color="#6B7A99" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
        <input
          className="fv-input"
          placeholder="Search users or posts…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ paddingLeft: 36 }}
        />
      </div>

      {isLoading && (
        <div style={{ textAlign: "center", padding: 20 }}>
          <Loader2 size={24} color="#5EA9FF" style={{ animation: "spin 1s linear infinite" }} />
        </div>
      )}

      {data && (
        <>
          {data.users?.length > 0 && (
            <>
              <p style={{ margin: "0 0 8px", fontWeight: 800, fontSize: "0.78rem", color: "#1D2B53" }}>Users</p>
              <div className="stack gap-8" style={{ marginBottom: 14 }}>
                {data.users.map((u: any) => <NeighborCard key={u.id} user={u} />)}
              </div>
            </>
          )}
          {data.posts?.length > 0 && (
            <>
              <p style={{ margin: "0 0 8px", fontWeight: 800, fontSize: "0.78rem", color: "#1D2B53" }}>Posts</p>
              {data.posts.map((p: any) => (
                <div key={p.id} className="fv-card" style={{ marginBottom: 8 }}>
                  <p style={{ margin: "0 0 4px", fontSize: "0.78rem", fontWeight: 700, color: "#5EA9FF" }}>
                    {p.user.displayName ?? p.user.name}
                  </p>
                  <p style={{ margin: 0, fontSize: "0.82rem", color: "#1D2B53" }}>{p.content}</p>
                </div>
              ))}
            </>
          )}
          {data.users?.length === 0 && data.posts?.length === 0 && debouncedQuery.length >= 2 && (
            <p style={{ textAlign: "center", color: "#6B7A99", fontSize: "0.82rem", padding: "20px 0" }}>
              No results for &ldquo;{debouncedQuery}&rdquo;
            </p>
          )}
        </>
      )}

      {debouncedQuery.length < 2 && !isLoading && (
        <p style={{ textAlign: "center", color: "#6B7A99", fontSize: "0.82rem", padding: "20px 0" }}>
          Type at least 2 characters to search
        </p>
      )}
    </div>
  );
}

function ChatListSection({ userId }: { userId: string }) {
  const router = useRouter();
  const { data, isLoading } = useSWR("/api/user/state", fetcher);

  return (
    <div style={{ padding: "12px 16px" }}>
      <p style={{ margin: "0 0 12px", fontWeight: 800, fontSize: "0.85rem", color: "#1D2B53" }}>
        Your Chats
      </p>
      <div style={{ textAlign: "center", padding: "30px 0" }}>
        <MessageCircle size={40} color="#D6E9FF" style={{ marginBottom: 10 }} />
        <p style={{ margin: 0, color: "#6B7A99", fontSize: "0.82rem" }}>
          Visit a neighbor&apos;s profile and tap Chat to start a conversation!
        </p>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function CommunityPage() {
  const { state } = useStore();
  const [mainTab, setMainTab] = useState<MainTab>("city");
  const [neighTab, setNeighTab] = useState<NeighborhoodTab>("feed");

  const userId = state.userId ?? "";

  return (
    <FVShell>
      <div style={{ padding: "0 0 20px" }}>
        {/* Header */}
        <div style={{
          background: "white",
          padding: "14px 20px 10px",
          borderBottom: "1px solid #D6E9FF",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}>
          <div>
            <h1 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 900, color: "#1D2B53" }}>
              {mainTab === "city" ? "🏙 My City" : "🌍 Neighborhood"}
            </h1>
          </div>
          <div className="row gap-8">
            <div className="fv-gold"><span>🪙</span><span>{state.gold.toLocaleString()}</span></div>
          </div>
        </div>

        {/* Main tab bar */}
        <div className="fv-tabs" style={{ margin: "10px 20px 0" }}>
          <button
            className={`fv-tab ${mainTab === "city" ? "active" : ""}`}
            onClick={() => setMainTab("city")}
          >
            🏙 My City
          </button>
          <button
            className={`fv-tab ${mainTab === "neighborhood" ? "active" : ""}`}
            onClick={() => setMainTab("neighborhood")}
          >
            🌍 Neighborhood
          </button>
        </div>

        {/* City tab */}
        {mainTab === "city" && (
          <div style={{ marginTop: 12 }}>
            <CityTab />
          </div>
        )}

        {/* Neighborhood tab */}
        {mainTab === "neighborhood" && (
          <div>
            {/* Sub-tabs */}
            <div className="fv-scroll-tabs" style={{ margin: "10px 0 0", padding: "0 16px" }}>
              {([
                { key: "feed",   label: "📝 Feed"   },
                { key: "map",    label: "🗺 Map"     },
                { key: "chat",   label: "💬 Chats"  },
                { key: "search", label: "🔍 Search" },
              ] as { key: NeighborhoodTab; label: string }[]).map(({ key, label }) => (
                <button
                  key={key}
                  className={`fv-scroll-tab ${neighTab === key ? "active" : ""}`}
                  onClick={() => setNeighTab(key)}
                >
                  {label}
                </button>
              ))}
            </div>

            {neighTab === "feed"   && <FeedSection userId={userId} />}
            {neighTab === "map"    && <MapSection />}
            {neighTab === "chat"   && <ChatListSection userId={userId} />}
            {neighTab === "search" && <SearchSection />}
          </div>
        )}
      </div>
    </FVShell>
  );
}
