"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, Upload, X, Image as ImageIcon, Plus } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

interface ProjectFormData {
    title: string
    slug: string
    description: string
    longDescription: string
    category: string
    status: "PLANNED" | "IN_PROGRESS" | "COMPLETED"
    progress: number
    startDate: string
    endDate: string
    location: string
    team: string[]
    objectives: string[]
    tags: string[]
    budget: number
    currentBudget: number
    images: File[]
}

const categories = [
    "Éducation",
    "Santé", 
    "Infrastructure",
    "Social",
    "Culture",
    "Sport",
    "Technologie",
    "Environnement"
]

export default function NewProjectPage() {
    const router = useRouter()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [uploadProgress, setUploadProgress] = useState(0)
    const [formData, setFormData] = useState<ProjectFormData>({
        title: "",
        slug: "",
        description: "",
        longDescription: "",
        category: "",
        status: "PLANNED",
        progress: 0,
        startDate: "",
        endDate: "",
        location: "",
        team: [],
        objectives: [],
        tags: [],
        budget: 0,
        currentBudget: 0,
        images: []
    })

    const [newTeamMember, setNewTeamMember] = useState("")
    const [newObjective, setNewObjective] = useState("")
    const [newTag, setNewTag] = useState("")
    const [imagePreviews, setImagePreviews] = useState<string[]>([])

    const generateSlug = (title: string) => {
        return title
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim()
    }

    const handleInputChange = (field: keyof ProjectFormData, value: any) => {
        if (field === 'title') {
            const slug = generateSlug(value)
            setFormData(prev => ({ ...prev, [field]: value, slug }))
        } else {
            setFormData(prev => ({ ...prev, [field]: value }))
        }
    }

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || [])
        const validFiles = files.filter(file => file.type.startsWith('image/'))
        
        setFormData(prev => ({ ...prev, images: [...prev.images, ...validFiles] }))
        
        // Créer des aperçus
        validFiles.forEach(file => {
            const reader = new FileReader()
            reader.onload = (e) => {
                setImagePreviews(prev => [...prev, e.target?.result as string])
            }
            reader.readAsDataURL(file)
        })
    }

    const removeImage = (index: number) => {
        setFormData(prev => ({
            ...prev,
            images: prev.images.filter((_, i) => i !== index)
        }))
        setImagePreviews(prev => prev.filter((_, i) => i !== index))
    }

    const addTeamMember = () => {
        if (newTeamMember.trim()) {
            setFormData(prev => ({
                ...prev,
                team: [...prev.team, newTeamMember.trim()]
            }))
            setNewTeamMember("")
        }
    }

    const removeTeamMember = (index: number) => {
        setFormData(prev => ({
            ...prev,
            team: prev.team.filter((_, i) => i !== index)
        }))
    }

    const addObjective = () => {
        if (newObjective.trim()) {
            setFormData(prev => ({
                ...prev,
                objectives: [...prev.objectives, newObjective.trim()]
            }))
            setNewObjective("")
        }
    }

    const removeObjective = (index: number) => {
        setFormData(prev => ({
            ...prev,
            objectives: prev.objectives.filter((_, i) => i !== index)
        }))
    }

    const addTag = () => {
        if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
            setFormData(prev => ({
                ...prev,
                tags: [...prev.tags, newTag.trim()]
            }))
            setNewTag("")
        }
    }

    const removeTag = (index: number) => {
        setFormData(prev => ({
            ...prev,
            tags: prev.tags.filter((_, i) => i !== index)
        }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)

        try {
            // Upload des images et récupération des URLs
            const imageUrls: string[] = []
            
            if (formData.images.length > 0) {
                for (let i = 0; i < formData.images.length; i++) {
                    const file = formData.images[i]
                    const formDataUpload = new FormData()
                    formDataUpload.append('file', file)
                    
                    const uploadResponse = await fetch('/api/admin/upload', {
                        method: 'POST',
                        body: formDataUpload
                    })
                    
                    if (!uploadResponse.ok) {
                        throw new Error(`Erreur lors de l'upload de l'image ${i + 1}`)
                    }
                    
                    const uploadResult = await uploadResponse.json()
                    imageUrls.push(uploadResult.fileUrl)
                    
                    // Mettre à jour la progression
                    setUploadProgress(Math.round(((i + 1) / formData.images.length) * 100))
                }
            }

            // Préparer les données du projet
            const projectData = {
                title: formData.title,
                slug: formData.slug,
                description: formData.description,
                shortDesc: formData.description.substring(0, 200),
                category: formData.category,
                status: formData.status,
                progress: formData.progress,
                startDate: formData.startDate ? new Date(formData.startDate).toISOString() : null,
                endDate: formData.endDate ? new Date(formData.endDate).toISOString() : null,
                isPublished: false, // Par défaut, non publié
                imageUrl: imageUrls.length > 0 ? imageUrls[0] : null, // Première image comme image principale
                images: imageUrls // Toutes les images
            }

            // Envoyer les données à l'API
            const response = await fetch('/api/admin/projects', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(projectData),
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || 'Erreur lors de la création du projet')
            }

            const result = await response.json()
            toast.success("Projet créé avec succès!")
            router.push("/admin/projets")
        } catch (error: any) {
            console.error('Erreur création projet:', error)
            toast.error(error.message || "Erreur lors de la création du projet")
        } finally {
            setIsSubmitting(false)
            setUploadProgress(0)
        }
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            {/* En-tête */}
            <div className="flex items-center gap-4 mb-8">
                <Link href="/admin/projets">
                    <Button variant="ghost" size="sm">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Retour
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold font-montserrat text-primary-dark">
                        Nouveau Projet
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Créez un nouveau projet pour l'UESGM
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Informations principales */}
                <Card>
                    <CardHeader>
                        <CardTitle>Informations principales</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <Label htmlFor="title">Titre du projet *</Label>
                                <Input
                                    id="title"
                                    value={formData.title}
                                    onChange={(e) => handleInputChange('title', e.target.value)}
                                    placeholder="Ex: Guide de l'Étudiant 2026"
                                    required
                                />
                            </div>
                            <div>
                                <Label htmlFor="slug">Slug (URL)</Label>
                                <Input
                                    id="slug"
                                    value={formData.slug}
                                    onChange={(e) => handleInputChange('slug', e.target.value)}
                                    placeholder="guide-etudiant-2026"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="description">Description courte *</Label>
                            <Textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) => handleInputChange('description', e.target.value)}
                                placeholder="Description en une phrase du projet..."
                                rows={3}
                                required
                            />
                        </div>

                        <div>
                            <Label htmlFor="longDescription">Description détaillée</Label>
                            <Textarea
                                id="longDescription"
                                value={formData.longDescription}
                                onChange={(e) => handleInputChange('longDescription', e.target.value)}
                                placeholder="Description complète du projet, objectifs, contexte..."
                                rows={6}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <Label htmlFor="category">Catégorie *</Label>
                                <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Sélectionner une catégorie" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categories.map(cat => (
                                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label htmlFor="status">Statut *</Label>
                                <Select value={formData.status} onValueChange={(value: any) => handleInputChange('status', value)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="PLANNED">Planifié</SelectItem>
                                        <SelectItem value="IN_PROGRESS">En Cours</SelectItem>
                                        <SelectItem value="COMPLETED">Terminé</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label htmlFor="progress">Progression (%)</Label>
                                <Input
                                    id="progress"
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={formData.progress}
                                    onChange={(e) => handleInputChange('progress', parseInt(e.target.value) || 0)}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Images */}
                <Card>
                    <CardHeader>
                        <CardTitle>Images du projet</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                                <input
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    className="hidden"
                                    id="image-upload"
                                />
                                <label htmlFor="image-upload" className="cursor-pointer">
                                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                    <p className="text-lg font-medium text-gray-900 mb-2">
                                        Cliquez pour uploader des images
                                    </p>
                                    <p className="text-sm text-gray-500">
                                        PNG, JPG, GIF jusqu'à 10MB par image
                                    </p>
                                </label>
                            </div>

                            {imagePreviews.length > 0 && (
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {imagePreviews.map((preview, index) => (
                                        <div key={index} className="relative group">
                                            <div className="aspect-square rounded-lg overflow-hidden border">
                                                <img
                                                    src={preview}
                                                    alt={`Aperçu ${index + 1}`}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => removeImage(index)}
                                                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                                aria-label="Supprimer l'image"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {uploadProgress > 0 && (
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span>Upload en cours...</span>
                                        <span>{uploadProgress}%</span>
                                    </div>
                                    <Progress value={uploadProgress} />
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Détails du projet */}
                <Card>
                    <CardHeader>
                        <CardTitle>Détails du projet</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <Label htmlFor="startDate">Date de début</Label>
                                <Input
                                    id="startDate"
                                    type="date"
                                    value={formData.startDate}
                                    onChange={(e) => handleInputChange('startDate', e.target.value)}
                                />
                            </div>
                            <div>
                                <Label htmlFor="endDate">Date de fin</Label>
                                <Input
                                    id="endDate"
                                    type="date"
                                    value={formData.endDate}
                                    onChange={(e) => handleInputChange('endDate', e.target.value)}
                                />
                            </div>
                            <div>
                                <Label htmlFor="location">Lieu</Label>
                                <Input
                                    id="location"
                                    value={formData.location}
                                    onChange={(e) => handleInputChange('location', e.target.value)}
                                    placeholder="Ex: Rabat"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <Label htmlFor="budget">Budget total (MAD)</Label>
                                <Input
                                    id="budget"
                                    type="number"
                                    min="0"
                                    value={formData.budget}
                                    onChange={(e) => handleInputChange('budget', parseInt(e.target.value) || 0)}
                                    placeholder="50000"
                                />
                            </div>
                            <div>
                                <Label htmlFor="currentBudget">Budget dépensé (MAD)</Label>
                                <Input
                                    id="currentBudget"
                                    type="number"
                                    min="0"
                                    value={formData.currentBudget}
                                    onChange={(e) => handleInputChange('currentBudget', parseInt(e.target.value) || 0)}
                                    placeholder="25000"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Équipe */}
                <Card>
                    <CardHeader>
                        <CardTitle>Équipe du projet</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex gap-2">
                                <Input
                                    value={newTeamMember}
                                    onChange={(e) => setNewTeamMember(e.target.value)}
                                    placeholder="Nom du membre de l'équipe"
                                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTeamMember())}
                                />
                                <Button type="button" onClick={addTeamMember} aria-label="Ajouter un membre">
                                    <Plus className="w-4 h-4" />
                                </Button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {formData.team.map((member, index) => (
                                    <div key={index} className="bg-gray-100 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                                        {member}
                                        <button
                                            type="button"
                                            onClick={() => removeTeamMember(index)}
                                            className="text-red-500 hover:text-red-700"
                                            aria-label="Supprimer le membre"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Objectifs */}
                <Card>
                    <CardHeader>
                        <CardTitle>Objectifs du projet</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex gap-2">
                                <Input
                                    value={newObjective}
                                    onChange={(e) => setNewObjective(e.target.value)}
                                    placeholder="Objectif du projet"
                                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addObjective())}
                                />
                                <Button type="button" onClick={addObjective} aria-label="Ajouter un objectif">
                                    <Plus className="w-4 h-4" />
                                </Button>
                            </div>
                            <div className="space-y-2">
                                {formData.objectives.map((objective, index) => (
                                    <div key={index} className="flex items-center gap-2 bg-gray-50 p-3 rounded">
                                        <div className="w-2 h-2 bg-gold rounded-full flex-shrink-0" />
                                        <span className="flex-1">{objective}</span>
                                        <button
                                            type="button"
                                            onClick={() => removeObjective(index)}
                                            className="text-red-500 hover:text-red-700"
                                            aria-label="Supprimer l'objectif"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Tags */}
                <Card>
                    <CardHeader>
                        <CardTitle>Tags</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex gap-2">
                                <Input
                                    value={newTag}
                                    onChange={(e) => setNewTag(e.target.value)}
                                    placeholder="Ajouter un tag"
                                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                                />
                                <Button type="button" onClick={addTag} aria-label="Ajouter un tag">
                                    <Plus className="w-4 h-4" />
                                </Button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {formData.tags.map((tag, index) => (
                                    <span key={index} className="bg-gray-100 px-3 py-1 rounded-md text-sm flex items-center gap-2">
                                        #{tag}
                                        <button
                                            type="button"
                                            onClick={() => removeTag(index)}
                                            className="text-red-500 hover:text-red-700"
                                            aria-label="Supprimer le tag"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Actions */}
                <div className="flex justify-end gap-4">
                    <Link href="/admin/projets">
                        <Button variant="outline" type="button">
                            Annuler
                        </Button>
                    </Link>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? "Création en cours..." : "Créer le projet"}
                    </Button>
                </div>
            </form>
        </div>
    )
}
