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

// Types de fichiers autorisés
export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'image/jpeg',
  'image/png',
  'image/gif',
  'text/plain'
] as const

export const MAX_FILE_SIZE = 20 * 1024 * 1024 // 20MB

// Schéma de validation pour les documents
export const documentSchema = z.object({
  title: z.string().min(4, 'Le titre doit contenir au moins 4 caractères'),
  description: z.string().optional(),
  category: z.enum(['STATUTS', 'RAPPORTS', 'GUIDES', 'ACADEMIQUE', 'JURIDIQUE', 'ADMINISTRATIF']),
  visibility: z.enum(['PUBLIC', 'MEMBERS_ONLY', 'ADMIN_ONLY']).default('PUBLIC'),
  tags: z.array(z.string().min(1).max(50)).optional()
})

// Schéma pour la mise à jour partielle
export const documentUpdateSchema = documentSchema.partial()

// Schéma pour le téléchargement
export const documentDownloadSchema = z.object({
  slug: z.string().min(1),
  userAgent: z.string().optional(),
  ipAddress: z.string().optional()
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

// Validation de fichier
export function validateFile(file: File): { valid: boolean; error?: string } {
  if (!file) {
    return { valid: false, error: 'Aucun fichier fourni' }
  }

  // Vérifier la taille
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: 'Le fichier est trop volumineux (max 20MB)' }
  }

  // Vérifier le type MIME
  if (!ALLOWED_MIME_TYPES.includes(file.type as any)) {
    return { valid: false, error: 'Type de fichier non autorisé' }
  }

  return { valid: true }
}

// Génération de slug à partir du titre
export function generateDocumentSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Supprimer les caractères spéciaux
    .replace(/\s+/g, '-') // Remplacer les espaces par des tirets
    .replace(/-+/g, '-') // Supprimer les tirets multiples
    .trim()
}

// Génération de nom de fichier unique
export function generateFileName(originalName: string): string {
  const timestamp = Date.now()
  const randomString = Math.random().toString(36).substring(2, 8)
  const extension = originalName.split('.').pop()
  return `doc-${timestamp}-${randomString}.${extension}`
}

// Génération du chemin de stockage
export function generateStoragePath(fileName: string): string {
  const year = new Date().getFullYear()
  return `documents/${year}/${fileName}`
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

// Fonctions de formatage
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export function getMimeTypeIcon(mimeType: string): string {
  const iconMap: Record<string, string> = {
    'application/pdf': '📄',
    'application/msword': '📝',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '📝',
    'application/vnd.ms-excel': '📊',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '📊',
    'application/vnd.ms-powerpoint': '📽️',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': '📽️',
    'image/jpeg': '🖼️',
    'image/png': '🖼️',
    'image/gif': '🖼️',
    'text/plain': '📄'
  }
  
  return iconMap[mimeType] || '📄'
}

export function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    'STATUTS': 'Statuts',
    'RAPPORTS': 'Rapports',
    'GUIDES': 'Guides',
    'ACADEMIQUE': 'Académique',
    'JURIDIQUE': 'Juridique',
    'ADMINISTRATIF': 'Administratif'
  }
  
  return labels[category] || category
}

export function getVisibilityLabel(visibility: string): string {
  const labels: Record<string, string> = {
    'PUBLIC': 'Public',
    'MEMBERS_ONLY': 'Membres uniquement',
    'ADMIN_ONLY': 'Admin uniquement'
  }
  
  return labels[visibility] || visibility
}
