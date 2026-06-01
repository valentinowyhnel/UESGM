import { Role } from "@prisma/client"

export const ROLE_HIERARCHY: Record<Role, number> = {
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
  userRole: Role | undefined,
  requiredRole: Role
): boolean {
  if (!userRole) return requiredRole === Role.PUBLIC
  return (ROLE_HIERARCHY[userRole] || 0) >= (ROLE_HIERARCHY[requiredRole] || 0)
}

/**
 * Vérifie si un utilisateur a exactement le rôle spécifié
 * @param userRole Le rôle de l'utilisateur
 * @param requiredRole Le rôle à vérifier
 * @returns boolean - true si les rôles correspondent exactement
 */
export function hasExactRole(
  userRole: Role | undefined,
  requiredRole: Role
): boolean {
  return userRole === requiredRole
}

/**
 * Obtient tous les rôles disponibles
 * @returns Un tableau de tous les rôles disponibles
 */
export function getAllRoles(): Role[] {
  return Object.keys(ROLE_HIERARCHY) as Role[]
}

/**
 * Obtient le niveau hiérarchique d'un rôle
 * @param role Le rôle dont on veut obtenir le niveau
 * @returns Le niveau hiérarchique du rôle
 */
export function getRoleLevel(role: Role): number {
  return ROLE_HIERARCHY[role] || 0
}
