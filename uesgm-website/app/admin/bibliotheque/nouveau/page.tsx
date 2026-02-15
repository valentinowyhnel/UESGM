"use client"

import React from "react"
import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
    Upload, FileText, X, Plus, ArrowLeft, Loader2, Check, AlertCircle,
    Globe, Users, Lock
} from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

const categoryConfig = {
    STATUTS: { label: "Statuts", color: "bg-blue-100 text-blue-800" },
    RAPPORTS: { label: "Rapports", color: "bg-green-100 text-green-800" },
    GUIDES: { label: "Guides", color: "bg-purple-100 text-purple-800" },
    ACADEMIQUE: { label: "Académique", color: "bg-orange-100 text-orange-800" },
    JURIDIQUE: { label: "Juridique", color: "bg-red-100 text-red-800" },
    ADMINISTRATIF: { label: "Administratif", color: "bg-gray-100 text-gray-800" },
}

const visibilityConfig = {
    PUBLIC: { 
        label: "Public", 
        color: "bg-green-100 text-green-800", 
        icon: Globe,
        description: "Visible par tout le monde"
    },
    MEMBERS_ONLY: { 
        label: "Membres uniquement", 
        color: "bg-blue-100 text-blue-800", 
        icon: Users,
        description: "Visible par les membres connectés"
    },
    ADMIN_ONLY: { 
        label: "Admin uniquement", 
        color: "bg-red-100 text-red-800", 
        icon: Lock,
        description: "Visible uniquement par les administrateurs"
    },
}

