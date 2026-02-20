import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { UserRole } from "@/types/next-auth";

/**
 * Vérifie si l'utilisateur est connecté et a un rôle admin
 * @returns { ok: boolean, response?: NextResponse, user?: any }
 */
export async function requireAdmin() {
  const session = await getServerSession(authOptions);
  
  const userRole = (session?.user as any)?.role as UserRole | undefined;
  const isAdmin = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';
  
  if (!session || !isAdmin) {
    return { 
      ok: false, 
      response: NextResponse.json(
        { error: "Non autorisé - Rôle administrateur requis" }, 
        { status: 403 }
      ) 
    };
  }
  
  return { ok: true, session };
}

/**
 * Vérifie si l'utilisateur est un super admin
 * @returns { ok: boolean, response?: NextResponse, user?: any }
 */
export async function requireSuperAdmin() {
  const session = await getServerSession(authOptions);
  
  const userRole = (session?.user as any)?.role as UserRole | undefined;
  
  if (!session || userRole !== 'SUPER_ADMIN') {
    return { 
      ok: false, 
      response: NextResponse.json(
        { error: "Non autorisé - Rôle super administrateur requis" }, 
        { status: 403 }
      ) 
    };
  }
  
  return { ok: true, session };
}
