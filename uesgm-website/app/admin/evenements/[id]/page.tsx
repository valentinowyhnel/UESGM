/**
 * Page de détail d'un événement (admin)
 * Redirige vers la page d'édition
 */

import { redirect } from 'next/navigation'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EventDetailPage({ params }: PageProps) {
  const { id } = await params
  
  // Rediriger vers la page d'édition
  redirect(`/admin/evenements/${id}/edit`)
}
