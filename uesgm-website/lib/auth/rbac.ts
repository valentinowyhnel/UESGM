import { Role } from '@prisma/client'

/**
 * Hiérarchie des rôles pour le RBAC
 */
export const ROLE_HIERARCHY: Record<Role, number> = {
  [Role.SUPER_ADMIN]: 4,
  [Role.ADMIN]: 3,
  [Role.MODERATOR]: 2,
  [Role.MEMBER]: 1,
  [Role.PUBLIC]: 0,
}

/**
 * Vérifie si un utilisateur a un rôle suffisant
 */
export function hasRequiredRole(userRole: Role, requiredRole: Role): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole]
}

/**
 * Permissions par ressource
 */
export const PERMISSIONS = {
  DOCUMENTS: {
    VIEW: Role.PUBLIC,
    CREATE: Role.MODERATOR,
    EDIT: Role.MODERATOR,
    DELETE: Role.ADMIN,
  },
  EVENTS: {
    VIEW: Role.PUBLIC,
    CREATE: Role.MODERATOR,
    EDIT: Role.MODERATOR,
    DELETE: Role.ADMIN,
  },
  PROJECTS: {
    VIEW: Role.PUBLIC,
    CREATE: Role.MODERATOR,
    EDIT: Role.MODERATOR,
    DELETE: Role.ADMIN,
  },
  ADMIN_PANEL: {
    ACCESS: Role.MODERATOR,
  },
  SETTINGS: {
    ACCESS: Role.ADMIN,
  },
  USERS: {
    VIEW: Role.ADMIN,
    MANAGE: Role.SUPER_ADMIN,
  }
}
