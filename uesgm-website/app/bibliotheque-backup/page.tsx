"use client"

import { useState, useEffect } from "react"
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
    FileText, Download, Search, Filter, File, Calendar, Eye, 
    Grid, List, Loader2
} from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

interface Document {
    id: string
    title: string
    slug: string
    description?: string | null
    category: "STATUTS" | "RAPPORT" | "GUIDE" | "LIVRE" | "ARTICLE" | "ACADEMIQUE" | "JURIDIQUE" | "ADMINISTRATIF"
    fileName: string
    fileSize: number
    mimeType: string
    downloads: number
    createdAt: string
    tags: { name: string }[]
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
    RAPPORT: { label: "Rapports", color: "bg-green-100 text-green-800" },
    GUIDE: { label: "Guides", color: "bg-purple-100 text-purple-800" },
    LIVRE: { label: "Livres", color: "bg-yellow-100 text-yellow-800" },
    ARTICLE: { label: "Articles", color: "bg-pink-100 text-pink-800" },
    ACADEMIQUE: { label: "Académique", color: "bg-orange-100 text-orange-800" },
    JURIDIQUE: { label: "Juridique", color: "bg-red-100 text-red-800" },
    ADMINISTRATIF: { label: "Administratif", color: "bg-gray-100 text-gray-800" },
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
    if (mimeType.includes('pdf')) return <FileText className="w-5 h-5 text-red-500" />
    if (mimeType.includes('word') || mimeType.includes('document')) return <FileText className="w-5 h-5 text-blue-500" />
    if (mimeType.includes('excel') || mimeType.includes('sheet')) return <FileText className="w-5 h-5 text-green-500" />
    if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return <FileText className="w-5 h-5 text-orange-500" />
    if (mimeType.includes('image')) return <FileText className="w-5 h-5 text-purple-500" />
    return <File className="w-5 h-5 text-gray-500" />
}

// Fonction pour formater la date
function formatDate(dateString: string): string {
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    })
}

