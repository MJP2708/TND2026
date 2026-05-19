import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;
  const url = new URL(req.url);
  const page = parseInt(url.searchParams.get("page") ?? "0");
  const limit = 20;

  const posts = await db.post.findMany({
    orderBy: { createdAt: "desc" },
    skip: page * limit,
    take: limit,
    include: {
      user: { select: { id: true, displayName: true, name: true, image: true, streak: true, level: true } },
      likes: { select: { userId: true } },
      comments: {
        orderBy: { createdAt: "asc" },
        take: 5,
        include: { user: { select: { id: true, displayName: true, name: true } } },
      },
      _count: { select: { likes: true, comments: true } },
    },
  });

  const mapped = posts.map((p) => ({
    id: p.id,
    content: p.content,
    type: p.type,
    createdAt: p.createdAt,
    user: p.user,
    likesCount: p._count.likes,
    commentsCount: p._count.comments,
    likedByMe: p.likes.some((l) => l.userId === userId),
    comments: p.comments.map((c) => ({
      id: c.id,
      content: c.content,
      createdAt: c.createdAt,
      user: c.user,
    })),
  }));

  return NextResponse.json({ posts: mapped, page, hasMore: posts.length === limit });
}
