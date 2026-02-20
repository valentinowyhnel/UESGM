"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, Upload, X, Image as ImageIcon, Plus, Save } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

interface ProjectFormData {
    title: string
    slug: string
    description: string
    shortDesc: string
    category: string
    status: "PLANNED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED"
    progress: number
    startDate: string
    endDate: string
    location: string
    team: string[]
    objectives: string[]
    tags: string[]
    budget: number
    currentBudget: number
    isPublished: boolean
    images: File[]
}

const categories = [
    { value: "EDUCATION", label: "Éducation" },
    { value: "SOCIAL", label: "Social" },
    { value: "HEALTH", label: "Santé" },
    { value: "DIGITAL", label: "Digital" },
    { value: "PARTNERSHIP", label: "Partenariat" }
]

const statusOptions = [
    { value: "PLANNED", label: "Planifié" },
    { value: "IN_PROGRESS", label: "En Cours" },
    { value: "COMPLETED", label: "Terminé" },
    { value: "CANCELLED", label: "Annulé" }
]

export default function EditProjectPage() {
    const router = useRouter()
    const params = useParams()
    const projectId = params.id as string
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [loading, setLoading] = useState(true)
    const [uploadProgress, setUploadProgress] = useState(0)
    const [formData, setFormData] = useState<ProjectFormData>({
        title: "",
        slug: "",
        description: "",
        shortDesc: "",
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
        isPublished: false,
        images: []
    })

    const [newTeamMember, setNewTeamMember] = useState("")
    const [newObjective, setNewObjective] = useState("")
    const [newTag, setNewTag] = useState("")
    const [imagePreviews, setImagePreviews] = useState<string[]>([])

    // Charger les données du projet
    useEffect(() => {
        async function fetchProject() {
            try {
                const response = await fetch(`/api/admin/projects/${projectId}`)
                if (!response.ok) {
                    throw new Error('Projet non trouvé')
                }
                const data = await response.json()
                const project = data.project
                
                setFormData({
                    title: project.title || "",
                    slug: project.slug || "",
                    description: project.description || "",
                    shortDesc: project.shortDesc || "",
                    category: project.category || "",
                    status: project.status || "PLANNED",
                    progress: project.progress || 0,
                    startDate: project.startDate ? new Date(project.startDate).toISOString().split('T')[0] : "",
                    endDate: project.endDate ? new Date(project.endDate).toISOString().split('T')[0] : "",
                    location: project.location || "",
                    team: project.team || [],
                    objectives: project.objectives || [],
                    tags: project.tags?.map((t: any) => t.name) || [],
                    budget: project.budget || 0,
                    currentBudget: project.currentBudget || 0,
                    isPublished: project.isPublished || false,
                    images: []
                })
            } catch (error) {
                console.error('Erreur chargement projet:', error)
                toast.error("Erreur lors du chargement du projet")
                router.push("/admin/projets")
            } finally {
                setLoading(false)
            }
        }

        if (projectId) {
            fetchProject()
        }
    }, [projectId, router])

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
            // Simuler l'upload des images
            if (formData.images.length > 0) {
                for (let i = 0; i <= 100; i += 10) {
                    setUploadProgress(i)
                    await new Promise(resolve => setTimeout(resolve, 50))
                }
            }

            // Préparer les données du projet
            const projectData = {
                title: formData.title,
                slug: formData.slug,
                description: formData.description,
                shortDesc: formData.shortDesc || formData.description.substring(0, 200),
                category: formData.category,
                status: formData.status,
                progress: formData.progress,
                startDate: formData.startDate ? new Date(formData.startDate).toISOString() : null,
                endDate: formData.endDate ? new Date(formData.endDate).toISOString() : null,
                isPublished: formData.isPublished,
            }

            // Envoyer les données à l'API
            const response = await fetch(`/api/admin/projects/${projectId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(projectData),
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || 'Erreur lors de la mise à jour du projet')
            }

            const result = await response.json()
            toast.success("Projet mis à jour avec succès!")
            router.push("/admin/projets")
        } catch (error: any) {
            console.error('Erreur mise à jour projet:', error)
            toast.error(error.message || "Erreur lors de la mise à jour du projet")
        } finally {
            setIsSubmitting(false)
            setUploadProgress(0)
        }
    }

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                        <p className="text-muted-foreground">Chargement du projet...</p>
                    </div>
                </div>
            </div>
        )
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
                        Modifier le Projet
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Mettez à jour les informations du projet
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
                            <Label htmlFor="shortDesc">Description courte (pour les cartes)</Label>
                            <Textarea
                                id="shortDesc"
                                value={formData.shortDesc}
                                onChange={(e) => handleInputChange('shortDesc', e.target.value)}
                                placeholder="Version courte de la description (200 caractères max)..."
                                rows={2}
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
                                            <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
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
                                        {statusOptions.map(status => (
                                            <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
                                        ))}
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

                {/* Dates et budget */}
                <Card>
                    <CardHeader>
                        <CardTitle>Dates et Budget</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <Label htmlFor="budget">Budget prévu (MAD)</Label>
                                <Input
                                    id="budget"
                                    type="number"
                                    min="0"
                                    value={formData.budget}
                                    onChange={(e) => handleInputChange('budget', parseInt(e.target.value) || 0)}
                                    placeholder="0"
                                />
                            </div>
                            <div>
                                <Label htmlFor="currentBudget">Budget actuel (MAD)</Label>
                                <Input
                                    id="currentBudget"
                                    type="number"
                                    min="0"
                                    value={formData.currentBudget}
                                    onChange={(e) => handleInputChange('currentBudget', parseInt(e.target.value) || 0)}
                                    placeholder="0"
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
                    <CardContent className="space-y-4">
                        <div className="flex gap-2">
                            <Input
                                value={newTeamMember}
                                onChange={(e) => setNewTeamMember(e.target.value)}
                                placeholder="Nom d'un membre de l'équipe..."
                                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTeamMember())}
                            />
                            <Button type="button" onClick={addTeamMember}>
                                <Plus className="w-4 h-4" />
                            </Button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {formData.team.map((member, index) => (
                                <span key={index} className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                                    {member}
                                    <button type="button" onClick={() => removeTeamMember(index)} className="hover:text-red-500">
                                        <X className="w-3 h-3" />
                                    </button>
                                </span>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Objectifs */}
                <Card>
                    <CardHeader>
                        <CardTitle>Objectifs</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex gap-2">
                            <Input
                                value={newObjective}
                                onChange={(e) => setNewObjective(e.target.value)}
                                placeholder="Un objectif du projet..."
                                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addObjective())}
                            />
                            <Button type="button" onClick={addObjective}>
                                <Plus className="w-4 h-4" />
                            </Button>
                        </div>
                        <ul className="space-y-2">
                            {formData.objectives.map((objective, index) => (
                                <li key={index} className="flex items-center gap-2">
                                    <span className="text-green-500">✓</span>
                                    <span>{objective}</span>
                                    <button type="button" onClick={() => removeObjective(index)} className="text-red-500 hover:text-red-700">
                                        <X className="w-4 h-4" />
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>

                {/* Tags */}
                <Card>
                    <CardHeader>
                        <CardTitle>Tags</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex gap-2">
                            <Input
                                value={newTag}
                                onChange={(e) => setNewTag(e.target.value)}
                                placeholder="Ajouter un tag..."
                                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                            />
                            <Button type="button" onClick={addTag}>
                                <Plus className="w-4 h-4" />
                            </Button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {formData.tags.map((tag, index) => (
                                <span key={index} className="inline-flex items-center gap-1 bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm">
                                    #{tag}
                                    <button type="button" onClick={() => removeTag(index)} className="hover:text-red-500">
                                        <X className="w-3 h-3" />
                                    </button>
                                </span>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Publication */}
                <Card>
                    <CardHeader>
                        <CardTitle>Publication</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="isPublished"
                                checked={formData.isPublished}
                                onCheckedChange={(checked) => handleInputChange('isPublished', checked as boolean)}
                            />
                            <Label htmlFor="isPublished" className="text-sm font-medium">
                                Publié (visible sur le site public)
                            </Label>
                        </div>
                        <p className="text-sm text-muted-foreground mt-2">
                            {formData.isPublished 
                                ? "Ce projet est actuellement visible par tous les visiteurs." 
                                : "Ce projet n'est visible que dans l'interface d'administration."}
                        </p>
                    </CardContent>
                </Card>

                {/* Submit */}
                <div className="flex justify-end gap-4">
                    <Button type="button" variant="outline" onClick={() => router.push("/admin/projets")}>
                        Annuler
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Enregistrement...
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4 mr-2" />
                                Enregistrer les modifications
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </div>
    )
}
