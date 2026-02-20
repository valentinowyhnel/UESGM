import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { NextResponse } from "next/server"
import { ZodError } from "zod"
import { prisma } from "@/lib/prisma"

// ============================================
// TYPES ET INTERFACES
// ============================================

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

// Type pour les réponses API standardisées
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
  timestamp?: string
}

// ============================================
// CONFIGURATION DE SÉCURITÉ
// ============================================

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
  images: {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: [
      'image/jpeg',
      'image/png', 
      'image/webp'
    ]
  },
  videos: {
    maxSize: 50 * 1024 * 1024, // 50MB
    allowedTypes: [
      'video/mp4'
    ]
  }
}

// ============================================
// FONCTIONS DE SÉCURITÉ
// ============================================

/**
 * Sanitize input string to prevent XSS
 */
export function sanitizeInput(input: string): string {
  if (!input) return ''
  return input
    .replace(/[<>]/g, '') // Remove < and >
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .trim()
}

/**
 * Validate and sanitize object fields
 */
export function sanitizeObject<T extends Record<string, any>>(
  obj: T, 
  fields: (keyof T)[]
): Partial<T> {
  const sanitized: Partial<T> = {}
  
  for (const field of fields) {
    if (typeof obj[field] === 'string') {
      (sanitized as any)[field] = sanitizeInput(obj[field])
    } else if (obj[field] !== undefined) {
      (sanitized as any)[field] = obj[field]
    }
  }
  
  return sanitized
}

/**
 * Generate request ID for tracing
 */
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
}

/**
 * Create standardized error response
 */
export function createErrorResponse(
  error: string, 
  status: number = 400,
  requestId?: string
): NextResponse<ApiResponse> {
  return NextResponse.json(
    {
      success: false,
      error,
      timestamp: new Date().toISOString(),
      ...(requestId && { requestId })
    },
    { status }
  )
}

/**
 * Create standardized success response
 */
export function createSuccessResponse<T>(
  data: T,
  message?: string,
  requestId?: string
): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      message,
      timestamp: new Date().toISOString(),
      ...(requestId && { requestId })
    },
    { status: 200 }
  )
}

// ============================================
// AUTHENTIFICATION ET AUTORISATION
// ============================================

/**
 * Vérification des permissions admin
 */
export async function requireAdminRole(action?: AdminAction) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.email) {
    return {
      success: false,
      error: "Non authentifié",
      redirectTo: "/portal"
    }
  }

  // Vérifier le rôle admin en base de données
  const dbUser = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, role: true, name: true }
  })
  
  if (!dbUser || (dbUser.role !== 'ADMIN' && dbUser.role !== 'SUPER_ADMIN')) {
    return {
      success: false,
      error: "Permissions insuffisantes",
      redirectTo: "/unauthorized"
    }
  }

  // Vérifications supplémentaires pour les actions critiques
  if (action === 'delete' && dbUser.role !== 'SUPER_ADMIN') {
    return {
      success: false,
      error: "Seul un super-admin peut supprimer",
      redirectTo: "/unauthorized"
    }
  }

  // Retourner l'utilisateur avec le bon ID de la base de données
  return {
    success: true,
    user: {
      ...session.user,
      id: dbUser.id,
      name: dbUser.name || session.user.name
    }
  }
}

// ============================================
// VALIDATION DES FICHIERS
// ============================================

/**
 * Validation des fichiers uploadés
 */
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

// ============================================
// MIDDLEWARE API AVANCÉ
// ============================================

type ApiHandler = (req: Request, ...args: unknown[]) => Promise<Response>;

/**
 * Middleware principal d'authentification et sécurité
 */
export function withAdminAuth(handler: ApiHandler) {
  return async (req: Request, ...args: unknown[]) => {
    const requestId = generateRequestId()
    const startTime = Date.now()
    
    // Logging de la requête
    console.log(`[${requestId}] ${req.method} ${req.url} - Started`)

    // Vérification des permissions
    const auth = await requireAdminRole()
    if (!auth.success) {
      console.log(`[${requestId}] Auth failed: ${auth.error}`)
      return createErrorResponse(auth.error, auth.redirectTo === "/portal" ? 401 : 403, requestId)
    }

    // Ajout de l'utilisateur à la requête
    const reqWithUser = req as Request & { user: any; requestId: string }
    reqWithUser.user = auth.user
    reqWithUser.requestId = requestId

    try {
      const response = await handler(req, ...args)
      const duration = Date.now() - startTime
      
      console.log(`[${requestId}] Completed in ${duration}ms - Status: ${response.status}`)
      
      return response
    } catch (error: any) {
      const duration = Date.now() - startTime
      console.error(`[${requestId}] Error after ${duration}ms:`, error)
      
      // Handle Zod validation errors
      if (error instanceof ZodError) {
        const validationErrors = (error as any).issues || []
        const messages = validationErrors.map((e: any) => e.message).join(', ')
        return createErrorResponse(
          `Validation error: ${messages}`,
          400,
          requestId
        )
      }
      
      return createErrorResponse(
        error.message || "Erreur interne du serveur",
        500,
        requestId
      )
    }
  }
}

/**
 * Middleware pour les actions critiques (suppression)
 */
export function withCriticalAction(handler: ApiHandler) {
  return withAdminAuth(async (req: Request, ...args: unknown[]) => {
    const auth = await requireAdminRole('delete')
    if (!auth.success) {
      return createErrorResponse(auth.error, 403)
    }
    return handler(req, ...args)
  })
}

/**
 * Middleware pour valider le contenu JSON
 */
export function withJsonBody<T>(handler: (req: Request, body: T, ...args: any[]) => Promise<Response>) {
  return async (req: Request, ...args: unknown[]) => {
    const contentType = req.headers.get('content-type')
    
    if (!contentType || !contentType.includes('application/json')) {
      return createErrorResponse("Content-Type must be application/json", 415)
    }

    try {
      const body = await req.json()
      return handler(req, body, ...args)
    } catch (error) {
      if (error instanceof SyntaxError) {
        return createErrorResponse("Invalid JSON body", 400)
      }
      throw error
    }
  }
}

// ============================================
// LOGGING D'AUDIT
// ============================================

/**
 * Log des actions admin pour audit
 */
export async function logAdminAction(
  userId: string,
  action: AdminAction,
  resource: string,
  resourceId?: string,
  details?: any
) {
  const timestamp = new Date().toISOString()
  const logEntry = {
    timestamp,
    userId,
    action,
    resource,
    resourceId,
    details
  }
  
  try {
    // Log en console pour le développement
    console.log(`[ADMIN AUDIT]`, JSON.stringify(logEntry))
    
    // TODO: Implémenter un système de logging en base de données
    // await prisma.adminAuditLog.create({ data: logEntry })
    
  } catch (error) {
    console.error('Failed to log admin action:', error)
  }
}

// ============================================
// VALIDATION DES DONNÉES
// ============================================

/**
 * Validation des données de formulaire
 */
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

/**
 * Validate UUID format
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

/**
 * Validate pagination params
 */
export function validatePagination(params: URLSearchParams) {
  const page = parseInt(params.get('page') || '1')
  const limit = parseInt(params.get('limit') || '10')
  
  return {
    page: Math.max(1, page),
    limit: Math.min(100, Math.max(1, limit)), // Max 100 items per page
    offset: (Math.max(1, page) - 1) * Math.min(100, Math.max(1, limit))
  }
}
