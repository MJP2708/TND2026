import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function POST(req: NextRequest, { params }: { params: Promise<{ postId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;
  const { postId } = await params;

  const existing = await db.like.findUnique({
    where: { postId_userId: { postId, userId } },
  });

  if (existing) {
    await db.like.delete({ where: { postId_userId: { postId, userId } } });
    const count = await db.like.count({ where: { postId } });
    return NextResponse.json({ liked: false, likesCount: count });
  } else {
    await db.like.create({ data: { postId, userId } });
    const count = await db.like.count({ where: { postId } });
    return NextResponse.json({ liked: true, likesCount: count });
  }
}
