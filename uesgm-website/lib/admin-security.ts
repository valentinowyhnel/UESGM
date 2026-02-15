import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { NextResponse } from "next/server"

// Rôles autorisés pour les actions critiques
export const ADMIN_ROLES = ['ADMIN', 'SUPER_ADMIN'] as const
export type AdminRole = typeof ADMIN_ROLES[number]

// Types d'actions admin
export type AdminAction = 
  | 'create'
  | 'update' 
  | 'delete'
  | 'publish'
  | 'unpublish'
  | 'suspend'
  | 'archive'
  | 'upload'

// Types MIME autorisés
type AllowedMimeType = 
  | 'application/pdf'
  | 'application/msword'
  | 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  | 'application/vnd.ms-excel'
  | 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  | 'application/vnd.ms-powerpoint'
  | 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  | 'image/jpeg'
  | 'image/png'
  | 'image/webp'
  | 'video/mp4';

// Configuration des limites de taille pour les uploads
type UploadLimits = {
  [key: string]: {
    maxSize: number;
    allowedTypes: AllowedMimeType[];
  };
};

export const UPLOAD_LIMITS: UploadLimits = {
  // Documents (PDF, Word, Excel, PowerPoint)
  documents: {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ]
  },
  // Images (JPEG, PNG, WebP)
  images: {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: [
      'image/jpeg',
      'image/png', 
      'image/webp'
    ]
  },
  // Vidéos (MP4 limité)
  videos: {
    maxSize: 50 * 1024 * 1024, // 50MB
    allowedTypes: [
      'video/mp4'
    ]
  }
}

// Vérification des permissions côté serveur
export async function requireAdminRole(action?: AdminAction) {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return {
      success: false,
      error: "Non authentifié",
      redirectTo: "/login"
    }
  }

  const userRole = (session.user as any)?.role
  if (!userRole || !ADMIN_ROLES.includes(userRole)) {
    return {
      success: false,
      error: "Permissions insuffisantes",
      redirectTo: "/unauthorized"
    }
  }

  // Vérifications supplémentaires pour les actions critiques
  if (action === 'delete' && userRole !== 'SUPER_ADMIN') {
    return {
      success: false,
      error: "Seul un super-admin peut supprimer",
      redirectTo: "/unauthorized"
    }
  }

  return {
    success: true,
    user: session.user
  }
}

// Validation des fichiers uploadés
export function validateUploadedFile(file: File, category: keyof typeof UPLOAD_LIMITS) {
  const limits = UPLOAD_LIMITS[category]
  
  if (!limits) {
    return {
      valid: false,
      error: "Catégorie de fichier non valide"
    }
  }

  // Vérification de la taille
  if (file.size > limits.maxSize) {
    const maxSizeMB = limits.maxSize / (1024 * 1024)
    return {
      valid: false,
      error: `Fichier trop volumineux. Maximum ${maxSizeMB}MB autorisé`
    }
  }

  // Vérification du type MIME
  const fileType = file.type as AllowedMimeType;
  if (!limits.allowedTypes.includes(fileType)) {
    return {
      valid: false,
      error: `Type de fichier non autorisé. Types acceptés: ${limits.allowedTypes.join(', ')}`
    }
  }

  return {
    valid: true
  }
}

// Middleware pour les routes API
type ApiHandler = (req: Request, ...args: unknown[]) => Promise<Response>;

export function withAdminAuth(handler: ApiHandler) {
  return async (req: Request, ...args: unknown[]) => {
    // Vérification des permissions
    const auth = await requireAdminRole()
    if (!auth.success) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.redirectTo === "/login" ? 401 : 403 }
      )
    }

    // Ajout de l'utilisateur à la requête
    const reqWithUser = req as Request & { user: NonNullable<typeof auth.user> }
    reqWithUser.user = auth.user!

    try {
      return await handler(req, ...args)
    } catch (error: any) {
      console.error('Admin API Error:', error)
      return NextResponse.json(
        { error: "Erreur interne du serveur" },
        { status: 500 }
      )
    }
  }
}

// Log des actions admin pour audit
export async function logAdminAction(
  userId: string,
  action: AdminAction,
  resource: string,
  resourceId?: string,
  details?: any
) {
  try {
    // TODO: Implémenter un système de logging en base de données
    console.log(`[ADMIN AUDIT] User: ${userId}, Action: ${action}, Resource: ${resource}${resourceId ? `, ID: ${resourceId}` : ''}`, details)
    
    // Pour l'instant, on log en console
    // En production, utiliser une table d'audit ou un service externe
  } catch (error) {
    console.error('Failed to log admin action:', error)
  }
}

// Validation des données de formulaire
export function validateAdminData(data: any, resource: string) {
  const errors: string[] = []

  switch (resource) {
    case 'project':
      if (!data.title || data.title.length < 3) {
        errors.push("Le titre doit contenir au moins 3 caractères")
      }
      if (!data.description || data.description.length < 10) {
        errors.push("La description doit contenir au moins 10 caractères")
      }
      if (!data.category) {
        errors.push("La catégorie est requise")
      }
      break

    case 'event':
      if (!data.title || data.title.length < 3) {
        errors.push("Le titre doit contenir au moins 3 caractères")
      }
      if (!data.date) {
        errors.push("La date est requise")
      }
      if (!data.location) {
        errors.push("Le lieu est requis")
      }
      break

    case 'document':
      if (!data.title || data.title.length < 3) {
        errors.push("Le titre doit contenir au moins 3 caractères")
      }
      if (!data.category) {
        errors.push("La catégorie est requise")
      }
      break

    case 'newsletter':
      if (!data.subject || data.subject.length < 5) {
        errors.push("Le sujet doit contenir au moins 5 caractères")
      }
      if (!data.content || data.content.length < 20) {
        errors.push("Le contenu doit contenir au moins 20 caractères")
      }
      break
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}
