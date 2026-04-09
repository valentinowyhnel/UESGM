import { DefaultSession, DefaultUser } from "next-auth"
import { JWT as DefaultJWT } from "next-auth/jwt"

// Définir les rôles utilisateur conformes au nouveau schéma Prisma
export type UserRole = "SUPER_ADMIN" | "ADMIN" | "MODERATOR" | "MEMBER" | "PUBLIC"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: UserRole
    } & DefaultSession["user"]
  }

  interface User extends DefaultUser {
    role?: UserRole
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string
    role?: UserRole
  }
}
