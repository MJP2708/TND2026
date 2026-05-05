import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";

const hasGoogle =
  Boolean(process.env.GOOGLE_CLIENT_ID) && Boolean(process.env.GOOGLE_CLIENT_SECRET);
const demoAuthEnabled =
  process.env.NODE_ENV !== "production" || process.env.DEMO_AUTH_ENABLED === "true";
const authSecret =
  process.env.AUTH_SECRET ??
  process.env.NEXTAUTH_SECRET ??
  // Local competition demo fallback only. Production should define AUTH_SECRET.
  (demoAuthEnabled ? "thrivetown-local-demo-secret-do-not-use-in-production" : undefined);

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: authSecret,
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
        const email = String(credentials?.email ?? "").trim().toLowerCase();
        const password = String(credentials?.password ?? "");

        // Competition demo only. Enable in production deliberately with
        // DEMO_AUTH_ENABLED=true; never use this as a real password system.
        if (demoAuthEnabled && email === "demo@tycoon.app" && password === "demo1234") {
          return {
            id: "demo-tycoon-user",
            email,
            name: "Demo Tycoon",
            image: "/avatar.svg",
          };
        }

        return null;
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = String(token.id ?? token.email ?? "demo-user");
      }
      return session;
    },
  },
});
