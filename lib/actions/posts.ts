"use server";

import { requireAuth } from "./require-auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { checkAchievements } from "./achievements";

const PostSchema = z.object({
  content: z.string().min(1).max(500).trim(),
  type: z.enum(["text", "achievement", "mood", "milestone"]).default("text"),
});

export async function createPost(formData: FormData) {
  const userId = await requireAuth();
  const parsed = PostSchema.safeParse({
    content: formData.get("content"),
    type: formData.get("type") ?? "text",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const post = await db.post.create({
    data: {
      userId,
      content: parsed.data.content,
      type: parsed.data.type,
    },
  });

  await checkAchievements(userId);
  revalidatePath("/community");
  return { success: true, postId: post.id };
}

export async function getPosts(page = 0, limit = 20) {
  const userId = await requireAuth();
  const posts = await db.post.findMany({
    orderBy: { createdAt: "desc" },
    skip: page * limit,
    take: limit,
    include: {
      user: { select: { id: true, displayName: true, name: true, image: true, streak: true, level: true } },
      likes: { select: { userId: true } },
      comments: {
        orderBy: { createdAt: "asc" },
        include: { user: { select: { id: true, displayName: true, name: true } } },
      },
      _count: { select: { likes: true, comments: true } },
    },
  });

  return posts.map((p) => ({
    ...p,
    likedByMe: p.likes.some((l) => l.userId === userId),
    likesCount: p._count.likes,
    commentsCount: p._count.comments,
  }));
}

export async function toggleLike(postId: string) {
  const userId = await requireAuth();

  const existing = await db.like.findUnique({
    where: { postId_userId: { postId, userId } },
  });

  if (existing) {
    await db.like.delete({ where: { postId_userId: { postId, userId } } });
    return { liked: false };
  } else {
    await db.like.create({ data: { postId, userId } });
    return { liked: true };
  }
}

export async function addComment(postId: string, content: string) {
  const userId = await requireAuth();
  const trimmed = content.trim();
  if (!trimmed || trimmed.length > 300) return { error: "Invalid comment" };

  const comment = await db.comment.create({
    data: { postId, userId, content: trimmed },
    include: { user: { select: { id: true, displayName: true, name: true } } },
  });

  revalidatePath("/community");
  return { success: true, comment };
}

export async function getNeighbors(query?: string) {
  const userId = await requireAuth();
  const users = await db.user.findMany({
    where: {
      id: { not: userId },
      ...(query ? {
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { displayName: { contains: query, mode: "insensitive" } },
        ],
      } : {}),
    },
    select: {
      id: true,
      name: true,
      displayName: true,
      image: true,
      streak: true,
      level: true,
      gold: true,
      focusMinutes: true,
      _count: { select: { tasks: true, posts: true } },
    },
    take: 20,
    orderBy: { streak: "desc" },
  });
  return users;
}

export async function getOrCreateDM(targetUserId: string) {
  const userId = await requireAuth();

  // Find existing DM room
  const existing = await db.chatRoom.findFirst({
    where: {
      isGroup: false,
      members: { every: { userId: { in: [userId, targetUserId] } } },
    },
    include: { members: true },
  });

  if (existing && existing.members.length === 2) return { roomId: existing.id };

  // Create new room
  const room = await db.chatRoom.create({
    data: {
      isGroup: false,
      members: {
        create: [{ userId }, { userId: targetUserId }],
      },
    },
  });

  return { roomId: room.id };
}
