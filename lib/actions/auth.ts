"use server";

import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";

const RegisterSchema = z.object({
  name: z.string().min(2).max(50).trim(),
  email: z.string().email().trim().toLowerCase(),
  password: z.string().min(8).max(100),
});

export async function registerUser(formData: FormData) {
  const parsed = RegisterSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { name, email, password } = parsed.data;

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "An account with this email already exists." };
  }

  const hashed = await bcrypt.hash(password, 12);
  await db.user.create({
    data: {
      name,
      displayName: name,
      email,
      password: hashed,
    },
  });

  return { success: true };
}
