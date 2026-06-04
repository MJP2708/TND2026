import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { decode } from "@auth/core/jwt";

const PUBLIC_PATHS = ["/", "/login", "/onboarding"];
const ASSET_PATTERN = /^(\/_next\/|\/favicon|\/api\/auth)/;

// Cookie names used by NextAuth 5 (http vs https)
const COOKIE_NAMES = ["authjs.session-token", "__Secure-authjs.session-token"];

async function getSession(request: NextRequest) {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) return null;

  for (const name of COOKIE_NAMES) {
    const token = request.cookies.get(name)?.value;
    if (!token) continue;
    try {
      const decoded = await decode({ token, secret, salt: name });
      if (decoded?.sub) return decoded;
    } catch {
      // Try next cookie name
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

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.svg$|.*\\.png$).*)",
  ],
};