function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export default function NouveauDocumentPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [uploadProgress, setUploadProgress] = useState(0)
    const [uploading, setUploading] = useState(false)
    
    // Formulaire
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        category: "ADMINISTRATIF",
        visibility: "PUBLIC",
        tags: [] as string[],
    })
    
    // Fichier
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [fileUrl, setFileUrl] = useState("")
    const [tagInput, setTagInput] = useState("")

    // Gestion du formulaire
    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    // Gestion des tags
    const addTag = () => {
        if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
            setFormData(prev => ({
                ...prev,
                tags: [...prev.tags, tagInput.trim()]
            }))
            setTagInput("")
        }
    }

    const removeTag = (tagToRemove: string) => {
        setFormData(prev => ({
            ...prev,
            tags: prev.tags.filter(tag => tag !== tagToRemove)
        }))
    }

    // États pour le glisser-déposer
    const [isDragging, setIsDragging] = useState(false)

    // Gestion du fichier
    const handleFileSelect = (file: File) => {
        if (!file) return
        
        // Validation du type de fichier
        const allowedTypes = [
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "application/vnd.ms-powerpoint",
            "application/vnd.openxmlformats-officedocument.presentationml.presentation",
            "image/jpeg",
            "image/png",
            "image/gif",
            "text/plain"
        ]
        
        if (!allowedTypes.includes(file.type)) {
            toast.error("Type de fichier non autorisé")
            return
        }
        
        // Validation de la taille (20MB max)
        if (file.size > 20 * 1024 * 1024) {
            toast.error("Le fichier est trop volumineux (max 20MB)")
            return
        }
        
        setSelectedFile(file)
    }

    // Gestion des événements de glisser-déposer
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        e.stopPropagation()
        if (!isDragging) setIsDragging(true)
    }

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(false)
    }

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(false)
        
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFileSelect(e.dataTransfer.files[0])
        }
    }

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            handleFileSelect(e.target.files[0])
        }
    }

    // Upload du fichier
    const uploadFile = async () => {
        if (!selectedFile) return null

        setUploading(true)
        setUploadProgress(0)

        try {
            const formData = new FormData()
            formData.append("file", selectedFile)

            // Simuler la progression
            const updateProgress = () => {
                setUploadProgress(prev => {
                    if (prev >= 90) {
                        clearInterval(progressInterval)
                        return 90
                    }
                    return prev + 10
                })
            }
            const progressInterval = setInterval(updateProgress, 200)

            const response = await fetch("/api/upload-simple", {
                method: "POST",
                headers: {
                    'Accept': 'application/json',
                },
                body: formData,
            })

            clearInterval(progressInterval)
            setUploadProgress(100)

            if (!response.ok) {
                const errorData = await response.text()
                console.error("Erreur d'upload:", errorData)
                throw new Error("Erreur lors de l'upload du fichier")
            }

            const result = await response.json()
            if (!result.fileUrl) {
                throw new Error("URL du fichier manquante dans la réponse")
            }
            return result.fileUrl
        } catch (error) {
            console.error("Upload error:", error)
            toast.error("Erreur lors de l'upload du fichier")
            return null
        } finally {
            setUploading(false)
            setTimeout(() => setUploadProgress(0), 1000)
        }
    }

    // Soumission du formulaire
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        
        if (!formData.title.trim()) {
            toast.error("Le titre est obligatoire")
            return
        }
        
        if (!selectedFile && !fileUrl) {
            toast.error("Veuillez sélectionner un fichier")
            return
        }

        setLoading(true)

        try {
            //Uploader le fichier si nécessaire
            let finalFileUrl = fileUrl
            if (selectedFile && !fileUrl) {
                finalFileUrl = await uploadFile()
                if (!finalFileUrl) {
                    throw new Error("Erreur lors de l'upload")
                }
            }

            // Créer le document
            const response = await fetch("/api/admin/documents", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    title: formData.title,
                    description: formData.description,
                    category: formData.category,
                    visibility: formData.visibility,
                    tags: formData.tags,
                    fileUrl: finalFileUrl,
                    fileName: selectedFile?.name,
                    mimeType: selectedFile?.type,
                    fileSize: selectedFile?.size,
                }),
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || "Erreur lors de la création")
            }

            toast.success("Document créé avec succès")
            router.push("/admin/bibliotheque")
        } catch (error) {
            console.error("Submit error:", error)
            toast.error(error instanceof Error ? error.message : "Erreur lors de la création")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="container mx-auto px-4 py-8">
            {/* En-tête */}
            <div className="flex items-center mb-8">
                <Link href="/admin/bibliotheque">
                    <Button variant="ghost" size="sm" className="mr-4">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Retour
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold font-montserrat text-primary-dark">Nouveau Document</h1>
                    <p className="text-muted-foreground mt-2">
                        Ajoutez un nouveau document à la bibliothèque
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-6">
                {/* Informations principales */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <FileText className="w-5 h-5 mr-2" />
                            Informations du document
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <Label htmlFor="title">Titre *</Label>
                            <Input
                                id="title"
                                value={formData.title}
                                onChange={(e) => handleInputChange("title", e.target.value)}
                                placeholder="Entrez le titre du document"
                                required
                            />
                        </div>
                        
                        <div>
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) => handleInputChange("description", e.target.value)}
                                placeholder="Décrivez le contenu du document"
                                rows={3}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="category">Catégorie</Label>
                                <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(categoryConfig).map(([key, config]) => (
                                            <SelectItem key={key} value={key}>
                                                <div className="flex items-center">
                                                    <Badge className={`mr-2 ${config.color}`}>
                                                        {config.label}
                                                    </Badge>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label htmlFor="visibility">Visibilité</Label>
                                <Select value={formData.visibility} onValueChange={(value) => handleInputChange("visibility", value)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(visibilityConfig).map(([key, config]) => (
                                            <SelectItem key={key} value={key}>
                                                <div className="flex items-center">
                                                    {React.createElement(config.icon, {
                                                        className: "w-4 h-4 mr-2"
                                                    })}
                                                    <div>
                                                        <div className="font-medium">{config.label}</div>
                                                        <div className="text-xs text-gray-500">{config.description}</div>
                                                    </div>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Tags */}
                        <div>
                            <Label>Tags</Label>
                            <div className="flex gap-2 mb-2">
                                <Input
                                    value={tagInput}
                                    onChange={(e) => setTagInput(e.target.value)}
                                    placeholder="Ajouter un tag"
                                    onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                                    className="flex-1"
                                />
                                <Button type="button" onClick={addTag} variant="outline">
                                    <Plus className="w-4 h-4" />
                                </Button>
                            </div>
                            {formData.tags.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {formData.tags.map((tag) => (
                                        <Badge key={tag} variant="secondary" className="cursor-pointer">
                                            {tag}
                                            <X
                                                className="w-3 h-3 ml-1"
                                                onClick={() => removeTag(tag)}
                                            />
                                        </Badge>
                                    ))}
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Upload du fichier */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <Upload className="w-5 h-5 mr-2" />
                            Fichier
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {!selectedFile ? (
                            <div 
                                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'}`}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                            >
                                <Upload className={`w-12 h-12 mx-auto mb-4 ${isDragging ? 'text-blue-500' : 'text-gray-400'}`} />
                                <div className="mb-4">
                                    <p className="text-lg font-medium">
                                        {isDragging ? 'Déposez le fichier ici' : 'Glissez-déposez un fichier ici'}
                                    </p>
                                    <p className="text-sm text-gray-500">ou cliquez pour sélectionner</p>
                                </div>
                                <input
                                    type="file"
                                    onChange={handleFileInputChange}
                                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.txt"
                                    className="hidden"
                                    id="file-upload"
                                    title="Sélectionner un fichier à uploader"
                                />
                                <Label htmlFor="file-upload">
                                    <Button type="button" variant="outline" className="cursor-pointer">
                                        Parcourir les fichiers
                                    </Button>
                                </Label>
                                <div className="mt-4 text-xs text-gray-500">
                                    Formats acceptés: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, JPG, PNG, GIF, TXT<br />
                                    Taille maximale: 20MB
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                    <div className="flex items-center">
                                        <FileText className="w-8 h-8 text-blue-500 mr-3" />
                                        <div>
                                            <p className="font-medium">{selectedFile.name}</p>
                                            <p className="text-sm text-gray-500">
                                                {formatFileSize(selectedFile.size)} • {selectedFile.type}
                                            </p>
                                        </div>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setSelectedFile(null)}
                                    >
                                        <X className="w-4 h-4" />
                                    </Button>
                                </div>

                                {uploading && (
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between text-sm">
                                            <span>Upload en cours...</span>
                                            <span>{uploadProgress}%</span>
                                        </div>
                                        <Progress value={uploadProgress} className="w-full" />
                                    </div>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Actions */}
                <div className="flex justify-end gap-4">
                    <Link href="/admin/bibliotheque">
                        <Button variant="outline" type="button">
                            Annuler
                        </Button>
                    </Link>
                    <Button type="submit" disabled={loading || uploading}>
                        {loading ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Création en cours...
                            </>
                        ) : (
                            <>
                                <Check className="w-4 h-4 mr-2" />
                                Créer le document
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </div>
    )
}
