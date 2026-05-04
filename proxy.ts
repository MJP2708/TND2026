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
  "/onboarding",
];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPrivate = privateRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
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
    "/onboarding/:path*",
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

