import { getServerSession } from "next-auth"
import { authOptions } from "./auth-options"
import { hasRequiredRole } from "./rbac"
import { UserRole } from "@/types/next-auth"
import { NextResponse } from "next/server"

/**
 * Helper to require a role in a Route Handler
 * @param requiredRole The role required
 * @returns The session if authorized, or a 403 Response
 */
export async function requireRole(requiredRole: UserRole) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return { authorized: false, response: NextResponse.json({ error: "Non authentifié" }, { status: 401 }), session: null }
  }

  if (!hasRequiredRole(session.user?.role, requiredRole)) {
    return { authorized: false, response: NextResponse.json({ error: `Rôle ${requiredRole} requis` }, { status: 403 }), session: session }
  }

  return { authorized: true, response: null, session: session }
}
