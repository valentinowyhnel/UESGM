import NextAuth, { getServerSession, type NextAuthOptions } from "next-auth"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"
import { compare } from "bcryptjs"
import { z } from "zod"

/* ===============================
   🔐 Validation credentials (anti injection)
================================= */
const LoginSchema = z.object({
  email: z.string().email().min(5).max(255),
  password: z.string().min(8).max(100),
})

/* ===============================
   🔐 Extend NextAuth types
================================= */
declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      role: string
    }
  }

  interface User {
    role: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role: string
    email: string
  }
}

/* ===============================
   🔐 NextAuth Options
================================= */
export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),

  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24, // 24h
  },

  jwt: {
    maxAge: 60 * 60 * 24, // 24h
  },

  pages: {
    signIn: "/portal",
    error: "/portal", // évite fuite d’erreurs
  },

  /* ===============================
     🔐 Providers
  ================================= */
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },

      async authorize(credentials) {
        try {
          // 1️⃣ Validation Zod (anti injection)
          const parsed = LoginSchema.safeParse(credentials)
          if (!parsed.success) return null

          const { email, password } = parsed.data

          // 2️⃣ Recherche user
          const user = await prisma.user.findUnique({
            where: { email },
          })

          if (!user || !user.password) return null

          // 3️⃣ Vérification mot de passe
          const valid = await compare(password, user.password)
          if (!valid) return null

          // 4️⃣ Return minimal user (jamais password!)
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          }
        } catch (error) {
          console.error("AUTH ERROR:", error)
          return null
        }
      },
    }),
  ],

  /* ===============================
     🔐 Callbacks (TRÈS IMPORTANT)
  ================================= */
  callbacks: {
    // 👉 Création / refresh du JWT
    async jwt({ token, user }) {
      // login initial
      if (user) {
        token.id = user.id
        token.role = user.role
        if (user.email) {
          token.email = user.email
        }
      }

      // 🔐 Sync role depuis DB (évite rôle obsolète)
      if (token?.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id },
          select: { role: true },
        })

        if (dbUser) token.role = dbUser.role
      }

      return token
    },

    // 👉 Création session envoyée au frontend
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id
        session.user.role = token.role
        session.user.email = token.email
      }

      return session
    },

    /* 🔐 Protection redirections */
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`
      if (new URL(url).origin === baseUrl) return url
      return baseUrl
    },
  },

  /* ===============================
     🔐 Cookies sécurisés prod
  ================================= */
  cookies: {
    sessionToken: {
      name:
        process.env.NODE_ENV === "production"
          ? "__Secure-next-auth.session-token"
          : "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },

  /* ===============================
     🔐 Events logs (audit sécurité)
  ================================= */
  events: {
    async signIn(message) {
      console.log("User signed in:", message.user.email)
    },
    async signOut(message) {
      console.log("User signed out:", message.token?.email)
    },
  },

  /* ===============================
     🔐 Secret obligatoire prod
  ================================= */
  secret: process.env.NEXTAUTH_SECRET,

  debug: process.env.NODE_ENV === "development",
}

/* ===============================
   Handlers Next.js App Router
================================= */
const handler = NextAuth(authOptions);
 
export const auth = () => getServerSession(authOptions);
export { handler as GET, handler as POST, handler as default };
