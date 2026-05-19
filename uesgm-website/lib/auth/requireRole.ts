import { getServerSession } from "next-auth/next"
import { Role } from "@prisma/client"
import { authOptions } from "@/lib/auth/auth-options"
import { NextResponse } from "next/server"

/**
 * Helper to require a specific role or higher for an API route or Server Action.
 * Roles order: PUBLIC < MEMBER < MODERATOR < ADMIN < SUPER_ADMIN
 */
const ROLE_HIERARCHY: Record<Role, number> = {
  [Role.PUBLIC]: 0,
  [Role.MEMBER]: 1,
  [Role.MODERATOR]: 2,
  [Role.ADMIN]: 3,
  [Role.SUPER_ADMIN]: 4,
}

export async function requireRole(minRole: Role) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return {
      authorized: false,
      response: NextResponse.json({ error: "Authentification requise" }, { status: 401 }),
      session: null
    }
  }

  const userRole = (session.user as any).role as Role || Role.MEMBER

  if (ROLE_HIERARCHY[userRole] < ROLE_HIERARCHY[minRole]) {
    return {
      authorized: false,
      response: NextResponse.json({ error: "Permissions insuffisantes" }, { status: 403 }),
      session
    }
  }

  return {
    authorized: true,
    response: null,
    session
  }
}

/**
 * Higher-order function to wrap a route handler with role protection
 */
export function withRole(role: Role, handler: Function) {
  return async (req: Request, ...args: any[]) => {
    const { authorized, response, session } = await requireRole(role)
    if (!authorized) return response
    return handler(req, session, ...args)
  }
}
