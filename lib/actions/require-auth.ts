"use server";

import { cookies } from "next/headers";
import { decode } from "@auth/core/jwt";

// Direct JWT decode — bypasses NextAuth 5 beta's auth() which silently
// returns null in server action context due to a known cookie-reading bug.
export async function requireAuth(): Promise<string> {
  const cookieStore = await cookies();
  const secret = process.env.NEXTAUTH_SECRET!;

  for (const name of ["__Secure-authjs.session-token", "authjs.session-token"]) {
    const token = cookieStore.get(name)?.value;
    if (!token) continue;
    try {
      const decoded = await decode({ token, secret, salt: name });
      if (decoded?.sub) return decoded.sub;
    } catch {
      // wrong cookie variant, try next
    }
  }

  throw new Error("Unauthorized");
}
