import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { rateLimit } from '@/lib/rate-limit'

// Routes publiques
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
  "/api/auth/**",
  "/api/search",
  "/api/statistics",
  "/api/contact",
  "/api/events",
  "/api/projects",
  "/api/partners",
  "/api/executive-members",
]

// Headers de sécurité
function addSecurityHeaders(response: NextResponse) {
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  response.headers.set('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;")
  return response
}

const sensitiveRoutes: Record<string, { limit: number; windowMs: number }> = {
  '/api/contact': { limit: 5, windowMs: 15 * 60 * 1000 },
  '/api/upload': { limit: 20, windowMs: 60 * 60 * 1000 },
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip static files
  if (pathname.includes('.')) return NextResponse.next()

  // Rate Limiting
  const sensitiveRoute = Object.keys(sensitiveRoutes).find(route => pathname.startsWith(route))
  if (sensitiveRoute) {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'
    const { limit, windowMs } = sensitiveRoutes[sensitiveRoute]
    const allowed = await rateLimit({ id: `${pathname}:${ip}`, limit, windowMs })
    if (!allowed) {
      return NextResponse.json({ error: 'Trop de requêtes' }, { status: 429 })
    }
  }

  const response = NextResponse.next()
  addSecurityHeaders(response)

  // Auth & RBAC
  const isAdminPath = pathname.startsWith('/admin') || pathname.startsWith('/api/admin')
  const isSuperAdminPath = pathname.startsWith('/super-admin')

  if (isAdminPath || isSuperAdminPath) {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    const role = token.role as string
    if (isSuperAdminPath && role !== 'SUPER_ADMIN') {
      return NextResponse.redirect(new URL('/unauthorized', request.url))
    }
    if (isAdminPath && !['ADMIN', 'SUPER_ADMIN'].includes(role)) {
      return NextResponse.redirect(new URL('/unauthorized', request.url))
    }
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
