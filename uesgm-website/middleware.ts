// Middleware pour l'authentification et la protection des routes
// Ce fichier remplace l'ancien proxy.ts pour une meilleure intégration Next.js

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { rateLimit } from '@/lib/rate-limit'

// Routes publiques qui ne nécessitent pas d'authentification
const publicPaths = [
  "/",
  "/a-propos",
  "/bureau-executif",
  "/contact",
  "/evenements",
  "/partenaires",
  "/antennes",
  "/bibliotheque",
  "/projets",
  "/login",
  "/auth/error",
  "/unauthorized",
  "/api/auth/**",
  "/api/health",
  "/api/test-simple",
  "/api/search",
  "/api/statistics",
  "/api/verification",
  "/api/contact",
  "/api/contact-v2",
  "/api/documents/**",
  "/api/events/public/**",
  "/api/sse/**",  // SSE pour temps réel
]

// ============================================
// SÉCURITÉ: Whitelist pour les redirections
// ============================================
const ALLOWED_ADMIN_PATHS = [
  '/admin/dashboard',
  '/admin',
  '/admin/bibliotheque',
  '/admin/evenements',
  '/admin/projets',
  '/admin/membres',
  '/admin/documents',
  '/admin/newsletter',
  '/admin/security',
  '/admin/parametres',
  '/admin/super',
  '/super-admin',
]

// Fonction pour valider une URL de redirection
function isSafeRedirectUrl(url: string, baseUrl: string): boolean {
  try {
    const urlObj = new URL(url, baseUrl)
    // Vérifier même origine
    if (urlObj.origin !== baseUrl) return false
    // Vérifier whitelist
    return ALLOWED_ADMIN_PATHS.some(
      path => urlObj.pathname === path || urlObj.pathname.startsWith(path + '/')
    )
  } catch {
    return false
  }
}

// Routes sensibles avec rate limiting renforcé
const sensitiveRoutes: Record<string, { limit: number; windowMs: number }> = {
  '/api/contact': { limit: 5, windowMs: 15 * 60 * 1000 },
  '/api/auth': { limit: 10, windowMs: 15 * 60 * 1000 },
  '/api/upload': { limit: 20, windowMs: 60 * 60 * 1000 },
}

// Routes publiques pour rate limiting
const publicRoutes = ['/api/health', '/api/test-simple']

// Headers de sécurité pour toutes les réponses
function addSecurityHeaders(response: NextResponse) {
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  return response
}

// Headers de sécurité renforcés pour les routes admin
function addAdminSecurityHeaders(response: NextResponse) {
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'no-referrer')
  // Empêcher la mise en cache des pages admin
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0')
  response.headers.set('Pragma', 'no-cache')
  response.headers.set('Expires', '0')
  response.headers.set('Surrogate-Control', 'no-store')
  return response
}

// Rate limiting middleware
async function checkRateLimit(request: NextRequest, pathname: string): Promise<NextResponse | null> {
  // Skip rate limiting pour les routes publiques
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return null
  }

  // Rate limiting spécifique pour les routes sensibles
  const sensitiveRoute = Object.keys(sensitiveRoutes).find(route => pathname.startsWith(route))
  
  let limit = 100 // Default limit
  let windowMs = 60 * 60 * 1000 // 1 hour

  if (sensitiveRoute) {
    limit = sensitiveRoutes[sensitiveRoute].limit
    windowMs = sensitiveRoutes[sensitiveRoute].windowMs
  }

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
             request.headers.get('x-real-ip') || 
             'unknown'

  const allowed = await rateLimit({
    id: `${pathname}:${ip}`,
    limit,
    windowMs,
  })

  if (!allowed) {
    const response = NextResponse.json(
      { error: 'Trop de requêtes. Veuillez réessayer plus tard.' },
      { status: 429 }
    )
    response.headers.set('Retry-After', String(Math.floor(windowMs / 1000)))
    return addSecurityHeaders(response)
  }

  return null
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Ajouter les headers de sécurité
  const response = NextResponse.next()
  addSecurityHeaders(response)

  // Skip pour les fichiers statiques
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.startsWith('/images') ||
    pathname.includes('.') // fichiers avec extension
  ) {
    return response
  }

  // Apply rate limiting pour les routes API
  if (pathname.startsWith('/api/')) {
    const rateLimitResponse = await checkRateLimit(request, pathname)
    if (rateLimitResponse) {
      return rateLimitResponse
    }
  }

  // Vérifier si le chemin est public
  const isPublicPath = publicPaths.some(path => {
    if (path.endsWith('**')) {
      return pathname.startsWith(path.slice(0, -2))
    }
    if (path.includes('**')) {
      const prefix = path.replace('**', '')
      return pathname.startsWith(prefix)
    }
    return pathname === path || pathname.startsWith(path)
  })

  if (isPublicPath) {
    return response
  }

  // Ajouter des headers de sécurité renforcés pour les routes admin
  const isAdminPath = pathname.startsWith('/admin') || pathname.startsWith('/api/admin') || pathname.startsWith('/super-admin')
  if (isAdminPath) {
    addAdminSecurityHeaders(response)
  }

  // Empêcher l'accès à /login si déjà authentifié
  if (pathname === '/login' || pathname === '/portal') {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
    if (token) {
      // Utiliser leResponse.redirect au lieu de NextResponse.redirect pour éviter les problèmes
      const redirectResponse = NextResponse.redirect(new URL('/admin/dashboard', request.url))
      return addSecurityHeaders(redirectResponse)
    }
    return response
  }

  // Routes protégées - vérifier l'authentification
  const protectedPaths = ['/admin', '/api/admin', '/super-admin']
  const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path))

  if (isProtectedPath) {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })

    if (!token) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('callbackUrl', encodeURI(pathname))
      const redirectResponse = NextResponse.redirect(loginUrl)
      return addSecurityHeaders(redirectResponse)
    }

    // Vérifier le rôle pour les routes admin
    if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
      const userRole = (token.role as string) || 'MEMBER'
      if (userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN') {
        const redirectResponse = NextResponse.redirect(new URL('/unauthorized', request.url))
        return addSecurityHeaders(redirectResponse)
      }
    }

    // Vérifier le rôle pour les routes super-admin
    if (pathname.startsWith('/super-admin')) {
      const userRole = (token.role as string) || 'MEMBER'
      if (userRole !== 'SUPER_ADMIN') {
        const redirectResponse = NextResponse.redirect(new URL('/unauthorized', request.url))
        return addSecurityHeaders(redirectResponse)
      }
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
