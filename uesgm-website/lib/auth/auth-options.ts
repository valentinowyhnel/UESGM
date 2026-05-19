import { PrismaAdapter } from "@auth/prisma-adapter"
import { PrismaClient, Role } from "@prisma/client"
import type { DefaultSession, User as NextAuthUser } from "next-auth"
import type { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
import type { Adapter } from "next-auth/adapters"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

// ============================================
// CONSTANTES DE SÉCURITÉ
// ============================================
const MAX_LOGIN_ATTEMPTS = 5        // Nombre max de tentatives avant verrouillage
const LOCKOUT_DURATION_MINUTES = 30 // Durée du verrouillage en minutes
const DELAY_BASE_MS = 500           // Délai de base en ms (sera multiplié)
const DELAY_MULTIPLIER = 300        // Multiplicateur de délai par tentative
const MAX_DELAY_MS = 5000           // Délai maximum en ms

// Fonction pour calculer le délai avant réponse (contre brute force)
function getDelay(attemptCount: number): number {
  const delay = DELAY_BASE_MS + (attemptCount * DELAY_MULTIPLIER)
  return Math.min(delay, MAX_DELAY_MS)
}

// Fonction pour vérifier si une adresse email est autorisée (pour OAuth)
const isAuthorizedEmail = (email: string): boolean => {
  const allowedDomains = ["gmail.com", "uesgm.ma"]
  const emailDomain = email.split('@')[1]
  return allowedDomains.includes(emailDomain)
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as Adapter,
  providers: [
    // Provider Google OAuth
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
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
          role: Role.MEMBER
        }
      }
    }),
    // Provider Credentials pour login admin
    CredentialsProvider({
      name: "Connexion",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "votre@email.ma" },
        password: { label: "Mot de passe", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.error("❌ Auth: Email ou mot de passe manquant")
          return null
        }

        try {
          // Rechercher l'utilisateur par email
          const user = await prisma.user.findUnique({
            where: { email: credentials.email }
          })

          if (!user) {
            console.error(`❌ Auth: Utilisateur non trouvé pour l'email: ${credentials.email}`)
            // Délai pour éviter la révélation d'existence de compte
            await new Promise(resolve => setTimeout(resolve, getDelay(0)))
            return null
          }

          // ============================================
          // VÉRIFICATION DU VERROUILLAGE
          // ============================================
          // Vérifier si le compte est verrouillé
          if (user.lockoutUntil && user.lockoutUntil > new Date()) {
            const remainingMinutes = Math.ceil((user.lockoutUntil.getTime() - Date.now()) / 60000)
            console.error(`❌ Auth: Compte verrouillé pour ${credentials.email}. Réessayez dans ${remainingMinutes} minutes`)
            // Délai même en cas de verrouillage
            await new Promise(resolve => setTimeout(resolve, 1000))
            throw new Error("Compte verrouillé. Veuillez réessayer plus tard.")
          }

          // ============================================
          // VÉRIFICATION DU MOT DE PASSE
          // ============================================
          // Vérifier le mot de passe avec bcrypt
          if (!user.password) {
            console.error(`❌ Auth: Pas de mot de passe pour l'utilisateur: ${credentials.email}`)
            await new Promise(resolve => setTimeout(resolve, getDelay(user.failedLoginAttempts)))
            return null
          }

          const isValidPassword = await bcrypt.compare(
            credentials.password,
            user.password
          )

          if (!isValidPassword) {
            // ============================================
            // ÉCHEC - INCRÉMENTER LES TENTATIVES
            // ============================================
            const newAttempts = user.failedLoginAttempts + 1
            let lockoutTime: Date | null = null
            
            // Verrouiller le compte si max tentatives atteintes
            if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
              lockoutTime = new Date(Date.now() + LOCKOUT_DURATION_MINUTES * 60 * 1000)
              console.error(`🔒 Auth: Compte verrouillé pour ${credentials.email} après ${newAttempts} tentatives échouées`)
            }

            // Mettre à jour les tentatives échouées
            await prisma.user.update({
              where: { id: user.id },
              data: {
                failedLoginAttempts: newAttempts,
                lockoutUntil: lockoutTime
              }
            })

            // Journaliser la tentative échouée
            console.error(`❌ Auth: Tentative échouée pour ${credentials.email}. Tentative ${newAttempts}/${MAX_LOGIN_ATTEMPTS}`)
            
            // Délai progressif pour ralentir les attaques
            await new Promise(resolve => setTimeout(resolve, getDelay(newAttempts)))
            
            return null
          }

          // ============================================
          // SUCCÈS - RÉINITIALISER LES TENTATIVES
          // ============================================
          // Réinitialiser les tentatives échouées et mettre à jour la dernière connexion
          await prisma.user.update({
            where: { id: user.id },
            data: {
              failedLoginAttempts: 0,
              lockoutUntil: null,
              lastLoginAt: new Date()
            }
          })

          const userRole = user.role as Role
          console.log(`✅ Auth: Connexion réussie pour ${credentials.email} avec le rôle ${userRole}`)

          // Retourner l'utilisateur avec son rôle
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
            role: userRole
          }
        } catch (error: any) {
          console.error("❌ Auth: Erreur lors de l'authentification:", error)
          // Si c'est une erreur de verrouillage, la propager
          if (error.message === "Compte verrouillé. Veuillez réessayer plus tard.") {
            throw error
          }
          return null
        }
      }
    })
  ],
  callbacks: {
    async signIn({ user, account, profile, email, credentials }) {
      // Pour les connexions OAuth
      if (account?.provider === "google") {
        if (user.email && !isAuthorizedEmail(user.email)) {
          return "/auth/unauthorized-email"
        }
      }
      return true
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id as string;
        (session.user as any).role = token.role as Role;
      }
      return session
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role || Role.MEMBER
      }

      if (trigger === "update" && session?.role) {
        token.role = session.role
      }

      return token
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`
      else if (new URL(url).origin === baseUrl) return url
      return baseUrl
    }
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  pages: {
    signIn: "/login",
    error: "/auth/error",
  },
  debug: process.env.NODE_ENV === "development",
}
