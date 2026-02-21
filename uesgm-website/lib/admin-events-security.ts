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

// Schéma de base pour la validation des dates d'événement
export const eventDateSchema = z.object({
  startDate: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), {
      message: 'Date de début invalide',
    })
    .refine((val) => new Date(val) > new Date(), {
      message: 'La date de début doit être dans le futur',
    }),
  endDate: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), {
      message: 'Date de fin invalide',
    })
    .optional(),
}).refine(
  (data) => !data.endDate || new Date(data.endDate) >= new Date(data.startDate),
  { message: 'La date de fin doit être après la date de début' }
);

// Schéma de validation pour les données d'événement
export const eventSchema = z.object({
  title: z.string().min(5, 'Le titre doit contenir au moins 5 caractères'),
  description: z.string().min(20, 'La description doit contenir au moins 20 caractères'),
  location: z.string().min(3, 'Le lieu est requis'),
  category: z.enum(['INTEGRATION', 'ACADEMIC', 'SOCIAL', 'CULTURAL']),
  startDate: eventDateSchema.shape.startDate,
  endDate: eventDateSchema.shape.endDate,
  maxAttendees: z.number().int().positive().optional(),
  imageUrl: z.string().url().optional().nullable(),
})

// Schéma pour la mise à jour partielle
export const eventUpdateSchema = eventSchema.partial()

// Schéma pour le changement de statut
export const eventStatusSchema = z.object({
  status: z.enum(['DRAFT', 'PUBLISHED', 'SCHEDULED', 'ARCHIVED'])
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

    // Vérifier le rôle admin en base de données
    const { PrismaClient } = await import('@prisma/client')
    const prisma = new PrismaClient()
    
    const dbUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true, name: true }
    })
    
    if (!dbUser || (dbUser.role !== 'ADMIN' && dbUser.role !== 'SUPER_ADMIN')) {
      return NextResponse.json(
        { error: 'Accès non autorisé - Rôle admin requis' },
        { status: 403 }
      )
    }

    // Déterminer le rôle
    const role: AdminRole = dbUser.role === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : 'ADMIN'

    const user: AdminUser = {
      id: dbUser.id,
      email: session.user.email!,
      name: dbUser.name || session.user.name || 'Admin',
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
export function validateStatusTransition(
  currentStatus: string,
  newStatus: string
): boolean {
  const validTransitions: Record<string, string[]> = {
    'DRAFT': ['PUBLISHED', 'ARCHIVED'],
    'PUBLISHED': ['ARCHIVED'],
    'ARCHIVED': [] // Pas de transition depuis ARCHIVED
  }

  return validTransitions[currentStatus]?.includes(newStatus) || false
}

// Génération de slug à partir du titre
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Supprimer les caractères spéciaux
    .replace(/\s+/g, '-') // Remplacer les espaces par des tirets
    .replace(/-+/g, '-') // Supprimer les tirets multiples
    .trim()
}

// Fonction utilitaire pour valider les dates (maintenue pour la rétrocompatibilité)
export function validateEventDates(startDate: Date, endDate?: Date): boolean {
  try {
    const result = eventDateSchema.safeParse({
      startDate: startDate.toISOString(),
      endDate: endDate?.toISOString()
    });
    return result.success;
  } catch (error) {
    return false;
  }
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
