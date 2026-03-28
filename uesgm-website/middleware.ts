import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

// Rate limiting (in-memory for Vercel/Edge compatibility without external Redis)
const rateLimitCache = new Map<string, { count: number; resetTime: number }>()

async function checkRateLimit(ip: string, pathname: string) {
  const now = Date.now()
  const windowMs = 15 * 60 * 1000 // 15 minutes
  const key = `${ip}:${pathname}`
  
  // Custom limits per route
  let limit = 100 // Default
  if (pathname.startsWith('/api/contact')) limit = 5
  if (pathname.startsWith('/api/auth')) limit = 10
  if (pathname.startsWith('/api/upload')) limit = 20

  const record = rateLimitCache.get(key)
  if (!record || now > record.resetTime) {
    rateLimitCache.set(key, { count: 1, resetTime: now + windowMs })
    return true
  }

  if (record.count >= limit) return false

  record.count++
  return true
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'

  // 1. Rate Limiting for API routes
  if (pathname.startsWith('/api/') && !pathname.startsWith('/api/health')) {
    const allowed = await checkRateLimit(ip, pathname)
    if (!allowed) {
      return NextResponse.json({ error: 'Trop de requêtes. Veuillez réessayer plus tard.' }, { status: 429 })
    }
  }

  // 2. Auth and RBAC
  const isAdminPath = pathname.startsWith('/admin') || pathname.startsWith('/api/admin')
  const isSuperAdminPath = pathname.startsWith('/super-admin') || pathname.startsWith('/api/super')

  if (isAdminPath || isSuperAdminPath) {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })

    if (!token) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(loginUrl)
    }

    const role = token.role as string
    if (isSuperAdminPath && role !== 'SUPER_ADMIN') {
      return NextResponse.redirect(new URL('/unauthorized', request.url))
    }

    if (isAdminPath && !['ADMIN', 'SUPER_ADMIN', 'MODERATOR'].includes(role)) {
      return NextResponse.redirect(new URL('/unauthorized', request.url))
    }
  }

  // 3. Security Headers
  const response = NextResponse.next()
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;")
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
