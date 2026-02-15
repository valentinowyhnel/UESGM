import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library'
import { logger } from './logger'

export interface ApiError {
  message: string
  code?: string
  statusCode: number
  details?: any
}

export class ApiException extends Error {
  statusCode: number
  code?: string
  details?: any

  constructor(message: string, statusCode: number = 500, code?: string, details?: any) {
    super(message)
    this.statusCode = statusCode
    this.code = code
    this.details = details
    this.name = 'ApiException'
  }
}

/**
 * Gestionnaire d'erreurs centralisé pour les routes API
 */
export function handleApiError(error: unknown, context?: string): NextResponse {
  // Log l'erreur
  logger.error('API', `Erreur dans ${context || 'API'}`, { error })

  // Erreur Zod (validation)
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: 'Données invalides',
        details: error.issues.map(issue => ({
          path: issue.path.join('.'),
          message: issue.message,
          code: issue.code,
        })),
      },
      { status: 400 }
    )
  }

  // Erreur Prisma
  if (error instanceof PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        return NextResponse.json(
          { error: 'Un enregistrement avec cette valeur existe déjà' },
          { status: 409 }
        )
      case 'P2025':
        return NextResponse.json(
          { error: 'Enregistrement non trouvé' },
          { status: 404 }
        )
      case 'P2003':
        return NextResponse.json(
          { error: 'Référence invalide' },
          { status: 400 }
        )
      default:
        logger.error('API', `Erreur Prisma non gérée: ${error.code}`, { error })
        return NextResponse.json(
          { error: 'Erreur de base de données' },
          { status: 500 }
        )
    }
  }

  // Erreur API personnalisée
  if (error instanceof ApiException) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
        details: error.details,
      },
      { status: error.statusCode }
    )
  }

  // Erreur générique
  if (error instanceof Error) {
    // En production, ne pas exposer les détails de l'erreur
    const isProduction = process.env.NODE_ENV === 'production'
    
    return NextResponse.json(
      {
        error: isProduction ? 'Erreur serveur' : error.message,
        ...(isProduction ? {} : { stack: error.stack }),
      },
      { status: 500 }
    )
  }

  // Erreur inconnue
  return NextResponse.json(
    { error: 'Erreur serveur inconnue' },
    { status: 500 }
  )
}

/**
 * Wrapper pour les handlers API avec gestion d'erreurs automatique
 */
export function withErrorHandling(
  handler: (req: Request) => Promise<NextResponse>,
  context?: string
) {
  return async (req: Request): Promise<NextResponse> => {
    try {
      return await handler(req)
    } catch (error) {
      return handleApiError(error, context)
    }
  }
}
