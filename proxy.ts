import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const privateRoutes = [
  "/dashboard",
  "/planner",
  "/timetable",
  "/focus",
  "/game",
  "/rewards",
  "/neighborhood",
  "/friends",
  "/mood",
  "/settings",
];
const demoAuthEnabled =
  process.env.NODE_ENV !== "production" || process.env.DEMO_AUTH_ENABLED === "true";
const authSecret =
  process.env.AUTH_SECRET ??
  process.env.NEXTAUTH_SECRET ??
  // Local competition demo fallback only. Production should define AUTH_SECRET.
  (demoAuthEnabled ? "thrivetown-local-demo-secret-do-not-use-in-production" : undefined);

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPrivate = privateRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
  const token = await getToken({
    req: request,
    secret: authSecret,
  });

  if (isPrivate && !token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname === "/login" && token) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/login",
    "/dashboard/:path*",
    "/planner/:path*",
    "/timetable/:path*",
    "/focus/:path*",
    "/game/:path*",
    "/rewards/:path*",
    "/neighborhood/:path*",
    "/friends/:path*",
    "/mood/:path*",
    "/settings/:path*",
  ],
};
