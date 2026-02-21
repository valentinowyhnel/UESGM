'use client'

import { useState, useEffect, ChangeEvent, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useFieldArray, FieldValues, Resolver } from 'react-hook-form'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { ImagePlus, X, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

// ------------------------------------------------------------------
// Schéma de validation
// ------------------------------------------------------------------
// Pattern CUID de Prisma (ex: clm3h5d2w0000qwer456abcde)
const cuidPattern = /^c[0-9a-z]{20,}$/i
// Pattern UUID standard
const uuidPattern = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/

const eventSchema = z.object({
    title: z.string()
        .min(3, 'Le titre doit contenir au moins 3 caractères')
        .max(100, 'Le titre ne peut pas dépasser 100 caractères')
        .refine((val) => val.trim().length > 0, 'Le titre ne peut pas être vide'),

    description: z.string()
        .min(1, 'La description est requise')
        .max(5000, 'La description ne peut pas dépasser 5000 caractères'),

    date: z.string().refine((val) => !isNaN(Date.parse(val)), {
        message: 'Date invalide',
    }),

    location: z.string()
        .max(200, 'Le lieu ne peut pas dépasser 200 caractères')
        .optional(),

    category: z.string()
        .min(1, 'Veuillez sélectionner une catégorie')
        .refine(
            (val) => ['INTEGRATION', 'ACADEMIC', 'SOCIAL', 'CULTURAL'].includes(val),
            {
                message: 'Veuillez sélectionner une catégorie valide',
            }
        ),

    // Publication : si publié, on peut choisir le mode
    published: z.boolean().default(false),
    publishMode: z.enum(['NOW', 'SCHEDULED']).optional(),
    publishedAt: z.string().optional(),

    // Format CUID ou UUID de Prisma
    antenneIds: z.array(z.string().refine(
        (val) => cuidPattern.test(val) || uuidPattern.test(val),
        'ID d\'antenne invalide'
    ))
        .min(1, 'Veuillez sélectionner au moins une antenne'),
})

type EventFormData = z.infer<typeof eventSchema>

// ------------------------------------------------------------------
// Types des props du composant
// ------------------------------------------------------------------
interface EventFormProps {
    eventId?: string
    initialData?: Partial<EventFormData> & {
        image?: string
        images?: string[]
    }
}

// ------------------------------------------------------------------
// Composant principal
// ------------------------------------------------------------------
export default function EventForm({ eventId, initialData }: EventFormProps) {
    const router = useRouter()
    const isEditMode = !!eventId

    // États locaux
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [antennes, setAntennes] = useState<Array<{ id: string; name: string }>>([])
    const [images, setImages] = useState<string[]>(initialData?.images || [])
    const [uploading, setUploading] = useState(false)

    // ------------------------------------------------------------------
    // Configuration React Hook Form
    // ------------------------------------------------------------------
    const form = useForm<EventFormData>({
         resolver: zodResolver(eventSchema) as Resolver<EventFormData>,
        defaultValues: {
            title: initialData?.title || '',
            description: initialData?.description || '',
            date: initialData?.date || new Date().toISOString().split('T')[0],
            location: initialData?.location || '',
            category: (initialData?.category as EventFormData['category']) || 'CULTURAL',
            published: initialData?.published ?? false,
            publishMode: initialData?.publishMode,   // undefined or 'NOW'/'SCHEDULED'
            publishedAt: initialData?.publishedAt,
            antenneIds: initialData?.antenneIds || [],
  },
})

    // Watcher pour afficher conditionnellement le champ de date programmée
    const watchPublishMode = form.watch('publishMode')
    const watchPublished = form.watch('published')

    // ------------------------------------------------------------------
    // Chargement des antennes
    // ------------------------------------------------------------------
    useEffect(() => {
        const fetchAntennes = async () => {
            try {
                const res = await fetch('/api/antennes/search?q=')
                if (!res.ok) throw new Error('Erreur réseau')
                const data = await res.json()
                setAntennes(Array.isArray(data) ? data : [])
            } catch (error) {
                console.error('Erreur chargement antennes:', error)
                toast.error('Erreur lors du chargement des antennes')
                setAntennes([])
            }
        }
        fetchAntennes()
    }, [])

    // ------------------------------------------------------------------
    // Gestion des images
    // ------------------------------------------------------------------
    const handleImageChange = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Validation taille
        if (file.size > 10 * 1024 * 1024) {
            toast.error("L'image ne doit pas dépasser 10MB")
            return
        }

        // Validation type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
        if (!allowedTypes.includes(file.type)) {
            toast.error('Type de fichier non supporté. Utilisez JPG, PNG ou WebP')
            return
        }

        setUploading(true)
        const formData = new FormData()
        formData.append('file', file)

        try {
            const res = await fetch('/api/admin/events/upload', {
                method: 'POST',
                body: formData,
            })

            if (!res.ok) {
                const error = await res.json().catch(() => ({}))
                throw new Error(error.error || "Échec de l'upload")
            }

            const data = await res.json()
            // L'API /api/admin/events/upload retourne { success, file: { url } }
            if (data.file?.url) {
                setImages((prev) => [...prev, data.file.url])
                toast.success('Image téléchargée avec succès')
            } else if (data.success && data.file) {
                // Alternative response format
                setImages((prev) => [...prev, data.file.url])
                toast.success('Image téléchargée avec succès')
            } else {
                throw new Error(data.error || "URL de l'image non reçue")
            }
        } catch (err: any) {
            console.error('Erreur upload:', err)
            toast.error(err.message || "Erreur lors du téléchargement de l'image")
        } finally {
            setUploading(false)
        }
    }

    const handleRemoveImage = (index: number) => {
        setImages((prev) => prev.filter((_, i) => i !== index))
    }

    // Drag & drop pour réordonner les images
    const onDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
        e.dataTransfer.setData('text/plain', index.toString())
    }

    const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault()
    }

    const onDrop = (e: React.DragEvent<HTMLDivElement>, dropIndex: number) => {
        e.preventDefault()
        const fromIndex = parseInt(e.dataTransfer.getData('text/plain'))
        if (!isNaN(fromIndex) && fromIndex !== dropIndex && fromIndex < images.length) {
            const newImages = [...images]
            const [moved] = newImages.splice(fromIndex, 1)
            newImages.splice(dropIndex, 0, moved)
            setImages(newImages)
        }
    }

    // ------------------------------------------------------------------
    // Gestion du changement des antennes (checkbox)
    // ------------------------------------------------------------------
    const handleAntenneChange = (antenneId: string, checked: boolean) => {
        const current = form.getValues('antenneIds') || []
        const newValue = checked
            ? [...current, antenneId]
            : current.filter((id) => id !== antenneId)
        // Ne pas valider tous les champs, seulement antenneIds
        form.setValue('antenneIds', newValue, { shouldValidate: false })
    }

    // ------------------------------------------------------------------
    // Gestion du mode de publication
    // ------------------------------------------------------------------
    const handlePublishModeChange = (mode: 'NOW' | 'SCHEDULED') => {
        form.setValue('publishMode', mode)
        if (mode === 'NOW') {
            form.setValue('publishedAt', new Date().toISOString())
        } else {
            // Si programmé et aucune date n'est définie, mettre demain par défaut
            const tomorrow = new Date()
            tomorrow.setDate(tomorrow.getDate() + 1)
            form.setValue('publishedAt', tomorrow.toISOString().slice(0, 16))
        }
    }

    // ------------------------------------------------------------------
    // Validation client avant soumission
    // ------------------------------------------------------------------
    const validateBeforeSubmit = (values: EventFormData): boolean => {
        // Au moins une image
        if (images.length === 0) {
            toast.error('Veuillez ajouter au moins une image')
            return false
        }

        // Si publié et programmé, une date future est requise
        if (values.published && values.publishMode === 'SCHEDULED') {
            if (!values.publishedAt) {
                toast.error('Veuillez spécifier une date de publication')
                return false
            }
            const publishDate = new Date(values.publishedAt)
            const now = new Date()
            if (publishDate <= now) {
                toast.error('La date de publication doit être dans le futur')
                return false
            }
        }

        // La date de l'événement doit être dans le futur (sauf si édition ?)
        const eventDate = new Date(values.date)
        const now = new Date()
        // On peut laisser passer les dates passées en mode édition, mais on prévient
        if (eventDate <= now && !isEditMode) {
            toast.error("La date de l'événement doit être dans le futur")
            return false
        }

        return true
    }

    // ------------------------------------------------------------------
    // Soumission du formulaire
    // ------------------------------------------------------------------
    const onSubmit = async (data: EventFormData) => {
        if (!validateBeforeSubmit(data)) return

        setIsSubmitting(true)

        try {
            // Construction du payload pour l'API
            // Accepter les URLs relatives (comme /uploads/...) ou absolues
            const validImages = images.filter(img => img && (img.startsWith('http') || img.startsWith('/')))
            
            const payload: any = {
                title: data.title.trim(),
                description: data.description.trim(),
                startDate: data.date,
                endDate: data.date, // même date si pas de fin distincte
                location: data.location?.trim() || '',
                category: data.category,
                antenneIds: data.antenneIds || [],
                imageUrl: validImages[0] || null,
                images: validImages,
                published: data.published,
            }

            // Si publié, on ajoute les infos de publication
            if (data.published) {
                payload.publishMode = data.publishMode || 'NOW'
                payload.publishedAt = data.publishMode === 'SCHEDULED' && data.publishedAt ? data.publishedAt : new Date().toISOString()
            }

            // Ajout du token CSRF (optionnel selon votre API)
            const csrfToken = await fetch('/api/auth/csrf').then(res => res.json()).then(d => d.csrfToken).catch(() => '')
            if (csrfToken) payload.csrfToken = csrfToken

            const url = isEditMode ? `/api/admin/events?id=${eventId}` : '/api/admin/events'
            const method = isEditMode ? 'PUT' : 'POST'

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                credentials: 'same-origin',
            })

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}))
                throw new Error(errorData.error || 'Une erreur est survenue')
            }

            const result = await response.json()
            toast.success(result.message || 'Opération réussie !')

            // Redirection - rester sur la page admin pour voir les changements
            setTimeout(() => {
                router.push('/admin/evenements')
                router.refresh()
            }, 1500)
        } catch (error: any) {
            console.error('Erreur soumission:', error)
            toast.error(error.message || "Une erreur est survenue lors de l'enregistrement")
        } finally {
            setIsSubmitting(false)
        }
    }

    // ------------------------------------------------------------------
    // Rendu JSX
    // ------------------------------------------------------------------
    return (
        <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    {/* 2 colonnes sur desktop pour les champs principaux */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Colonne gauche */}
                        <div className="space-y-6">
                            <FormField
                                control={form.control}
                                name="title"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Titre de l'événement</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Ex: Congrès National 2025" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="date"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Date</FormLabel>
                                            <FormControl>
                                                <Input type="date" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="category"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Catégorie</FormLabel>
                                            <FormControl>
                                                <select
                                                    {...field}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                >
                                                    <option value="INTEGRATION">Intégration</option>
                                                    <option value="ACADEMIC">Académique</option>
                                                    <option value="SOCIAL">Social</option>
                                                    <option value="CULTURAL">Culturel</option>
                                                </select>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="location"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Lieu</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Ex: Rabat, Grand Théâtre" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Colonne droite : description */}
                        <div className="space-y-6">
                            <FormField
                                control={form.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Description détaillée</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Décrivez l'événement en détail..."
                                                className="min-h-[200px]"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </div>

                    {/* ----- Section Images ----- */}
                    <div className="space-y-4">
                        <div>
                            <FormLabel className="block mb-2 text-sm font-medium text-gray-700">
                                Galerie d'images
                            </FormLabel>
                            <p className="text-xs text-gray-500">
                                La première image sera utilisée comme miniature. Formats acceptés : JPG, PNG, WebP (max 10MB)
                            </p>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {images.map((img, idx) => (
                                <div
                                    key={idx}
                                    className="aspect-square relative group rounded-lg overflow-hidden border-2 border-transparent hover:border-primary transition-all cursor-move"
                                    draggable
                                    onDragStart={(e) => onDragStart(e, idx)}
                                    onDragOver={onDragOver}
                                    onDrop={(e) => onDrop(e, idx)}
                                >
                                    <img
                                        src={img}
                                        alt={`Prévisualisation ${idx + 1}`}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = '/images/placeholder-image.svg'
                                        }}
                                    />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveImage(idx)}
                                            className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                                            aria-label="Supprimer l'image"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                    {idx === 0 && (
                                        <span className="absolute bottom-0 left-0 right-0 bg-gold text-slate-900 text-[10px] font-bold text-center py-0.5">
                                            Image principale
                                        </span>
                                    )}
                                </div>
                            ))}

                            {/* Bouton d'ajout */}
                            <label
                                className={cn(
                                    "aspect-square flex flex-col items-center justify-center border-2 border-dashed rounded-lg cursor-pointer transition-colors",
                                    uploading
                                        ? "bg-gray-50 border-gray-300"
                                        : "border-gray-300 hover:border-primary hover:bg-primary/5",
                                    images.length >= 10 && "opacity-50 cursor-not-allowed"
                                )}
                            >
                                {uploading ? (
                                    <div className="flex flex-col items-center">
                                        <Loader2 className="w-6 h-6 text-primary animate-spin mb-1" />
                                        <span className="text-xs text-gray-500">Téléchargement...</span>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center">
                                        <ImagePlus className="w-6 h-6 text-gray-400 mb-1" />
                                        <span className="text-xs text-gray-500 text-center px-2">
                                            {images.length === 0 ? 'Ajouter une image' : 'Ajouter une autre image'}
                                        </span>
                                    </div>
                                )}
                                <input
                                    type="file"
                                    className="hidden"
                                    accept="image/jpeg, image/png, image/webp"
                                    onChange={handleImageChange}
                                    disabled={uploading || images.length >= 10}
                                />
                            </label>
                        </div>

                        {images.length === 0 && (
                            <p className="text-sm text-amber-600">Veuillez ajouter au moins une image pour cet événement.</p>
                        )}
                        {images.length >= 10 && (
                            <p className="text-sm text-amber-600">Vous avez atteint le nombre maximum d'images (10).</p>
                        )}
                    </div>

                    {/* ----- Section Antennes ----- */}
                    <div className="space-y-3">
                        <FormField
                            control={form.control}
                            name="antenneIds"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="block mb-2">Antennes concernées</FormLabel>
                                    <div className="grid grid-cols-2 gap-3 max-h-[150px] overflow-y-auto p-3 border rounded-lg">
                                        {antennes.length === 0 ? (
                                            <p className="text-sm text-gray-500 col-span-2">Chargement des antennes...</p>
                                        ) : (
                                            antennes.map((antenne) => (
                                                <FormItem
                                                    key={antenne.id}
                                                    className="flex flex-row items-start space-x-3 space-y-0"
                                                >
                                                    <FormControl>
                                                        <Checkbox
                                                            checked={field.value?.includes(antenne.id)}
                                                            onCheckedChange={(checked) =>
                                                                handleAntenneChange(antenne.id, !!checked)
                                                            }
                                                        />
                                                    </FormControl>
                                                    <FormLabel className="text-sm font-normal cursor-pointer">
                                                        {antenne.name}
                                                    </FormLabel>
                                                </FormItem>
                                            ))
                                        )}
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    {/* ----- Section Publication ----- */}
                    <div className="space-y-6">
                        <div>
                            <FormLabel className="block mb-4">Publication</FormLabel>

                            {/* Checkbox principal "Publier" */}
                            <FormField
                                control={form.control}
                                name="published"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 bg-slate-50/80">
                                        <FormControl>
                                            <Checkbox
                                                checked={field.value}
                                                onCheckedChange={(checked) => {
                                                    field.onChange(checked)
                                                    if (checked) {
                                                        // Si on publie, on initialise le mode à NOW
                                                        form.setValue('publishMode', 'NOW')
                                                        form.setValue('publishedAt', new Date().toISOString())
                                                    } else {
                                                        // Si on dépublie, on retire les infos de publication
                                                        form.setValue('publishMode', undefined)
                                                        form.setValue('publishedAt', undefined)
                                                    }
                                                }}
                                            />
                                        </FormControl>
                                        <div className="space-y-1 leading-none">
                                            <FormLabel className="font-medium cursor-pointer">
                                                Publier l'événement
                                            </FormLabel>
                                            <FormDescription>
                                                Si décoché, l'événement sera enregistré comme brouillon.
                                            </FormDescription>
                                        </div>
                                    </FormItem>
                                )}
                            />

                            {/* Options de publication conditionnelles */}
                            {watchPublished && (
                                <div className="mt-4 ml-7 space-y-4">
                                    <div className="flex items-center space-x-6">
                                        <label className="flex items-center space-x-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                className="w-4 h-4 text-primary"
                                                checked={watchPublishMode === 'NOW'}
                                                onChange={() => handlePublishModeChange('NOW')}
                                            />
                                            <span className="text-sm">Publier maintenant</span>
                                        </label>
                                        <label className="flex items-center space-x-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                className="w-4 h-4 text-primary"
                                                checked={watchPublishMode === 'SCHEDULED'}
                                                onChange={() => handlePublishModeChange('SCHEDULED')}
                                            />
                                            <span className="text-sm">Programmer</span>
                                        </label>
                                    </div>

                                    {watchPublishMode === 'SCHEDULED' && (
                                        <FormField
                                            control={form.control}
                                            name="publishedAt"
                                            render={({ field }) => (
                                                <FormItem className="max-w-xs">
                                                    <FormLabel>Date et heure de publication</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="datetime-local"
                                                            {...field}
                                                            min={new Date().toISOString().slice(0, 16)}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ----- Bouton de soumission ----- */}
                    <div className="pt-6 border-t">
                        <Button
                            type="submit"
                            className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:shadow-lg disabled:opacity-70"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <div className="flex items-center justify-center space-x-2">
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                    <span>{isEditMode ? 'Mise à jour...' : 'Enregistrement...'}</span>
                                </div>
                            ) : isEditMode ? (
                                'Mettre à jour'
                            ) : (
                                "Enregistrer l'événement"
                            )}
                        </Button>
                        {!isEditMode && (
                            <p className="mt-2 text-sm text-gray-500 text-center">
                                L'événement sera enregistré et pourra être modifié ultérieurement.
                            </p>
                        )}
                    </div>
                </form>
            </Form>
        </div>
    )
}
