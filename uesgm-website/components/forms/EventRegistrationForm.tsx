'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Loader2, CheckCircle2 } from 'lucide-react'

const registrationSchema = z.object({
  fullName: z.string().min(2, 'Le nom doit contenir au moins 2 caractères').max(100),
  email: z.string().email('Email invalide').max(255),
  phone: z.string().max(20).optional(),
  city: z.string().max(100).optional(),
  establishment: z.string().max(200).optional(),
})

type RegistrationFormData = z.infer<typeof registrationSchema>

interface EventRegistrationFormProps {
  eventId: string
}

export function EventRegistrationForm({ eventId }: EventRegistrationFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationSchema),
  })

  const onSubmit = async (data: RegistrationFormData) => {
    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/events/${eventId}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erreur lors de l\'inscription')
      }

      toast.success('Inscription réussie !', {
        description: 'Vous recevrez un email de confirmation sous peu.',
      })
      setIsSuccess(true)
      reset()
      
      // Rafraîchir la page pour mettre à jour le nombre d'inscrits
      setTimeout(() => {
        router.refresh()
      }, 2000)
    } catch (error: any) {
      toast.error('Erreur', {
        description: error.message || 'Une erreur est survenue lors de l\'inscription.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="text-center py-8 space-y-4">
        <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
        <h3 className="text-lg font-semibold">Inscription confirmée !</h3>
        <p className="text-sm text-muted-foreground">
          Vous recevrez un email de confirmation sous peu.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="fullName">Nom complet *</Label>
        <Input
          id="fullName"
          {...register('fullName')}
          placeholder="Votre nom complet"
          disabled={isSubmitting}
        />
        {errors.fullName && (
          <p className="text-sm text-red-500">{errors.fullName.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email *</Label>
        <Input
          id="email"
          type="email"
          {...register('email')}
          placeholder="votre.email@example.com"
          disabled={isSubmitting}
        />
        {errors.email && (
          <p className="text-sm text-red-500">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Téléphone</Label>
        <Input
          id="phone"
          type="tel"
          {...register('phone')}
          placeholder="+212 6 12 34 56 78"
          disabled={isSubmitting}
        />
        {errors.phone && (
          <p className="text-sm text-red-500">{errors.phone.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="city">Ville</Label>
        <Input
          id="city"
          {...register('city')}
          placeholder="Rabat"
          disabled={isSubmitting}
        />
        {errors.city && (
          <p className="text-sm text-red-500">{errors.city.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="establishment">Établissement</Label>
        <Input
          id="establishment"
          {...register('establishment')}
          placeholder="Université Mohammed V"
          disabled={isSubmitting}
        />
        {errors.establishment && (
          <p className="text-sm text-red-500">{errors.establishment.message}</p>
        )}
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Inscription en cours...
          </>
        ) : (
          "S'inscrire"
        )}
      </Button>

      <p className="text-xs text-muted-foreground text-center">
        * Champs obligatoires
      </p>
    </form>
  )
}
