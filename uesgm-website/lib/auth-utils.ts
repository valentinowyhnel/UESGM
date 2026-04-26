import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth/auth-options"
import { Role } from "@prisma/client"

export async function isAdmin() {
  const session = await getServerSession(authOptions)
  if (!session || !session.user) return false
  const role = (session.user as any).role
  return role === Role.ADMIN || role === Role.SUPER_ADMIN
}

export async function isSuperAdmin() {
  const session = await getServerSession(authOptions)
  if (!session || !session.user) return false
  const role = (session.user as any).role
  return role === Role.SUPER_ADMIN
}

export async function getSession() {
  return await getServerSession(authOptions)
}
