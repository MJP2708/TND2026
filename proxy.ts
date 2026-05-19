import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/auth";

// Public paths that don't need auth
const PUBLIC_PATHS = ["/", "/login", "/onboarding"];
const ASSET_PATTERN = /^(\/_next\/|\/favicon|\/api\/auth)/;

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip assets and auth API
  if (ASSET_PATTERN.test(pathname)) return NextResponse.next();

  // Public pages
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    const session = await auth();
    // Redirect logged-in users away from login/onboarding
    if (session && (pathname === "/login" || pathname.startsWith("/onboarding"))) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  // All other routes require auth
  const session = await auth();
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
