'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { Upload, Loader2, FileText, X } from 'lucide-react'

const documentSchema = z.object({
    title: z.string().min(3, "Le titre est trop court"),
    description: z.string().optional(),
    category: z.enum(["STATUTS", "RAPPORTS", "GUIDES", "LIVRES", "ARTICLES", "PROJETS_SCIENTIFIQUES"]),
    tags: z.string().optional(),
    published: z.boolean(),
})

export default function DocumentForm() {
    const router = useRouter()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [fileUrl, setFileUrl] = useState<string>('')
    const [fileName, setFileName] = useState<string>('')
    const [fileSize, setFileSize] = useState<number>(0)
    const [uploading, setUploading] = useState(false)

    const form = useForm<z.infer<typeof documentSchema>>({
        resolver: zodResolver(documentSchema),
        defaultValues: {
            title: '',
            description: '',
            category: 'RAPPORTS',
            tags: '',
            published: false,
        }
    })

    async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (!file) return

        // Validate file type
        if (file.type !== 'application/pdf') {
            toast.error("Seuls les fichiers PDF sont acceptés")
            return
        }

        setUploading(true)
        const formData = new FormData()
        formData.append('file', file)
        formData.append('bucket', 'documents')

        try {
            const res = await fetch('/api/upload-simple', {
                method: 'POST',
                body: formData
            })
            const data = await res.json()
            if (data.success) {
                setFileUrl(data.url)
                setFileName(file.name)
                setFileSize(file.size)
                toast.success("Document uploadé avec succès")
            } else {
                toast.error(data.error || "Erreur lors de l'upload")
            }
        } catch (err) {
            toast.error("Échec de l'envoi")
        } finally {
            setUploading(false)
        }
    }

    async function onSubmit(values: z.infer<typeof documentSchema>) {
        if (!fileUrl) {
            toast.error("Veuillez uploader un document")
            return
        }

        setIsSubmitting(true)
        try {
            const tags = values.tags ? values.tags.split(',').map(t => t.trim()) : []

            const res = await fetch('/api/documents', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...values,
                    fileUrl,
                    fileType: 'application/pdf',
                    fileSize,
                    tags,
                })
            })

            if (res.ok) {
                toast.success("Document créé avec succès !")
                router.push('/admin/bibliotheque')
                router.refresh()
            } else {
                const data = await res.json()
                toast.error(data.error || "Une erreur est survenue")
            }
        } catch (err) {
            toast.error("Impossible de contacter le serveur")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 max-w-3xl mx-auto">
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Titre du document</FormLabel>
                                <FormControl>
                                    <Input placeholder="Ex: Statuts de l'UESGM 2025" {...field} />
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
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Sélectionner une catégorie" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="STATUTS">Statuts</SelectItem>
                                        <SelectItem value="RAPPORTS">Rapports</SelectItem>
                                        <SelectItem value="GUIDES">Guides</SelectItem>
                                        <SelectItem value="LIVRES">Livres</SelectItem>
                                        <SelectItem value="ARTICLES">Articles</SelectItem>
                                        <SelectItem value="PROJETS_SCIENTIFIQUES">Projets Scientifiques</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Description (optionnelle)</FormLabel>
                                <FormControl>
                                    <Textarea
                                        placeholder="Décrivez le contenu du document..."
                                        className="min-h-[100px]"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="tags"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Tags (séparés par des virgules)</FormLabel>
                                <FormControl>
                                    <Input placeholder="Ex: juridique, 2025, officiel" {...field} />
                                </FormControl>
                                <FormDescription>
                                    Utilisez des virgules pour séparer les tags
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div className="border-2 border-dashed border-slate-300 rounded-lg p-8">
                        <FormLabel className="block mb-4">Fichier PDF</FormLabel>
                        {!fileUrl ? (
                            <label className="flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 transition-colors rounded-lg p-6">
                                <Upload className="w-12 h-12 text-slate-400 mb-3" />
                                <span className="text-sm font-medium text-slate-700 mb-1">
                                    Cliquez pour uploader un PDF
                                </span>
                                <span className="text-xs text-slate-500">Maximum 20MB</span>
                                <input
                                    type="file"
                                    className="hidden"
                                    accept="application/pdf"
                                    onChange={handleFileUpload}
                                    disabled={uploading}
                                />
                            </label>
                        ) : (
                            <div className="flex items-center justify-between bg-slate-50 p-4 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <FileText className="w-8 h-8 text-red-600" />
                                    <div>
                                        <p className="font-medium text-slate-900">{fileName}</p>
                                        <p className="text-xs text-slate-500">
                                            {(fileSize / 1024 / 1024).toFixed(2)} MB
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setFileUrl('')
                                        setFileName('')
                                        setFileSize(0)
                                    }}
                                    className="p-2 hover:bg-red-100 rounded-full transition-colors"
                                    aria-label="Supprimer le fichier"
                                >
                                    <X className="w-5 h-5 text-red-600" />
                                </button>
                            </div>
                        )}
                        {uploading && <p className="text-xs text-slate-500 animate-pulse mt-2">Téléchargement en cours...</p>}
                    </div>

                    <FormField
                        control={form.control}
                        name="published"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 bg-gold/5 border-gold/10">
                                <FormControl>
                                    <Checkbox
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                    />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                    <FormLabel className="font-bold cursor-pointer">Publier immédiatement</FormLabel>
                                    <FormDescription>
                                        Si décoché, le document sera enregistré comme brouillon.
                                    </FormDescription>
                                </div>
                            </FormItem>
                        )}
                    />

                    <div className="flex justify-end gap-4 border-t pt-6">
                        <Button variant="outline" type="button" onClick={() => router.back()}>
                            Annuler
                        </Button>
                        <Button
                            type="submit"
                            className="bg-slate-900 text-white min-w-[200px]"
                            disabled={isSubmitting || !fileUrl}
                        >
                            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                            Enregistrer le document
                        </Button>
                    </div>
                </form>
            </Form>
        </div>
    )
}