export default function BibliothequePage() {
    const [documents, setDocuments] = useState<Document[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState("")
    const [categoryFilter, setCategoryFilter] = useState("all")
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [totalItems, setTotalItems] = useState(0)
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

    // Charger les documents
    const loadDocuments = async () => {
        try {
            setLoading(true)
            const params = new URLSearchParams({
                page: currentPage.toString(),
                limit: "12",
                ...(search && { search }),
                ...(categoryFilter !== "all" && { category: categoryFilter }),
            })

            const response = await fetch(`/api/documents/list?${params}`)
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

    // Télécharger un document
    const handleDownload = async (slug: string, title: string) => {
        try {
            // Ouvrir le lien de téléchargement dans un nouvel onglet
            window.open(`/api/documents/${slug}/download`, '_blank')
            toast.success(`Téléchargement de "${title}" démarré`)
        } catch (error) {
            console.error('Erreur:', error)
            toast.error('Erreur lors du téléchargement')
        }
    }

    useEffect(() => {
        loadDocuments()
    }, [currentPage, search, categoryFilter])

    return (
        <div className="container mx-auto px-4 py-8">
            {/* En-tête */}
            <div className="text-center mb-12">
                <h1 className="text-4xl font-bold font-montserrat text-primary-dark mb-4">
                    Bibliothèque UESGM
                </h1>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                    Accédez à l'ensemble des documents officiels de l'Union des Étudiants Gabonais en Médecine
                </p>
            </div>

            {/* Statistiques */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <FileText className="w-8 h-8 text-blue-500 mr-3" />
                            <div>
                                <p className="text-sm text-gray-600">Documents disponibles</p>
                                <p className="text-2xl font-bold">{totalItems}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <Download className="w-8 h-8 text-green-500 mr-3" />
                            <div>
                                <p className="text-sm text-gray-600">Total téléchargements</p>
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
                            <Calendar className="w-8 h-8 text-purple-500 mr-3" />
                            <div>
                                <p className="text-sm text-gray-600">Dernière mise à jour</p>
                                <p className="text-2xl font-bold">
                                    {documents.length > 0 ? formatDate(documents[0].createdAt) : "N/A"}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filtres */}
            <Card className="mb-8">
                <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row gap-4">
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
                            <SelectTrigger className="w-full lg:w-64">
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
                        <div className="flex gap-2">
                            <Button
                                variant={viewMode === "grid" ? "default" : "outline"}
                                size="sm"
                                onClick={() => setViewMode("grid")}
                            >
                                <Grid className="w-4 h-4" />
                            </Button>
                            <Button
                                variant={viewMode === "list" ? "default" : "outline"}
                                size="sm"
                                onClick={() => setViewMode("list")}
                            >
                                <List className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Contenu */}
            {loading ? (
                <div className="flex items-center justify-center h-96">
                    <Loader2 className="w-8 h-8 animate-spin mr-3" />
                    <span>Chargement...</span>
                </div>
            ) : documents.length === 0 ? (
                <div className="text-center py-12">
                    <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun document trouvé</h3>
                    <p className="text-gray-500 mb-4">
                        Essayez de modifier vos filtres de recherche
                    </p>
                </div>
            ) : (
                <>
                    {viewMode === "grid" ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                            {documents.map((document) => (
                                <Card key={document.id} className="hover:shadow-lg transition-shadow">
                                    <CardContent className="p-6">
                                        <div className="flex items-start justify-between mb-4">
                                            {getFileIcon(document.mimeType)}
                                            <Badge className={categoryConfig[document.category].color}>
                                                {categoryConfig[document.category].label}
                                            </Badge>
                                        </div>
                                        
                                        <h3 className="font-semibold text-lg mb-2 line-clamp-2">
                                            {document.title}
                                        </h3>
                                        
                                        {document.description && (
                                            <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                                                {document.description}
                                            </p>
                                        )}
                                        
                                        {document.tags.length > 0 && (
                                            <div className="flex flex-wrap gap-1 mb-4">
                                                {document.tags.slice(0, 3).map((tag, index) => (
                                                    <Badge key={index} variant="outline" className="text-xs">
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
                                        
                                        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                                            <span>{formatFileSize(document.fileSize)}</span>
                                            <div className="flex items-center">
                                                <Download className="w-4 h-4 mr-1" />
                                                <span>{document.downloads}</span>
                                            </div>
                                        </div>
                                        
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="flex-1"
                                                onClick={() => handleDownload(document.slug, document.title)}
                                            >
                                                <Download className="w-4 h-4 mr-2" />
                                                Télécharger
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <Card>
                            <CardContent className="p-6">
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Document</TableHead>
                                                <TableHead>Catégorie</TableHead>
                                                <TableHead>Taille</TableHead>
                                                <TableHead>Téléchargements</TableHead>
                                                <TableHead>Date</TableHead>
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
                                                                {document.tags.length > 0 && (
                                                                    <div className="flex flex-wrap gap-1 mt-1">
                                                                        {document.tags.slice(0, 2).map((tag, index) => (
                                                                            <Badge key={index} variant="outline" className="text-xs">
                                                                                {tag.name}
                                                                            </Badge>
                                                                        ))}
                                                                        {document.tags.length > 2 && (
                                                                            <Badge variant="outline" className="text-xs">
                                                                                +{document.tags.length - 2}
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
                                                        <span className="text-sm">{formatFileSize(document.fileSize)}</span>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center">
                                                            <Download className="w-4 h-4 mr-1 text-gray-400" />
                                                            <span className="text-sm">{document.downloads}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <span className="text-sm">{formatDate(document.createdAt)}</span>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleDownload(document.slug, document.title)}
                                                        >
                                                            <Download className="w-4 h-4" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-center space-x-2">
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
                    )}
                </>
            )}
        </div>
    )
}
