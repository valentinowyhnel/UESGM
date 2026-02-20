// Admin Layout - Protected admin area
// Authentication is handled by the middleware and lib/auth configuration

import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { UserRole } from "@/types/next-auth"
import AdminShell from "./AdminShell"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Get the session using the centralized auth
  const session = await auth()

  // If no session, redirect to login
  if (!session) {
    redirect("/login")
  }

  // Check if user has admin role
  const userRole = session.user?.role as UserRole | undefined
  
  if (!userRole || (userRole !== "ADMIN" && userRole !== "SUPER_ADMIN")) {
    redirect("/unauthorized")
  }

  return <AdminShell>{children}</AdminShell>
}
