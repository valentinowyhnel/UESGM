/**
 * Page de détail d'un projet (admin)
 * Redirige vers la page d'édition
 */

import { redirect } from 'next/navigation'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ProjectDetailPage({ params }: PageProps) {
  const { id } = await params
  
  // Rediriger vers la page d'édition
  redirect(`/admin/projets/${id}/edit`)
}
