// Middleware pour l'authentification et la protection des routes
// Ce fichier remplace l'ancien proxy.ts pour une meilleure intégration Next.js

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"
import { ROLE_HIERARCHY } from '@/lib/auth/rbac'

// Initialisation de Redis et Ratelimit (uniquement si les variables d'env sont présentes)
let ratelimit: Ratelimit | null = null;
try {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
    ratelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, "10 s"),
      analytics: true,
    })
  }
} catch (e) {
  console.error("Failed to initialize Upstash Redis:", e);
}

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
  "/api/search",
  "/api/statistics",
  "/api/contact",
  "/api/documents/**",
  "/api/events/public/**",
]

// Routes sensibles avec rate limiting renforcé
const SENSITIVE_ROUTES: Record<string, { limit: number; window: string }> = {
  '/api/contact': { limit: 5, window: "15 m" },
  '/api/auth': { limit: 10, window: "15 m" },
  '/api/upload': { limit: 20, window: "60 m" },
}

// Headers de sécurité pour toutes les réponses
function addSecurityHeaders(response: NextResponse) {
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self' https:;")
  return response
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const ip = request.ip ?? request.headers.get('x-forwarded-for') ?? '127.0.0.1'

  // 1. Rate Limiting via Upstash
  if (ratelimit) {
    const sensitiveRoute = Object.keys(SENSITIVE_ROUTES).find(route => pathname.startsWith(route))
    if (sensitiveRoute) {
      const { limit, window } = SENSITIVE_ROUTES[sensitiveRoute]
      // On peut créer un limiteur spécifique par route ici si besoin
      const { success, limit: l, remaining, reset } = await ratelimit.limit(`${pathname}:${ip}`)

      if (!success) {
        const response = NextResponse.json(
          { error: 'Trop de requêtes. Veuillez réessayer plus tard.' },
          { status: 429 }
        )
        response.headers.set('X-RateLimit-Limit', l.toString())
        response.headers.set('X-RateLimit-Remaining', remaining.toString())
        response.headers.set('X-RateLimit-Reset', reset.toString())
        return addSecurityHeaders(response)
      }
    }
  }

  // 2. Auth & RBAC
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })

  // Vérifier si le chemin est public
  const isPublicPath = publicPaths.some(path => {
    if (path.endsWith('**')) return pathname.startsWith(path.slice(0, -2))
    return pathname === path || pathname.startsWith(path)
  })

  if (!isPublicPath) {
    if (!token) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('callbackUrl', encodeURI(pathname))
      return NextResponse.redirect(loginUrl)
    }

    const userRole = (token.role as any) || 'MEMBER'
    const roleWeight = ROLE_HIERARCHY[userRole as keyof typeof ROLE_HIERARCHY] || 0

    // Protection /admin
    if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
      if (roleWeight < ROLE_HIERARCHY.MODERATOR) {
        return NextResponse.redirect(new URL('/unauthorized', request.url))
      }
    }

    // Protection /super-admin
    if (pathname.startsWith('/super-admin')) {
      if (roleWeight < ROLE_HIERARCHY.SUPER_ADMIN) {
        return NextResponse.redirect(new URL('/unauthorized', request.url))
      }
    }
  }

  // 3. Headers de sécurité
  const response = NextResponse.next()
  addSecurityHeaders(response)

  // Cache control for admin
  if (pathname.startsWith('/admin') || pathname.startsWith('/super-admin')) {
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0')
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
