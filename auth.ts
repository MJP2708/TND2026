import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";

const hasGoogle =
  Boolean(process.env.GOOGLE_CLIENT_ID) && Boolean(process.env.GOOGLE_CLIENT_SECRET);

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
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
      name: "Demo account",
      credentials: {
        name: { label: "Name", type: "text" },
        email: { label: "Email", type: "email" },
      },
      async authorize(credentials) {
        const email = String(credentials?.email ?? "").trim().toLowerCase();
        const name = String(credentials?.name ?? "").trim();

        if (!email || !email.includes("@")) return null;

        return {
          id: email,
          email,
          name: name || email.split("@")[0],
          image: `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(
            name || email,
          )}`,
        };
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

