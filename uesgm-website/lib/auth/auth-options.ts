import { PrismaAdapter } from "@auth/prisma-adapter"
import { PrismaClient } from "@prisma/client"
import type { DefaultSession, User as NextAuthUser } from "next-auth"
import type { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import type { Adapter } from "next-auth/adapters"
import type { JWT } from "next-auth/jwt"

import { UserRole } from "@/types/next-auth"

// Étendre les types de session
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string
      role: UserRole
    } & DefaultSession["user"]
  }

  interface User extends NextAuthUser {
    role: UserRole
  }
}

const prisma = new PrismaClient()

// Fonction pour vérifier si une adresse email est autorisée
const isAuthorizedEmail = (email: string): boolean => {
  // Liste des domaines autorisés (à adapter selon vos besoins)
  const allowedDomains = ["gmail.com", "esgm.ma"]
  
  // Vérifie si le domaine de l'email est dans la liste des domaines autorisés
  const emailDomain = email.split('@')[1]
  return allowedDomains.includes(emailDomain)
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as Adapter,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      },
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          // Par défaut, on attribue le rôle MEMBER
          // Vous pouvez personnaliser cette logique selon vos besoins
          role: "MEMBER"
        }
      }
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile, email, credentials }) {
      // Vérifie si l'utilisateur est autorisé à se connecter
      if (user.email && !isAuthorizedEmail(user.email)) {
        return "/auth/unauthorized-email"
      }
      return true
    },
    async session({ session, token, user }) {
      // Ajoute les propriétés personnalisées à la session
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = (token.role as UserRole) || "MEMBER"
      }
      return session
    },
    async jwt({ token, user, trigger, session, account, profile, isNewUser }) {
      // Ajoute les propriétés personnalisées au token JWT
      if (user) {
        token.id = user.id
        token.role = (user as any).role || "MEMBER"
      }

      // Mise à jour du token lors d'une mise à jour de session
      if (trigger === "update" && session?.role) {
        token.role = session.role
      }

      return token
    },
    async redirect({ url, baseUrl }) {
      // Redirige vers la page d'accueil après connexion
      if (url.startsWith("/")) return `${baseUrl}${url}`
      else if (new URL(url).origin === baseUrl) return url
      return baseUrl
    }
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 jours
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
    unauthorized: "/auth/unauthorized-email"
  },
  events: {
    async signIn(message) {
      console.log(`User ${message.user.email} signed in`)
      
      // Mise à jour du rôle utilisateur si nécessaire
      // Par exemple, vous pourriez vouloir promouvoir certains utilisateurs
      if (message.user.email === "admin@esgm.ma") {
        await prisma.user.update({
          where: { email: message.user.email },
          data: { role: "SUPER_ADMIN" }
        })
      }
    },
  },
  debug: process.env.NODE_ENV === "development",
}
