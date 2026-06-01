import { Role } from "@prisma/client"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { hasRequiredRole } from "./rbac"
import { NextResponse } from "next/server"

/**
 * Helper pour exiger un rôle spécifique dans une route API Next.js
 * @param requiredRole Rôle minimum requis
 */
export async function requireRole(requiredRole: Role) {
  const session = await getServerSession(authOptions)

  if (!session || !session.user) {
    return {
      authorized: false,
      response: NextResponse.json({ error: "Non authentifié" }, { status: 401 }),
      session: null
    }
  }

  const userRole = (session.user as any).role as Role
  if (!hasRequiredRole(userRole, requiredRole)) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: `Accès refusé : rôle ${requiredRole} requis` },
        { status: 403 }
      ),
      session
    }
  }

  return { authorized: true, session, user: session.user }
}
