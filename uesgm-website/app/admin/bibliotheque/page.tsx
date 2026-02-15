"use client"

import React, { useState, useEffect } from "react"
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
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
    Plus, FileText, Settings, Download, Edit, Trash2, Loader2, Eye, EyeOff, 
    Search, Filter, Upload, File, Archive, Users, Lock, Globe, MoreHorizontal
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { CriticalAction } from "@/components/admin/SecureAction"

interface Document {
    id: string
    title: string
    slug: string
    description?: string | null
    fileUrl: string
    fileName: string
    fileSize: number
    mimeType: string
    category: "STATUTS" | "RAPPORTS" | "GUIDES" | "ACADEMIQUE" | "JURIDIQUE" | "ADMINISTRATIF"
    visibility: "PUBLIC" | "MEMBERS_ONLY" | "ADMIN_ONLY"
    version: number
    downloads: number
    isPublished: boolean
    createdAt: string
    updatedAt: string
    createdById: string
    tags: DocumentTag[]
    versions: DocumentVersion[]
}

interface DocumentTag {
    id: string
    name: string
    documentId: string
}

interface DocumentVersion {
    id: string
    fileUrl: string
    version: number
    createdAt: string
    documentId: string
}

interface DocumentsResponse {
    data: Document[]
    pagination: {
        total: number
        page: number
        limit: number
        pages: number
    }
}

// Configuration des catégories
const categoryConfig = {
    STATUTS: { label: "Statuts", color: "bg-blue-100 text-blue-800" },
    RAPPORTS: { label: "Rapports", color: "bg-green-100 text-green-800" },
    GUIDES: { label: "Guides", color: "bg-purple-100 text-purple-800" },
    ACADEMIQUE: { label: "Académique", color: "bg-orange-100 text-orange-800" },
    JURIDIQUE: { label: "Juridique", color: "bg-red-100 text-red-800" },
    ADMINISTRATIF: { label: "Administratif", color: "bg-gray-100 text-gray-800" },
}

// Configuration de la visibilité
const visibilityConfig = {
    PUBLIC: { 
        label: "Public", 
        color: "bg-green-100 text-green-800", 
        icon: Globe 
    },
    MEMBERS_ONLY: { 
        label: "Membres uniquement", 
        color: "bg-blue-100 text-blue-800", 
        icon: Users 
    },
    ADMIN_ONLY: { 
        label: "Admin uniquement", 
        color: "bg-red-100 text-red-800", 
        icon: Lock 
    },
}

// Fonction pour formater la taille du fichier
function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Fonction pour obtenir l'icône du type de fichier
function getFileIcon(mimeType: string) {
    if (mimeType.includes('pdf')) return <FileText className="w-4 h-4 text-red-500" />
    if (mimeType.includes('word') || mimeType.includes('document')) return <FileText className="w-4 h-4 text-blue-500" />
    if (mimeType.includes('excel') || mimeType.includes('sheet')) return <FileText className="w-4 h-4 text-green-500" />
    if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return <FileText className="w-4 h-4 text-orange-500" />
    if (mimeType.includes('image')) return <FileText className="w-4 h-4 text-purple-500" />
    return <File className="w-4 h-4 text-gray-500" />
}

