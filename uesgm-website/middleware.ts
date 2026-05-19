// Middleware pour l'authentification, la sécurité et le rate limiting
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

// Headers de sécurité standards
function addSecurityHeaders(response: NextResponse) {
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), interest-cohort=()')

  // CSP stricte
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data:; connect-src 'self' https:; frame-ancestors 'none';"
  )

  return response
}

// Headers de sécurité admin (anti-cache)
function addAdminSecurityHeaders(response: NextResponse) {
  addSecurityHeaders(response)
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0')
  response.headers.set('Pragma', 'no-cache')
  response.headers.set('Expires', '0')
  return response
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip statics
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  // Rate Limiting global pour l'API (Placeholder pour Redis/Upstash)
  if (pathname.startsWith('/api/')) {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'
    const allowed = await rateLimit({
      id: `global:${ip}`,
      limit: 1000,
      windowMs: 15 * 60 * 1000
    })

    if (!allowed) {
      return new NextResponse(
        JSON.stringify({ error: 'Trop de requêtes' }),
        { status: 429, headers: { 'Content-Type': 'application/json' } }
      )
    }
  }

  const response = NextResponse.next()

  // Déterminer si c'est une route admin
  const isAdminPath = pathname.startsWith('/admin') || pathname.startsWith('/api/admin') || pathname.startsWith('/super-admin')

  if (isAdminPath) {
    addAdminSecurityHeaders(response)
  } else {
    addSecurityHeaders(response)
  }

  // Auth check
  const isPublicPath = publicPaths.some(path => {
    if (path.endsWith('**')) return pathname.startsWith(path.slice(0, -2))
    return pathname === path || pathname.startsWith(path + '/')
  })

  if (!isPublicPath) {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })

    if (!token) {
      const url = new URL('/login', request.url)
      url.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(url)
    }

    const role = (token as any).role || 'MEMBER'

    // RBAC pour routes admin
    if (isAdminPath && role !== 'ADMIN' && role !== 'SUPER_ADMIN' && role !== 'MODERATOR') {
      return NextResponse.redirect(new URL('/unauthorized', request.url))
    }

    // RBAC pour super-admin
    if (pathname.startsWith('/super-admin') && role !== 'SUPER_ADMIN') {
      return NextResponse.redirect(new URL('/unauthorized', request.url))
    }
  }

  return response
}

export const config = {
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico).*)'],
}
