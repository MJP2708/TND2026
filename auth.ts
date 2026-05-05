import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import type { NextAuthConfig } from "next-auth";

const hasGoogle =
  Boolean(process.env.GOOGLE_CLIENT_ID) && Boolean(process.env.GOOGLE_CLIENT_SECRET);
const demoAuthEnabled =
  process.env.NODE_ENV !== "production" || process.env.DEMO_AUTH_ENABLED === "true";
const authSecret =
  process.env.AUTH_SECRET ??
  process.env.NEXTAUTH_SECRET ??
  // Local competition demo fallback only. Production should define AUTH_SECRET.
  (demoAuthEnabled ? "thrivetown-local-demo-secret-do-not-use-in-production" : undefined);

export const authOptions = {
  secret: authSecret,
  trustHost: true,
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    ...(hasGoogle
      ? [
          Google({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
          }),
        ]
      : []),
    Credentials({
      name: "Email and password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          const email = String(credentials?.email ?? "").trim().toLowerCase();
          const password = String(credentials?.password ?? "");

          // Competition demo only. Enable in production deliberately with
          // DEMO_AUTH_ENABLED=true; never use this as a real password system.
          if (demoAuthEnabled && email === "demo@tycoon.app" && password === "demo1234") {
            return {
              id: "demo-user",
              email: "demo@tycoon.app",
              name: "Demo User",
              image: null,
            };
          }

          return null;
        } catch (error) {
          console.error("[auth] Demo credentials authorize failed safely", {
            message: error instanceof Error ? error.message : "Unknown error",
          });
          return null;
        }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user?.id) token.id = user.id;
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = String(token?.id ?? token?.email ?? "demo-user");
      }
      return session;
    },
  },
} satisfies NextAuthConfig;

export const { handlers, auth, signIn, signOut } = NextAuth(authOptions);