export default function BibliothequePage() {
    const [documents, setDocuments] = useState<Document[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState("")
    const [categoryFilter, setCategoryFilter] = useState("all")
    const [visibilityFilter, setVisibilityFilter] = useState("all")
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [totalItems, setTotalItems] = useState(0)
    const [actionLoading, setActionLoading] = useState<string | null>(null)

    // Charger les documents
    const loadDocuments = async () => {
        try {
            setLoading(true)
            const params = new URLSearchParams({
                page: currentPage.toString(),
                limit: "10",
                ...(search && { search }),
                ...(categoryFilter !== "all" && { category: categoryFilter }),
                ...(visibilityFilter !== "all" && { status: visibilityFilter }),
            })

            const response = await fetch("/api/admin/documents?" + params.toString())
            if (!response.ok) throw new Error('Erreur lors du chargement')

            const data: DocumentsResponse = await response.json()
            setDocuments(data.data)
            setTotalPages(data.pagination.pages)
            setTotalItems(data.pagination.total)
        } catch (error) {
            console.error('Erreur:', error)
            toast.error('Erreur lors du chargement des documents')
        } finally {
            setLoading(false)
        }
    }

    // Supprimer un document
    const handleDelete = async (id: string) => {
        try {
            setActionLoading(id)
            const response = await fetch(`/api/admin/documents/${id}`, {
                method: 'DELETE',
            })

            if (!response.ok) throw new Error('Erreur lors de la suppression')

            toast.success('Document supprimé avec succès')
            await loadDocuments()
        } catch (error) {
            console.error('Erreur:', error)
            toast.error('Erreur lors de la suppression')
        } finally {
            setActionLoading(null)
        }
    }

    // Publier/Dépublier un document
    const togglePublish = async (id: string, currentStatus: boolean) => {
        try {
            setActionLoading(id)
            const response = await fetch(`/api/admin/documents/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ published: !currentStatus }),
            })

            if (!response.ok) throw new Error('Erreur lors du changement de statut')

            toast.success(currentStatus ? 'Document dépublié' : 'Document publié')
            await loadDocuments()
        } catch (error) {
            console.error('Erreur:', error)
            toast.error('Erreur lors du changement de statut')
        } finally {
            setActionLoading(null)
        }
    }

    // Télécharger un document
    const handleDownload = async (fileUrl: string, fileName: string) => {
        try {
            const link = document.createElement('a')
            link.href = fileUrl
            link.download = fileName
            link.click()
        } catch (error) {
            console.error('Erreur:', error)
            toast.error('Erreur lors du téléchargement')
        }
    }

    useEffect(() => {
        loadDocuments()
    }, [currentPage, search, categoryFilter, visibilityFilter])

    return (
        <div className="container mx-auto px-4 py-8">
            {/* En-tête */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold font-montserrat text-primary-dark">Gestion Documentaire</h1>
                    <p className="text-muted-foreground mt-2">
                        Gérez tous les documents de l'UESGM
                    </p>
                </div>
                <Link href="/admin/bibliotheque/nouveau">
                    <Button className="bg-primary hover:bg-primary-dark">
                        <Plus className="w-4 h-4 mr-2" />
                        Nouveau Document
                    </Button>
                </Link>
            </div>

            {/* Statistiques */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <FileText className="w-8 h-8 text-blue-500 mr-3" />
                            <div>
                                <p className="text-sm text-gray-600">Total Documents</p>
                                <p className="text-2xl font-bold">{totalItems}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <Globe className="w-8 h-8 text-green-500 mr-3" />
                            <div>
                                <p className="text-sm text-gray-600">Publics</p>
                                <p className="text-2xl font-bold">
                                    {documents.filter(d => d.visibility === 'PUBLIC').length}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <Download className="w-8 h-8 text-purple-500 mr-3" />
                            <div>
                                <p className="text-sm text-gray-600">Téléchargements</p>
                                <p className="text-2xl font-bold">
                                    {documents.reduce((sum, d) => sum + d.downloads, 0)}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <Archive className="w-8 h-8 text-orange-500 mr-3" />
                            <div>
                                <p className="text-sm text-gray-600">Versions</p>
                                <p className="text-2xl font-bold">
                                    {documents.reduce((sum, d) => sum + d.versions.length, 0)}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filtres */}
            <Card className="mb-6">
                <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1">
                            <div className="relative">
                                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                <Input
                                    placeholder="Rechercher un document..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>
                        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                            <SelectTrigger className="w-full md:w-48">
                                <SelectValue placeholder="Catégorie" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Toutes catégories</SelectItem>
                                {Object.entries(categoryConfig).map(([key, config]) => (
                                    <SelectItem key={key} value={key}>
                                        {config.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select value={visibilityFilter} onValueChange={setVisibilityFilter}>
                            <SelectTrigger className="w-full md:w-48">
                                <SelectValue placeholder="Visibilité" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Toutes visibilités</SelectItem>
                                {Object.entries(visibilityConfig).map(([key, config]) => (
                                    <SelectItem key={key} value={key}>
                                        {config.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Tableau des documents */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center">
                        <FileText className="w-5 h-5 mr-2" />
                        Liste des Documents
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center h-96">
                            <Loader2 className="w-8 h-8 animate-spin mr-3" />
                            <span>Chargement...</span>
                        </div>
                    ) : documents.length === 0 ? (
                        <div className="text-center py-12">
                            <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun document</h3>
                            <p className="text-gray-500 mb-4">
                                Commencez par ajouter votre premier document
                            </p>
                            <Link href="/admin/bibliotheque/nouveau">
                                <Button>
                                    <Plus className="w-4 h-4 mr-2" />
                                    Nouveau Document
                                </Button>
                            </Link>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Document</TableHead>
                                            <TableHead>Catégorie</TableHead>
                                            <TableHead>Visibilité</TableHead>
                                            <TableHead>Version</TableHead>
                                            <TableHead>Téléchargements</TableHead>
                                            <TableHead>Statut</TableHead>
                                            <TableHead>Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {documents.map((document) => (
                                            <TableRow key={document.id}>
                                                <TableCell>
                                                    <div className="flex items-center space-x-3">
                                                        {getFileIcon(document.mimeType)}
                                                        <div>
                                                            <p className="font-medium">{document.title}</p>
                                                            <p className="text-sm text-gray-500">
                                                                {formatFileSize(document.fileSize)} • {document.fileName}
                                                            </p>
                                                            {document.tags.length > 0 && (
                                                                <div className="flex flex-wrap gap-1 mt-1">
                                                                    {document.tags.slice(0, 3).map((tag) => (
                                                                        <Badge key={tag.id} variant="outline" className="text-xs">
                                                                            {tag.name}
                                                                        </Badge>
                                                                    ))}
                                                                    {document.tags.length > 3 && (
                                                                        <Badge variant="outline" className="text-xs">
                                                                            +{document.tags.length - 3}
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className={categoryConfig[document.category].color}>
                                                        {categoryConfig[document.category].label}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center space-x-2">
                                                        {(() => {
                                                            const Icon = visibilityConfig[document.visibility as keyof typeof visibilityConfig].icon;
                                                            return <Icon className="w-4 h-4" />;
                                                        })()}
                                                        <Badge className={visibilityConfig[document.visibility].color}>
                                                            {visibilityConfig[document.visibility].label}
                                                        </Badge>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center space-x-1">
                                                        <span className="font-medium">v{document.version}</span>
                                                        {document.versions.length > 0 && (
                                                            <Badge variant="outline" className="text-xs">
                                                                +{document.versions.length}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center space-x-1">
                                                        <Download className="w-4 h-4 text-gray-400" />
                                                        <span className="font-medium">{document.downloads}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center space-x-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => togglePublish(document.id, document.isPublished)}
                                                            disabled={actionLoading === document.id}
                                                        >
                                                            {document.isPublished ? (
                                                                <Eye className="w-4 h-4 text-green-500" />
                                                            ) : (
                                                                <EyeOff className="w-4 h-4 text-gray-400" />
                                                            )}
                                                        </Button>
                                                        <Badge variant={document.isPublished ? "default" : "secondary"}>
                                                            {document.isPublished ? "Publié" : "Brouillon"}
                                                        </Badge>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center space-x-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleDownload(document.fileUrl, document.fileName)}
                                                        >
                                                            <Download className="w-4 h-4" />
                                                        </Button>
                                                        <Link href={`/admin/bibliotheque/${document.id}/edit`}>
                                                            <Button variant="ghost" size="sm">
                                                                <Edit className="w-4 h-4" />
                                                            </Button>
                                                        </Link>
                                                        <CriticalAction
                                                            action={() => handleDelete(document.id)}
                                                            title="Supprimer le document"
                                                            description="Êtes-vous sûr de vouloir supprimer ce document ? Cette action est irréversible."
                                                            confirmText="Supprimer"
                                                            cancelText="Annuler"
                                                            successMessage="Document supprimé avec succès"
                                                            errorMessage="Erreur lors de la suppression"
                                                        >
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                disabled={actionLoading === document.id}
                                                            >
                                                                {actionLoading === document.id ? (
                                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                                ) : (
                                                                    <Trash2 className="w-4 h-4 text-red-500" />
                                                                )}
                                                            </Button>
                                                        </CriticalAction>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="flex items-center justify-between mt-6">
                                    <div className="text-sm text-gray-600">
                                        Page {currentPage} sur {totalPages} • {totalItems} documents
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                            disabled={currentPage === 1}
                                        >
                                            Précédent
                                        </Button>
                                        <div className="flex items-center space-x-1">
                                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                                const page = i + 1
                                                return (
                                                    <Button
                                                        key={page}
                                                        variant={currentPage === page ? "default" : "outline"}
                                                        size="sm"
                                                        onClick={() => setCurrentPage(page)}
                                                    >
                                                        {page}
                                                    </Button>
                                                )
                                            })}
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                            disabled={currentPage === totalPages}
                                        >
                                            Suivant
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
