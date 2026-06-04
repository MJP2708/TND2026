import { cookies } from "next/headers";
import { decode } from "@auth/core/jwt";
import { auth } from "@/auth";

// Server-side auth utility shared by all server actions.
// First tries direct JWT decode (avoids NextAuth 5 beta's server-action cookie bug).
// Falls back to auth() in case the decode salt or secret differs.
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
      // try next variant
    }
  }

  // Fallback: let NextAuth handle it (works when auth() reads cookies correctly)
  const session = await auth();
  if (session?.user?.id) return session.user.id;

  throw new Error("Unauthorized");
}
