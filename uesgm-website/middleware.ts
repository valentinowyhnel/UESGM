// Middleware pour l'authentification, le rate limiting et la sécurité

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { rateLimit } from '@/lib/rate-limit'

const publicPaths = [
  "/", "/a-propos", "/bureau-executif", "/contact", "/evenements", "/partenaires",
  "/antennes", "/bibliotheque", "/projets", "/login", "/auth/error", "/unauthorized",
  "/api/auth/**", "/api/health", "/api/test-simple", "/api/search", "/api/statistics",
  "/api/verification", "/api/contact", "/api/documents/**", "/api/events/public/**",
]

const sensitiveRoutes: Record<string, { limit: number; windowMs: number }> = {
  '/api/contact': { limit: 5, windowMs: 15 * 60 * 1000 },
  '/api/auth': { limit: 10, windowMs: 15 * 60 * 1000 },
  '/api/upload': { limit: 20, windowMs: 60 * 60 * 1000 },
}

function addSecurityHeaders(response: NextResponse) {
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  // CSP simplified for demonstration
  response.headers.set('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data: https:; font-src 'self'; connect-src 'self' https:;")
  return response
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 1. Skip static files
  if (pathname.startsWith('/_next') || pathname.includes('.')) {
    return NextResponse.next()
  }

  // 2. Rate Limiting for API
  if (pathname.startsWith('/api/')) {
    const sensitiveRoute = Object.keys(sensitiveRoutes).find(route => pathname.startsWith(route))
    let limit = 100, windowMs = 60 * 60 * 1000

    if (sensitiveRoute) {
      limit = sensitiveRoutes[sensitiveRoute].limit
      windowMs = sensitiveRoutes[sensitiveRoute].windowMs
    }

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'
    const allowed = await rateLimit({ id: `${pathname}:${ip}`, limit, windowMs })

    if (!allowed) {
      return addSecurityHeaders(NextResponse.json({ error: 'Trop de requêtes' }, { status: 429 }))
    }
  }

  // 3. Auth & RBAC
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })

  const isAdminPath = pathname.startsWith('/admin') || pathname.startsWith('/api/admin')
  const isSuperAdminPath = pathname.startsWith('/super-admin')

  if (isAdminPath || isSuperAdminPath) {
    if (!token) {
      const url = new URL('/login', request.url)
      url.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(url)
    }

    const role = token.role as string
    if (isSuperAdminPath && role !== 'SUPER_ADMIN') {
      return NextResponse.redirect(new URL('/unauthorized', request.url))
    }
    if (isAdminPath && role !== 'ADMIN' && role !== 'SUPER_ADMIN' && role !== 'MODERATOR') {
      return NextResponse.redirect(new URL('/unauthorized', request.url))
    }
  }

  const response = NextResponse.next()
  return addSecurityHeaders(response)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
