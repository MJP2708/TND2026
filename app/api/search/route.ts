import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;
  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim() ?? "";

  if (q.length < 2) return NextResponse.json({ users: [], posts: [] });

  const [users, posts] = await Promise.all([
    db.user.findMany({
      where: {
        id: { not: userId },
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { displayName: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
        ],
      },
      select: { id: true, name: true, displayName: true, image: true, streak: true, level: true },
      take: 10,
    }),
    db.post.findMany({
      where: { content: { contains: q, mode: "insensitive" } },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        user: { select: { id: true, name: true, displayName: true } },
        _count: { select: { likes: true } },
      },
    }),
  ]);

  return NextResponse.json({ users, posts });
}
