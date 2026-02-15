import { getToken } from "next-auth/jwt"
import { NextResponse, type NextRequest } from "next/server"
import { UserRole } from "@/types/next-auth"

// Chemins qui ne nécessitent pas d'authentification
const publicPaths = [
  "/",
  "/auth/signin",
  "/auth/register",
  "/auth/error",
  "/api/auth/**",
]

// Chemins protégés et leurs rôles requis
const protectedPaths: { path: string; roles: UserRole[] }[] = [
  { path: "/admin", roles: ["ADMIN", "SUPER_ADMIN"] },
  { path: "/super-admin", roles: ["SUPER_ADMIN"] },
  { path: "/member", roles: ["MEMBER", "ADMIN", "SUPER_ADMIN"] },
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Vérifie si le chemin est public
  const isPublicPath = publicPaths.some(path => 
    path === pathname || 
    (path.endsWith("**") && pathname.startsWith(path.slice(0, -3)))
  )

  if (isPublicPath) {
    return NextResponse.next()
  }

  // Récupère le token de session
  const token = await getToken({ 
    req: request,
    secret: process.env.NEXTAUTH_SECRET 
  })

  // Redirige vers la page de connexion si non authentifié
  if (!token) {
    const loginUrl = new URL('/auth/signin', request.url)
    loginUrl.searchParams.set('callbackUrl', encodeURI(request.url))
    return NextResponse.redirect(loginUrl)
  }

  // Vérifie les autorisations pour les chemins protégés
  const userRole = token.role as UserRole || "MEMBER"
  
  for (const { path, roles } of protectedPaths) {
    if (pathname.startsWith(path)) {
      const hasAccess = roles.includes(userRole)
      
      if (!hasAccess) {
        // Redirige vers la page d'accès refusé ou la page d'accueil
        return NextResponse.redirect(new URL('/', request.url))
      }
      break
    }
  }

  return NextResponse.next()
}

// Configuration du middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|images/).*)',
  ],
}
