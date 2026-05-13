import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { NextResponse } from "next/server"
import { Role } from "@prisma/client"

/**
 * Reusable helper to enforce roles in Server Actions or Route Handlers.
 * Returns the session if authorized, otherwise returns a NextResponse error.
 */
export async function requireRole(allowedRoles: Role[]) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return {
      authorized: false,
      response: NextResponse.json({ error: "Non authentifié" }, { status: 401 }),
      session: null
    }
  }

  const userRole = (session.user.role as Role) || Role.MEMBER

  if (!allowedRoles.includes(userRole)) {
    return {
      authorized: false,
      response: NextResponse.json({ error: "Accès refusé" }, { status: 403 }),
      session
    }
  }

  return { authorized: true, response: null, session }
}
