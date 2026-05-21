import { UserRole } from "@/types/next-auth"

const ROLE_HIERARCHY: Record<UserRole, number> = {
  SUPER_ADMIN: 4,
  ADMIN: 3,
  MODERATOR: 2,
  MEMBER: 1,
  PUBLIC: 0,
}

/**
 * Vérifie si un utilisateur a le rôle requis ou supérieur
 * @param userRole Le rôle de l'utilisateur courant
 * @param requiredRole Le rôle minimum requis
 * @returns boolean - true si l'utilisateur a la permission, false sinon
 */
export function hasRequiredRole(
  userRole: UserRole | undefined,
  requiredRole: UserRole
): boolean {
  if (!userRole) return false
  return (ROLE_HIERARCHY[userRole] ?? 0) >= (ROLE_HIERARCHY[requiredRole] ?? 0)
}
