import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PRIVATE = [
  "/dashboard",
  "/plan",
  "/focus",
  "/progress",
  "/rewards",
  "/mood",
  "/community",
  "/settings",
  "/onboarding",
];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const authed = request.cookies.has("tf_session");
  const isPrivate = PRIVATE.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );

  if (isPrivate && !authed) {
    const url = new URL("/login", request.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (pathname === "/login" && authed) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/login",
    "/dashboard/:path*",
    "/plan/:path*",
    "/focus/:path*",
    "/progress/:path*",
    "/rewards/:path*",
    "/mood/:path*",
    "/community/:path*",
    "/settings/:path*",
    "/onboarding/:path*",
  ],
};
