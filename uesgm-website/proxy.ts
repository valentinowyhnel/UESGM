import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { withAuth } from 'next-auth/middleware'
import { rateLimit } from '@/lib/rate-limit'

// Routes publiques qui ne nécessitent pas de rate limiting strict
const publicRoutes = ['/api/health', '/api/test-simple']

// Routes sensibles avec rate limiting renforcé
const sensitiveRoutes: Record<string, { limit: number; windowMs: number }> = {
  '/api/contact': { limit: 5, windowMs: 15 * 60 * 1000 }, // 5 req / 15 min
  '/api/auth': { limit: 10, windowMs: 15 * 60 * 1000 }, // 10 req / 15 min
  '/api/upload': { limit: 20, windowMs: 60 * 60 * 1000 }, // 20 req / heure
}

// Middleware pour rate limiting et headers de sécurité
async function rateLimitMiddleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Headers de sécurité pour toutes les routes
  const response = NextResponse.next()
  
  // Headers de sécurité
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

  // Rate limiting pour les routes API
  if (pathname.startsWith('/api/')) {
    // Skip rate limiting pour les routes publiques
    if (publicRoutes.some(route => pathname.startsWith(route))) {
      return response
    }

    // Rate limiting spécifique pour les routes sensibles
    const sensitiveRoute = Object.keys(sensitiveRoutes).find(route => 
      pathname.startsWith(route)
    )

    if (sensitiveRoute) {
      const config = sensitiveRoutes[sensitiveRoute]
      const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                 request.headers.get('x-real-ip') || 
                 'unknown'
      
      const allowed = await rateLimit({
        id: `${sensitiveRoute}:${ip}`,
        limit: config.limit,
        windowMs: config.windowMs,
      })

      if (!allowed) {
        return NextResponse.json(
          { error: 'Trop de requêtes. Veuillez réessayer plus tard.' },
          { 
            status: 429,
            headers: {
              'Retry-After': String(Math.floor(config.windowMs / 1000)),
              'X-RateLimit-Limit': String(config.limit),
            }
          }
        )
      }
    } else {
      // Rate limiting général pour les autres routes API
      const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                 request.headers.get('x-real-ip') || 
                 'unknown'
      
      const allowed = await rateLimit({
        id: `api:${ip}`,
        limit: 100,
        windowMs: 60 * 60 * 1000, // 100 req / heure
      })

      if (!allowed) {
        return NextResponse.json(
          { error: 'Trop de requêtes. Veuillez réessayer plus tard.' },
          { 
            status: 429,
            headers: {
              'Retry-After': '3600',
              'X-RateLimit-Limit': '100',
            }
          }
        )
      }
    }
  }

  return response
}

// Routes publiques qui ne nécessitent pas d'authentification
const publicPaths = [
  '/',
  '/a-propos',
  '/bureau-executif',
  '/contact',
  '/evenements',
  '/partenaires',
  '/antennes',
  '/bibliotheque',
  '/projets',
  '/portal',
  '/login',
  '/auth/error',
  '/unauthorized',
  '/api/contact',
  '/api/contact-v2',
  '/api/auth',
  '/api/health',
  '/api/test-simple',
  '/api/search',
  '/api/statistics',
  '/api/verification'
]

// Routes admin - nécessitent une authentification et un rôle admin
const adminPaths = [
  '/admin',
  '/console-gestion', // Ancien chemin - rediriger vers /admin
  '/api/admin',
  '/data-service/admin'
]

// Routes tierces qui doivent être protégées et redirigées
const protectedThirdPartyRoutes = [
  '/dashboard',
  '/membres',
  '/evenements/admin',
  '/documents/admin',
  '/projets/admin',
  '/newsletter/admin',
  '/bibliotheque/admin',
  '/super/admin'
]

// Middleware principal avec authentification
export default withAuth(
  async function middleware(request: NextRequest) {
    const path = request.nextUrl.pathname

    // Appliquer rate limiting et headers de sécurité
    return await rateLimitMiddleware(request)
  },
  {
    callbacks: {
      authorized: async ({ req, token }) => {
        const path = req.nextUrl.pathname

        console.log(`🔍 Middleware check: ${path}`)

        // Routes publiques - accessibles sans authentification
        const isPublicPath = publicPaths.includes(path) || publicPaths.some(publicPath => 
          path === publicPath || (path.startsWith(publicPath) && !path.startsWith('/login'))
        )
        
        if (isPublicPath) {
          console.log(`✅ Route publique: ${path}`)
          return true
        }
        
        // Empêcher l'accès direct à /login si déjà authentifié
        if (path === '/login') {
          if (token) {
            console.log(`🔒 Tentative d'accès à /login alors qu'authentifié, redirection vers /admin`)
            const url = new URL('/admin', req.url)
            const response = NextResponse.redirect(url)
            // Retourner false pour laisser le middleware gérer la redirection
            return false
          }
          // Si pas de token, autoriser l'accès à la page de login
          return true
        }

        // Routes tierces protégées - rediriger vers login
        if (protectedThirdPartyRoutes.some(route => path.startsWith(route))) {
          console.log(`🔄 Route tierce protégée, redirection vers login: ${path}`)
          return false // Sera redirigé vers /login
        }

        // Routes admin - nécessitent une authentification et un rôle admin
        if (adminPaths.some(route => path.startsWith(route))) {
          // Si pas de token, rediriger vers login
          if (!token) {
            console.log(`🚫 Non authentifié, redirection vers /login pour: ${path}`)
            return false
          }

          // Vérifier le rôle
          const isAdmin = token.role === "ADMIN" || token.role === "SUPER_ADMIN"
          if (!isAdmin) {
            console.log(`🚫 Rôle insuffisant: ${token.role} pour: ${path}`)
            return false
          }

          console.log(`✅ Admin authentifié: ${token.email} pour: ${path}`)
          return true
        }

        // Anciennes routes console-gestion - rediriger vers /admin
        if (path.startsWith('/console-gestion')) {
          console.log(`🔄 Ancienne route console-gestion, redirection vers /admin: ${path}`)
          return false // Sera redirigé vers login puis vers /admin
        }

        // Autres routes - authentification optionnelle
        console.log(`✅ Route libre: ${path}`)
        return true
      },
    },
    pages: {
      signIn: '/portal',
      error: '/auth/error',
    },
  }
)

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
