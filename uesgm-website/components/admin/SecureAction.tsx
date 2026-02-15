"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Loader2, AlertTriangle, Shield } from "lucide-react"
import { toast } from "sonner"

interface SecureActionProps {
  children?: React.ReactNode
  action: () => Promise<void>
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  disabled?: boolean
  requiresConfirmation?: boolean
  loadingText?: string
  successMessage?: string
  errorMessage?: string
  icon?: React.ReactNode
  className?: string
}

export function SecureAction({
  children,
  action,
  title,
  description,
  confirmText = "Confirmer",
  cancelText = "Annuler",
  variant = "default",
  disabled = false,
  requiresConfirmation = true,
  loadingText = "Chargement...",
  successMessage = "Action réussie",
  errorMessage = "Une erreur est survenue",
  icon,
  className = ""
}: SecureActionProps) {
  const [loading, setLoading] = useState(false)
  const [showDialog, setShowDialog] = useState(false)

  const handleAction = async () => {
    if (requiresConfirmation && !showDialog) {
      setShowDialog(true)
      return
    }

    try {
      setLoading(true)
      await action()
      toast.success(successMessage)
      setShowDialog(false)
    } catch (error: any) {
      console.error('SecureAction Error:', error)
      toast.error(errorMessage, {
        description: error.message || "Veuillez réessayer"
      })
    } finally {
      setLoading(false)
    }
  }

  const triggerButton = children || (
    <Button 
      variant={variant} 
      disabled={disabled || loading}
      className={className}
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          {loadingText}
        </>
      ) : (
        <>
          {icon}
          {confirmText}
        </>
      )}
    </Button>
  )

  if (!requiresConfirmation) {
    return (
      <div onClick={handleAction}>
        {triggerButton}
      </div>
    )
  }

  return (
    <>
      <div onClick={handleAction}>
        {triggerButton}
      </div>

      <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <AlertDialogTitle className="text-left">{title}</AlertDialogTitle>
            </div>
          </AlertDialogHeader>
          <AlertDialogDescription className="text-left">
            {description}
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>
              {cancelText}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleAction}
              disabled={loading}
              className={variant === "destructive" ? "bg-red-600 hover:bg-red-700" : ""}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {loadingText}
                </>
              ) : (
                confirmText
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

// Composant pour les actions critiques (suppression, etc.)
export function CriticalAction(props: Omit<SecureActionProps, 'variant' | 'requiresConfirmation'>) {
  return (
    <SecureAction
      {...props}
      variant="destructive"
      requiresConfirmation={true}
      confirmText="Supprimer"
      title="⚠️ Action Critique"
    />
  )
}

// Composant pour les actions de publication
export function PublishAction(props: Omit<SecureActionProps, 'variant' | 'requiresConfirmation'>) {
  return (
    <SecureAction
      {...props}
      variant="default"
      requiresConfirmation={false}
      confirmText="Publier"
      successMessage="Publié avec succès"
    />
  )
}

// Composant pour les actions de suspension
export function SuspendAction(props: Omit<SecureActionProps, 'variant' | 'requiresConfirmation'>) {
  return (
    <SecureAction
      {...props}
      variant="secondary"
      requiresConfirmation={true}
      confirmText="Suspendre"
      successMessage="Suspendu avec succès"
    />
  )
}
