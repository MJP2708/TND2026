import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function POST(req: NextRequest, { params }: { params: Promise<{ postId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;
  const { postId } = await params;
  const body = await req.json();
  const content = String(body.content ?? "").trim();

  if (!content || content.length > 300) {
    return NextResponse.json({ error: "Invalid comment" }, { status: 400 });
  }

  const post = await db.post.findUnique({ where: { id: postId } });
  if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });

  const comment = await db.comment.create({
    data: { postId, userId, content },
    include: { user: { select: { id: true, displayName: true, name: true } } },
  });

  return NextResponse.json({ comment });
}
