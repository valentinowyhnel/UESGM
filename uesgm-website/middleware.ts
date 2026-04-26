import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// Configuration de Redis pour Upstash
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

// Différents rate limiters
const generalRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, '1 h'),
  analytics: true,
})

const authRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '15 m'),
  analytics: true,
})

const contactRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '15 m'),
  analytics: true,
})

const publicPaths = [
  "/", "/a-propos", "/bureau-executif", "/contact", "/evenements",
  "/partenaires", "/antennes", "/bibliotheque", "/projets",
  "/login", "/auth/error", "/unauthorized", "/api/auth/**",
  "/api/health", "/api/search", "/api/statistics"
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1'

  // 1. Rate Limiting
  if (pathname.startsWith('/api/')) {
    let result
    if (pathname.startsWith('/api/auth')) {
      result = await authRatelimit.limit(ip)
    } else if (pathname.startsWith('/api/contact')) {
      result = await contactRatelimit.limit(ip)
    } else {
      result = await generalRatelimit.limit(ip)
    }

    if (!result.success) {
      return NextResponse.json(
        { error: 'Trop de requêtes. Veuillez réessayer plus tard.' },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': result.limit.toString(),
            'X-RateLimit-Remaining': result.remaining.toString(),
            'X-RateLimit-Reset': result.reset.toString(),
          }
        }
      )
    }
  }

  // 2. Auth & RBAC
  const isPublicPath = publicPaths.some(path => {
    if (path.endsWith('**')) return pathname.startsWith(path.slice(0, -2))
    return pathname === path || pathname.startsWith(path + '/')
  })

  if (!isPublicPath) {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })

    if (!token) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(loginUrl)
    }

    const isAdminPath = pathname.startsWith('/admin') || pathname.startsWith('/api/admin')
    const isSuperAdminPath = pathname.startsWith('/super-admin')
    const userRole = (token.role as string) || 'MEMBER'

    if (isSuperAdminPath && userRole !== 'SUPER_ADMIN') {
      return NextResponse.redirect(new URL('/unauthorized', request.url))
    }

    if (isAdminPath && userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN') {
      return NextResponse.redirect(new URL('/unauthorized', request.url))
    }
  }

  const response = NextResponse.next()

  // 3. Security Headers
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
