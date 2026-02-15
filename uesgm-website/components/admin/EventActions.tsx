'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MoreHorizontal, Edit, Trash2, Eye, EyeOff, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import { CriticalAction, SuspendAction } from './SecureAction'

interface EventActionsProps {
  eventId: string
  published: boolean
  onUpdate?: () => void
}

export function EventActions({ eventId, published, onUpdate }: EventActionsProps) {
  const router = useRouter()
  const [isToggling, setIsToggling] = useState(false)

  const handleTogglePublish = async () => {
    setIsToggling(true)
    try {
      const response = await fetch(`/api/admin/events/${eventId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ published: !published }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erreur lors de la modification')
      }

      toast.success(published ? 'Événement suspendu' : 'Événement publié')
      onUpdate?.()
      router.refresh()
    } catch (error: any) {
      toast.error('Erreur', {
        description: error.message || 'Une erreur est survenue.',
      })
    } finally {
      setIsToggling(false)
    }
  }

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/admin/events/${eventId}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erreur lors de la suppression')
      }

      toast.success('Événement supprimé avec succès')
      onUpdate?.()
      router.refresh()
    } catch (error: any) {
      toast.error('Erreur', {
        description: error.message || 'Une erreur est survenue lors de la suppression.',
      })
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <MoreHorizontal className="w-4 h-4" />
          <span className="sr-only">Actions</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => router.push(`/admin/evenements/${eventId}/edit`)}>
          <Edit className="w-4 h-4 mr-2" />
          Modifier
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push(`/evenements/${eventId}`)}>
          <Eye className="w-4 h-4 mr-2" />
          Voir la page
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <SuspendAction
          action={handleTogglePublish}
          title={published ? "Suspendre l'événement" : "Publier l'événement"}
          description={published 
            ? "Cela rendra l'événement invisible pour le public. Les utilisateurs ne pourront plus s'inscrire."
            : "Cela rendra l'événement visible pour le public et permettra les inscriptions."
          }
          confirmText={published ? "Suspendre" : "Publier"}
          disabled={isToggling}
          loadingText={published ? "Suspension..." : "Publication..."}
          successMessage={published ? "Événement suspendu" : "Événement publié"}
          errorMessage="Erreur lors du changement de statut"
          icon={isToggling ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : published ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
        >
          {published ? 'Suspendre' : 'Publier'}
        </SuspendAction>
        <DropdownMenuSeparator />
        <CriticalAction
          action={handleDelete}
          title="⚠️ Supprimer l'événement"
          description="Cette action est irréversible. L'événement et toutes ses inscriptions seront définitivement supprimés. Cette action ne peut être effectuée que par un super administrateur."
          confirmText="Supprimer définitivement"
          errorMessage="Erreur lors de la suppression"
          icon={<Trash2 className="w-4 h-4 mr-2" />}
        >
          Supprimer
        </CriticalAction>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
