import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { rateLimit } from '@/lib/rate-limit'

const publicPaths = [
  "/", "/a-propos", "/bureau-executif", "/contact", "/evenements",
  "/partenaires", "/antennes", "/bibliotheque", "/projets", "/login",
  "/auth/error", "/unauthorized", "/api/auth/**", "/api/health",
  "/api/search", "/api/statistics", "/api/contact", "/api/documents",
  "/api/events", "/api/projects", "/api/partners", "/api/executive-members"
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
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  // Simplified CSP for demonstration; in production, use a more strict one.
  response.headers.set('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:;")
  return response
}

async function checkRateLimit(request: NextRequest, pathname: string): Promise<NextResponse | null> {
  const sensitiveRoute = Object.keys(sensitiveRoutes).find(route => pathname.startsWith(route))
  let limit = 1000, windowMs = 60 * 60 * 1000

  if (sensitiveRoute) {
    limit = sensitiveRoutes[sensitiveRoute].limit
    windowMs = sensitiveRoutes[sensitiveRoute].windowMs
  }

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'
  const allowed = await rateLimit({ id: `${pathname}:${ip}`, limit, windowMs })

  if (!allowed) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }
  return null
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const response = NextResponse.next()
  addSecurityHeaders(response)

  if (pathname.startsWith('/api/')) {
    const rateLimitResponse = await checkRateLimit(request, pathname)
    if (rateLimitResponse) return addSecurityHeaders(rateLimitResponse)
  }

  const isPublicPath = publicPaths.some(path =>
    path.endsWith('**') ? pathname.startsWith(path.slice(0, -2)) : pathname === path || pathname.startsWith(path + '/')
  )

  if (isPublicPath && !pathname.startsWith('/admin') && !pathname.startsWith('/api/admin')) {
    return response
  }

  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  if (!token) {
    if (pathname.startsWith('/api/')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const userRole = (token.role as string) || 'MEMBER'
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    if (!['ADMIN', 'SUPER_ADMIN', 'MODERATOR'].includes(userRole)) {
      return NextResponse.redirect(new URL('/unauthorized', request.url))
    }
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
