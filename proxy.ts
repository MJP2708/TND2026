import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "./auth.config";

const { auth } = NextAuth(authConfig);

const PUBLIC_PATHS = ["/", "/login", "/onboarding"];
const ASSET_PATTERN = /^(\/_next\/|\/favicon|\/api\/auth)/;

export const proxy = auth((request) => {
  const { pathname } = request.nextUrl;
  const session = request.auth;

  if (ASSET_PATTERN.test(pathname)) return NextResponse.next();

  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    if (session && (pathname === "/login" || pathname.startsWith("/onboarding"))) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  if (!session) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.svg$|.*\\.png$).*)",
  ],
};
