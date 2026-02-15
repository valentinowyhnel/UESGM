import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { z } from 'zod'

// Types pour les rôles
export type AdminRole = 'ADMIN' | 'SUPER_ADMIN'

// Interface utilisateur avec rôle
interface AdminUser {
  id: string
  email: string
  name?: string
  role: AdminRole
}

// Schéma de validation pour les données de projet
export const projectSchema = z.object({
  title: z.string().min(5, 'Le titre doit contenir au moins 5 caractères'),
  shortDesc: z.string().max(150, 'La description courte ne doit pas dépasser 150 caractères'),
  description: z.string().min(30, 'La description doit contenir au moins 30 caractères'),
  category: z.enum(['EDUCATION', 'SOCIAL', 'HEALTH', 'DIGITAL', 'PARTNERSHIP']),
  status: z.enum(['PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).default('PLANNED'),
  progress: z.number().int().min(0).max(100).default(0),
  tags: z.array(z.string().min(1).max(50)).optional(),
  imageUrl: z.string().url().optional().nullable(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  isPublished: z.boolean().default(false)
})

// Schéma pour la mise à jour partielle
export const projectUpdateSchema = projectSchema.partial().extend({
  slug: z.string().optional(),
  tags: z.array(z.string().min(1).max(50)).optional()
})

// Schéma pour le changement de statut
export const projectStatusSchema = z.object({
  status: z.enum(['PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'])
})

// Schéma pour la publication
export const projectPublishSchema = z.object({
  isPublished: z.boolean()
})

// Middleware de vérification admin
export async function requireAdmin(req: NextRequest): Promise<{ user: AdminUser } | NextResponse> {
  try {
    // Vérifier la session NextAuth
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    // Vérifier le rôle admin (pour l'instant, nous simulons avec une vérification simple)
    // En production, vous devriez vérifier le rôle depuis la base de données
    const adminEmails = ['admin@esgm.org', 'superadmin@esgm.org'] // À remplacer par une vraie vérification DB
    
    if (!adminEmails.includes(session.user.email)) {
      return NextResponse.json(
        { error: 'Accès non autorisé' },
        { status: 403 }
      )
    }

    // Déterminer le rôle
    const role: AdminRole = session.user.email === 'superadmin@esgm.org' ? 'SUPER_ADMIN' : 'ADMIN'

    const user: AdminUser = {
      id: (session.user as any).id || 'admin-1',
      email: session.user.email!,
      name: session.user.name || 'Admin',
      role
    }

    return { user }
  } catch (error) {
    console.error('Erreur dans requireAdmin:', error)
    return NextResponse.json(
      { error: 'Erreur de vérification d\'authentification' },
      { status: 500 }
    )
  }
}

// Wrapper pour les handlers API avec authentification admin
export function withAdminAuth<T extends NextRequest>(
  handler: (req: T, user: AdminUser, params?: any) => Promise<NextResponse>
) {
  return async (req: T, params?: any): Promise<NextResponse> => {
    const authResult = await requireAdmin(req)
    
    if (authResult instanceof NextResponse) {
      return authResult
    }
    
    return handler(req, authResult.user, params)
  }
}

// Fonction de logging des actions admin
export async function logAdminAction(
  userId: string,
  action: string,
  resourceType: string,
  resourceId: string,
  details?: any
) {
  try {
    // En production, sauvegarder dans une table d'audit
    console.log(`🔐 ADMIN ACTION: ${action} ${resourceType}:${resourceId} by user:${userId}`, details)
    
    // TODO: Implémenter le logging en base de données
    // await prisma.adminAuditLog.create({
    //   data: {
    //     userId,
    //     action,
    //     resourceType,
    //     resourceId,
    //     details: details ? JSON.stringify(details) : null,
    //     timestamp: new Date()
    //   }
    // })
  } catch (error) {
    console.error('Erreur lors du logging admin:', error)
  }
}

// Validation des transitions de statut
export function validateProjectStatusTransition(
  currentStatus: string,
  newStatus: string
): boolean {
  const validTransitions: Record<string, string[]> = {
    'PLANNED': ['IN_PROGRESS', 'CANCELLED'],
    'IN_PROGRESS': ['COMPLETED', 'CANCELLED'],
    'COMPLETED': [], // Pas de transition depuis COMPLETED
    'CANCELLED': ['PLANNED'] // Peut être réactivé
  }

  return validTransitions[currentStatus]?.includes(newStatus) || false
}

// Génération de slug à partir du titre
export function generateProjectSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Supprimer les caractères spéciaux
    .replace(/\s+/g, '-') // Remplacer les espaces par des tirets
    .replace(/-+/g, '-') // Supprimer les tirets multiples
    .trim()
}

// Validation de la progression
export function validateProjectProgress(progress: number): boolean {
  return progress >= 0 && progress <= 100
}

// Rate limiting simple (en production, utiliser Redis ou une vraie solution)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

export function checkRateLimit(
  identifier: string,
  limit: number = 100,
  windowMs: number = 15 * 60 * 1000 // 15 minutes
): boolean {
  const now = Date.now()
  const record = rateLimitMap.get(identifier)

  if (!record || now > record.resetTime) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + windowMs })
    return true
  }

  if (record.count >= limit) {
    return false
  }

  record.count++
  return true
}

// Nettoyage des anciens enregistrements de rate limiting
setInterval(() => {
  const now = Date.now()
  for (const [key, record] of rateLimitMap.entries()) {
    if (now > record.resetTime) {
      rateLimitMap.delete(key)
    }
  }
}, 5 * 60 * 1000) // Nettoyer toutes les 5 minutes
