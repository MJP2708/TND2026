"use server";

import { requireAuth } from "./require-auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getUserPlan } from "@/lib/plan";

const ADJECTIVES = ["Purple", "Quiet", "Swift", "Bright", "Calm", "Bold", "Gentle", "Keen", "Warm", "Clear", "Brave", "Soft", "Wild", "Deep", "Kind"];
const NOUNS = ["Fox", "Cloud", "River", "Star", "Forest", "Wave", "Stone", "Wind", "Flame", "Moon", "Bird", "Lake", "Tree", "Dawn", "Leaf"];

function getAnonymousName(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (Math.imul(31, hash) + userId.charCodeAt(i)) | 0;
  }
  const abs = Math.abs(hash);
  const adjIdx = abs % ADJECTIVES.length;
  const nounIdx = Math.abs(hash >> 4) % NOUNS.length;
  return `${ADJECTIVES[adjIdx]} ${NOUNS[nounIdx]}`;
}

const BLOCKED_PATTERNS = [
  /\d{9,}/,
  /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/,
  /@[a-zA-Z0-9_]{3,}/,
  /line\.me|instagram|facebook|tiktok|twitter/i,
];

function moderateContent(text: string): boolean {
  return !BLOCKED_PATTERNS.some((p) => p.test(text));
}

const PostSchema = z.object({
  content: z.string().min(1).max(500).trim(),
  goalTag: z.enum(["study", "health", "work", "personal"]).optional(),
});

export async function createNeighborhoodPost(input: z.infer<typeof PostSchema>) {
  const userId = await requireAuth();

  const plan = await getUserPlan(userId);
  if (plan === "free") {
    return { success: false, error: "pro_required" };
  }

  const parsed = PostSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "invalid_input" };

  if (!moderateContent(parsed.data.content)) {
    return { success: false, error: "Personal contact info is not allowed here" };
  }

  const anonymousName = getAnonymousName(userId);

  await db.neighborhoodPost.create({
    data: {
      userId,
      content: parsed.data.content,
      goalTag: parsed.data.goalTag ?? null,
      anonymousName,
    },
  });

  revalidatePath("/neighborhood");
  return { success: true };
}

export async function getNeighborhoodPosts(goalTag?: string, page = 0) {
  const userId = await requireAuth();
  const limit = 20;

  const posts = await db.neighborhoodPost.findMany({
    where: goalTag ? { goalTag } : undefined,
    orderBy: { createdAt: "desc" },
    skip: page * limit,
    take: limit,
    include: {
      replies: {
        orderBy: { createdAt: "asc" },
        take: 10,
      },
      likedBy: { select: { userId: true } },
    },
  });

  return posts.map((p) => ({
    id: p.id,
    content: p.content,
    goalTag: p.goalTag,
    anonymousName: p.anonymousName,
    likesCount: p.likedBy.length,
    likedByMe: p.likedBy.some((l: { userId: string }) => l.userId === userId),
    repliesCount: p.replies.length,
    replies: p.replies,
    createdAt: p.createdAt,
  }));
}

export async function likeNeighborhoodPost(postId: string) {
  const userId = await requireAuth();

  const existing = await db.neighborhoodLike.findUnique({
    where: { postId_userId: { postId, userId } },
  });

  if (existing) {
    await db.neighborhoodLike.delete({ where: { postId_userId: { postId, userId } } });
    return { liked: false };
  } else {
    await db.neighborhoodLike.create({ data: { postId, userId } });
    return { liked: true };
  }
}

export async function addNeighborhoodReply(postId: string, content: string) {
  const userId = await requireAuth();
  const trimmed = content.trim();
  if (!trimmed || trimmed.length > 300) return { error: "Invalid reply" };

  if (!moderateContent(trimmed)) {
    return { error: "Personal contact info is not allowed here" };
  }

  const anonymousName = getAnonymousName(userId);

  const reply = await db.neighborhoodReply.create({
    data: { postId, userId, content: trimmed, anonymousName },
  });

  revalidatePath("/neighborhood");
  return { success: true, reply };
}
