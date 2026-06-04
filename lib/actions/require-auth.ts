import { headers, cookies } from "next/headers";
import { decode } from "@auth/core/jwt";
import { auth } from "@/auth";

// Server-side auth utility shared by all server actions.
// Strategy (fastest to slowest):
// 1. Read the x-user-id header set by proxy.ts after JWT verification — zero crypto cost
// 2. Direct JWT decode with AUTH_SECRET and NEXTAUTH_SECRET (both tried)
// 3. Fall back to auth() in case NextAuth uses a different key derivation
export async function requireAuth(): Promise<string> {
  // 1. Proxy-forwarded user ID (most reliable — proxy already verified the JWT)
  const headerStore = await headers();
  const forwarded = headerStore.get("x-user-id");
  if (forwarded) return forwarded;

  // 2. Direct JWT decode — try both secret env vars and both cookie names
  const cookieStore = await cookies();
  const secrets = [
    process.env.AUTH_SECRET,
    process.env.NEXTAUTH_SECRET,
  ].filter(Boolean) as string[];

  for (const name of ["__Secure-authjs.session-token", "authjs.session-token"]) {
    const token = cookieStore.get(name)?.value;
    if (!token) continue;
    for (const secret of secrets) {
      try {
        const decoded = await decode({ token, secret, salt: name });
        if (decoded?.sub) return decoded.sub;
      } catch {
        // try next combination
      }
    }
  }

  // 3. NextAuth auth() fallback
  const session = await auth();
  if (session?.user?.id) return session.user.id;

  throw new Error("Unauthorized");
}
