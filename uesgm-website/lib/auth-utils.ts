import { PrismaAdapter } from "@auth/prisma-adapter"
import { PrismaClient } from "@prisma/client"
import { DefaultSession, type NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import type { Adapter } from "next-auth/adapters"
import type { UserRole } from "@/types/next-auth"

const prisma = new PrismaClient()

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as Adapter,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!
        session.user.role = token.role as UserRole
      }
      return session
    },
    async jwt({ token, user }) {
      if (user) {
        token.role = ((user as any).role as UserRole) || "MEMBER"
      }
      return token
    },
  },
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
}