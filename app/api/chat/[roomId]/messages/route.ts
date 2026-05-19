import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest, { params }: { params: Promise<{ roomId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;
  const { roomId } = await params;

  const member = await db.chatMember.findUnique({
    where: { roomId_userId: { roomId, userId } },
  });
  if (!member) return NextResponse.json({ error: "Not a member" }, { status: 403 });

  const messages = await db.message.findMany({
    where: { roomId },
    orderBy: { createdAt: "asc" },
    take: 100,
    include: { sender: { select: { id: true, name: true, displayName: true, image: true } } },
  });

  return NextResponse.json({ messages });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ roomId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;
  const { roomId } = await params;
  const body = await req.json();
  const content = String(body.content ?? "").trim();

  if (!content || content.length > 1000) {
    return NextResponse.json({ error: "Invalid message" }, { status: 400 });
  }

  const member = await db.chatMember.findUnique({
    where: { roomId_userId: { roomId, userId } },
  });
  if (!member) return NextResponse.json({ error: "Not a member" }, { status: 403 });

  const message = await db.message.create({
    data: { roomId, userId, content },
    include: { sender: { select: { id: true, name: true, displayName: true, image: true } } },
  });

  return NextResponse.json({ message });
}
