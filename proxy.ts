import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { decode } from "@auth/core/jwt";

const PUBLIC_PATHS = ["/", "/login", "/onboarding"];
const ASSET_PATTERN = /^(\/_next\/|\/favicon|\/api\/auth)/;
const COOKIE_NAMES = ["authjs.session-token", "__Secure-authjs.session-token"];

// NextAuth 5 uses AUTH_SECRET first, NEXTAUTH_SECRET as fallback.
// Try both so the proxy works regardless of which env var is set on Vercel.
const SECRETS = [
  process.env.AUTH_SECRET,
  process.env.NEXTAUTH_SECRET,
].filter(Boolean) as string[];

async function getSession(request: NextRequest): Promise<{ sub: string } | null> {
  for (const name of COOKIE_NAMES) {
    const token = request.cookies.get(name)?.value;
    if (!token) continue;
    for (const secret of SECRETS) {
      try {
        const decoded = await decode({ token, secret, salt: name });
        if (decoded?.sub) return { sub: decoded.sub };
      } catch {
        // try next combination
      }
    }
  }
  return null;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (ASSET_PATTERN.test(pathname)) return NextResponse.next();

  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    const session = await getSession(request);
    if (session && (pathname === "/login" || pathname.startsWith("/onboarding"))) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  const session = await getSession(request);
  if (!session) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Forward the verified user ID as a request header so server actions
  // can read it directly without re-decoding the JWT.
  return NextResponse.next({
    request: {
      headers: new Headers({
        ...Object.fromEntries(request.headers.entries()),
        "x-user-id": session.sub,
      }),
    },
  });
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.svg$|.*\\.png$).*)",
  ],
};
