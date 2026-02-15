import { UserRole } from "@/types/next-auth"

const ROLE_HIERARCHY: Record<UserRole, number> = {
  SUPER_ADMIN: 3,
  ADMIN: 2,
  MEMBER: 1,
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
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole]
}

/**
 * Crée une fonction de vérification de rôle pour une utilisation dans les routes API
 * @param requiredRole Le rôle minimum requis
 * @returns Une fonction qui peut être utilisée pour protéger les routes
 * @throws {Error} Si l'utilisateur n'a pas le rôle requis
 */
export function requireRole(requiredRole: UserRole) {
  return (session: any) => {
    if (!session?.user?.role) {
      throw new Error("Non authentifié")
    }

    if (!hasRequiredRole(session.user.role, requiredRole)) {
      throw new Error(`Accès refusé : rôle ${requiredRole} requis`)
    }

    return true
  }
}

/**
 * Vérifie si un utilisateur a exactement le rôle spécifié
 * @param userRole Le rôle de l'utilisateur
 * @param requiredRole Le rôle à vérifier
 * @returns boolean - true si les rôles correspondent exactement
 */
export function hasExactRole(
  userRole: UserRole | undefined,
  requiredRole: UserRole
): boolean {
  return userRole === requiredRole
}

/**
 * Obtient tous les rôles disponibles
 * @returns Un tableau de tous les rôles disponibles
 */
export function getAllRoles(): UserRole[] {
  return Object.keys(ROLE_HIERARCHY) as UserRole[]
}

/**
 * Obtient le niveau hiérarchique d'un rôle
 * @param role Le rôle dont on veut obtenir le niveau
 * @returns Le niveau hiérarchique du rôle
 */
export function getRoleLevel(role: UserRole): number {
  return ROLE_HIERARCHY[role] || 0
}
