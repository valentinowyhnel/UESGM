"use client"

import { useState, useEffect } from "react"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
    FileText, Download, Eye, EyeOff, Search, Filter, Upload, Trash2, 
    Calendar, User, File, FileImage, FileVideo, FileAudio,
    RefreshCw, FolderOpen, Share2, Edit, Loader2
} from "lucide-react"
import { toast } from "sonner"
import { CriticalAction, SuspendAction } from "@/components/admin/SecureAction"

interface Document {
    id: string
    title: string
    description: string
    category: string
    tags: string[]
    fileUrl: string
    fileName: string
    fileSize: number
    mimeType: string
    published: boolean
    uploadedById: string
    createdAt: Date
    updatedAt: Date
}

export default function AdminDocuments() {
    const [documents, setDocuments] = useState<Document[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [selectedCategory, setSelectedCategory] = useState("all")
    const [selectedTab, setSelectedTab] = useState("all")
    const [uploading, setUploading] = useState(false)

    useEffect(() => {
        loadDocuments()
    }, [])

    const loadDocuments = async () => {
        try {
            setLoading(true)
            const response = await fetch('/api/admin/documents-simple')
            if (!response.ok) {
                throw new Error('Erreur lors du chargement des documents')
            }
            const data = await response.json()
            setDocuments(data.documents || [])
        } catch (error: any) {
            toast.error("Erreur", {
                description: error.message || "Impossible de charger les documents"
            })
        } finally {
            setLoading(false)
        }
    }

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return

        // Validation basique
        if (file.size > 10 * 1024 * 1024) { // 10MB
            toast.error("Fichier trop volumineux", {
                description: "La taille maximale autorisée est de 10MB"
            })
            return
        }

        const allowedTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-powerpoint',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation'
        ]

        if (!allowedTypes.includes(file.type)) {
            toast.error("Type de fichier non autorisé", {
                description: "Veuillez uploader un PDF, Word, Excel ou PowerPoint"
            })
            return
        }

        setUploading(true)
        try {
            const formData = new FormData()
            formData.append('file', file)
            formData.append('title', file.name.replace(/\.[^/.]+$/, ""))
            formData.append('category', 'documents')
            formData.append('published', 'false')

            const response = await fetch('/api/admin/documents-simple', {
                method: 'POST',
                body: formData
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || 'Erreur lors de l\'upload')
            }

            toast.success("Document uploadé avec succès")
            loadDocuments() // Recharger la liste
        } catch (error: any) {
            toast.error("Erreur d'upload", {
                description: error.message || "Veuillez réessayer"
            })
        } finally {
            setUploading(false)
            // Réinitialiser l'input
            event.target.value = ''
        }
    }

    const handleDelete = async (documentId: string) => {
        try {
            const response = await fetch(`/api/admin/documents-simple/${documentId}`, {
                method: 'DELETE'
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || 'Erreur lors de la suppression')
            }

            toast.success('Document supprimé avec succès')
            loadDocuments() // Recharger la liste
        } catch (error: any) {
            throw error // Laisser SecureAction gérer l'erreur
        }
    }

    const handleTogglePublish = async (documentId: string, currentPublished: boolean) => {
        try {
            const response = await fetch(`/api/admin/documents-simple/${documentId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ published: !currentPublished })
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || 'Erreur lors de la modification')
            }

            toast.success(`Document ${!currentPublished ? 'publié' : 'mis en brouillon'}`)
            loadDocuments() // Recharger la liste
        } catch (error: any) {
            toast.error("Erreur", {
                description: error.message || "Impossible de modifier le statut"
            })
        }
    }

    const getFileIcon = (mimeType: string) => {
        switch (mimeType) {
            case 'application/pdf': return <FileText className="w-5 h-5 text-red-500" />
            case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 
            case 'application/msword': return <FileText className="w-5 h-5 text-blue-500" />
            case 'application/vnd.openxmlformats-officedocument.presentationml.presentation':
            case 'application/vnd.ms-powerpoint': return <FileText className="w-5 h-5 text-orange-500" />
            case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
            case 'application/vnd.ms-excel': return <FileText className="w-5 h-5 text-green-500" />
            case 'image/jpeg': case 'image/png': case 'image/gif': return <FileImage className="w-5 h-5 text-purple-500" />
            case 'video/mp4': case 'video/avi': return <FileVideo className="w-5 h-5 text-indigo-500" />
            case 'audio/mp3': case 'audio/wav': return <FileAudio className="w-5 h-5 text-pink-500" />
            default: return <File className="w-5 h-5 text-gray-500" />
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'published': return 'bg-green-100 text-green-800'
            case 'draft': return 'bg-yellow-100 text-yellow-800'
            case 'archived': return 'bg-gray-100 text-gray-800'
            default: return 'bg-gray-100 text-gray-800'
        }
    }

    const filteredDocuments = documents.filter(doc => {
        const matchesSearch = doc.title && searchTerm ? 
            doc.title.toLowerCase().includes(searchTerm.toLowerCase()) : 
            true
        const matchesCategory = !selectedCategory || selectedCategory === 'all' || doc.category === selectedCategory
        const matchesTab = !selectedTab || selectedTab === 'all' || (doc.published ? 'published' : 'draft') === selectedTab
        return matchesSearch && matchesCategory && matchesTab
    })

    const stats = {
        total: documents.length,
        published: documents.filter(d => d.published).length,
        draft: documents.filter(d => !d.published).length,
        archived: 0, // Pas implémenté dans l'API simplifiée
        totalDownloads: 0 // Pas implémenté dans l'API simplifiée
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold font-montserrat text-slate-900 dark:text-white">
                        Gestion des Documents
                    </h1>
                    <p className="text-slate-500 mt-1">
                        Bibliothèque de documents administratifs
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={loadDocuments} disabled={loading}>
                        <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        Actualiser
                    </Button>
                    <div className="relative">
                        <label htmlFor="document-upload" className="cursor-pointer">
                            <input
                                id="document-upload"
                                type="file"
                                onChange={handleFileUpload}
                                disabled={uploading}
                                className="sr-only"
                                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                                placeholder="Choisir un fichier à uploader"
                            />
                            <Button disabled={uploading} asChild>
                                <span>
                                    {uploading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Upload...
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="w-4 h-4 mr-2" />
                                            Ajouter un document
                                        </>
                                    )}
                                </span>
                            </Button>
                        </label>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-500">Total</p>
                                <p className="text-2xl font-bold">{stats.total}</p>
                            </div>
                            <FolderOpen className="w-8 h-8 text-blue-500" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-500">Publiés</p>
                                <p className="text-2xl font-bold">{stats.published}</p>
                            </div>
                            <FileText className="w-8 h-8 text-green-500" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-500">Brouillons</p>
                                <p className="text-2xl font-bold">{stats.draft}</p>
                            </div>
                            <FileText className="w-8 h-8 text-yellow-500" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-500">Archivés</p>
                                <p className="text-2xl font-bold">{stats.archived}</p>
                            </div>
                            <FileText className="w-8 h-8 text-gray-500" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-500">Téléchargements</p>
                                <p className="text-2xl font-bold">{stats.totalDownloads}</p>
                            </div>
                            <Download className="w-8 h-8 text-purple-500" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters and Search */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1">
                            <div className="relative">
                                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                <Input
                                    placeholder="Rechercher un document..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className="px-3 py-2 border rounded-md text-sm"
                                aria-label="Filtrer par catégorie"
                            >
                                <option value="all">Toutes catégories</option>
                                <option value="rapports">Rapports</option>
                                <option value="presentations">Présentations</option>
                                <option value="financiers">Financiers</option>
                                <option value="administratifs">Administratifs</option>
                            </select>
                            <Button variant="outline" size="sm">
                                <Filter className="w-4 h-4 mr-2" />
                                Filtres
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Documents List */}
            <Tabs value={selectedTab} onValueChange={setSelectedTab}>
                <TabsList>
                    <TabsTrigger value="all">Tous ({stats.total})</TabsTrigger>
                    <TabsTrigger value="published">Publiés ({stats.published})</TabsTrigger>
                    <TabsTrigger value="draft">Brouillons ({stats.draft})</TabsTrigger>
                    <TabsTrigger value="archived">Archivés ({stats.archived})</TabsTrigger>
                </TabsList>

                <TabsContent value={selectedTab} className="space-y-4">
                    <div className="grid gap-4">
                        {filteredDocuments.map((doc) => (
                            <Card key={doc.id} className="hover:shadow-md transition-shadow">
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            {getFileIcon(doc.mimeType)}
                                            <div>
                                                <h3 className="font-semibold text-slate-900">{doc.title}</h3>
                                                {doc.description && (
                                                    <div className="text-sm text-slate-500 line-clamp-1">
                                                        {doc.description}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge className={getStatusColor(doc.published ? 'published' : 'draft')}>
                                                {doc.published ? 'PUBLIÉ' : 'BROUILLON'}
                                            </Badge>
                                            <Button variant="outline" size="sm">
                                                <Eye className="w-4 h-4" />
                                            </Button>
                                            <Button variant="outline" size="sm">
                                                <Download className="w-4 h-4" />
                                            </Button>
                                            <Button variant="outline" size="sm">
                                                <Share2 className="w-4 h-4" />
                                            </Button>
                                            <Button variant="outline" size="sm">
                                                <Edit className="w-4 h-4" />
                                            </Button>
                                            <SuspendAction
                                                action={() => handleTogglePublish(doc.id, doc.published)}
                                                title={doc.published ? "Mettre en brouillon" : "Publier le document"}
                                                description={doc.published 
                                                    ? "Cela rendra le document invisible pour le public."
                                                    : "Cela rendra le document visible pour le public."
                                                }
                                                confirmText={doc.published ? "Mettre en brouillon" : "Publier"}
                                                successMessage={doc.published ? "Document mis en brouillon" : "Document publié"}
                                                errorMessage="Erreur lors du changement de statut"
                                                icon={doc.published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                className="p-2 h-8 w-8"
                                            />
                                            <CriticalAction
                                                action={() => handleDelete(doc.id)}
                                                title="⚠️ Supprimer le document"
                                                description="Cette action est irréversible. Le document sera définitivement supprimé et ne pourra pas être récupéré."
                                                confirmText="Supprimer définitivement"
                                                errorMessage="Erreur lors de la suppression du document"
                                                icon={<Trash2 className="w-4 h-4" />}
                                                className="p-2 h-8 w-8"
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}
