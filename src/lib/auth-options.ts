import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { findConfiguredAdminUser, getNextAuthSecret, isAdminRole, type AdminRole } from "@/lib/admin-access-config";

export const authOptions: NextAuthOptions = {
  secret: getNextAuthSecret(),
  session: { strategy: "jwt" },
  pages: { signIn: "/admin/login" },
  providers: [
    CredentialsProvider({
      id: "admin-credentials",
      name: "Admin Login",
      credentials: {
        email: { label: "이메일", type: "email" },
        password: { label: "비밀번호", type: "password" },
      },
      async authorize(credentials) {
        const email = String(credentials?.email ?? "").trim().toLowerCase();
        const password = String(credentials?.password ?? "");
        const user = findConfiguredAdminUser(email, password);
        if (!user) return null;

        return {
          id: user.email,
          email: user.email,
          name: user.name,
          roles: user.roles,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.email = user.email;
        token.name = user.name;
        token.roles = Array.isArray((user as { roles?: unknown }).roles)
          ? ((user as { roles?: unknown[] }).roles ?? []).filter((role): role is AdminRole => isAdminRole(role))
          : [];
      }
      return token;
    },
    async session({ session, token }) {
      session.user = {
        ...session.user,
        email: String(token.email ?? ""),
        name: typeof token.name === "string" ? token.name : null,
        roles: Array.isArray(token.roles) ? token.roles.filter((role): role is AdminRole => isAdminRole(role)) : [],
      };
      return session;
    },
  },
};