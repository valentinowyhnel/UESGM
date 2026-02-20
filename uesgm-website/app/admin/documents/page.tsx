"use client"

import { useState, useEffect, useCallback } from "react"
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
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from "@/components/ui/select"
import { 
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { 
    FileText, Download, Eye, EyeOff, Search, Upload, Trash2, 
    File, FileImage, FileVideo, FileAudio, RefreshCw, 
    FolderOpen, Loader2, Settings, Lock, Unlock, Check, X
} from "lucide-react"
import { toast } from "sonner"
import { Switch } from "@/components/ui/switch"

interface Document {
    id: string
    title: string
    description: string | null
    category: string
    visibility: string
    canDownload: boolean
    fileUrl: string
    fileName: string
    fileSize: number
    mimeType: string
    isPublished: boolean
    downloads: number
    createdAt: string
    updatedAt: string
    tags: { id: string; name: string }[]
}

const categories = [
    { value: "ADMINISTRATIF", label: "Administratif" },
    { value: "RAPPORT", label: "Rapport" },
    { value: "PRESENTATION", label: "Présentation" },
    { value: "FORMULAIRE", label: "Formulaire" },
    { value: "GUIDE", label: "Guide" },
    { value: "LOI", label: "Loi/Règlement" },
    { value: "ARTICLE", label: "Article" },
    { value: "STATUTS", label: "Statuts" },
]

const visibilityOptions = [
    { value: "PUBLIC", label: "Public - Visible par tous" },
    { value: "MEMBERS_ONLY", label: "Membres uniquement" },
    { value: "ADMIN_ONLY", label: "Administrateurs seulement" },
]

export default function AdminDocuments() {
    const [documents, setDocuments] = useState<Document[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [selectedCategory, setSelectedCategory] = useState("all")
    const [selectedVisibility, setSelectedVisibility] = useState("all")
    const [uploading, setUploading] = useState(false)
    
    // Modal states
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [isPermissionModalOpen, setIsPermissionModalOpen] = useState(false)
    const [selectedDoc, setSelectedDoc] = useState<Document | null>(null)
    
    // Form states
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        category: "ADMINISTRATIF",
        visibility: "PUBLIC",
        canDownload: true,
        fileUrl: "",
        isPublished: false,
    })

    const loadDocuments = useCallback(async () => {
        try {
            setLoading(true)
            const params = new URLSearchParams()
            if (searchTerm) params.set("search", searchTerm)
            if (selectedCategory !== "all") params.set("category", selectedCategory)
            if (selectedVisibility !== "all") params.set("visibility", selectedVisibility)
            
            const response = await fetch(`/api/admin/documents?${params}`)
            if (!response.ok) throw new Error('Erreur lors du chargement')
            const data = await response.json()
            setDocuments(data.data || [])
        } catch (error: any) {
            toast.error("Erreur", { description: error.message })
        } finally {
            setLoading(false)
        }
    }, [searchTerm, selectedCategory, selectedVisibility])

    useEffect(() => {
        loadDocuments()
    }, [loadDocuments])

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return

        if (file.size > 10 * 1024 * 1024) {
            toast.error("Fichier trop volumineux (max 10MB)")
            return
        }

        setUploading(true)
        try {
            // First upload the file
            const uploadFormData = new FormData()
            uploadFormData.append('file', file)
            
            const response = await fetch('/api/admin/upload', {
                method: 'POST',
                body: uploadFormData
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || 'Erreur upload')
            }

            const data = await response.json()
            const fileUrl = data.url || file.name
            
            // Then create the document
            const docResponse = await fetch('/api/admin/documents', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: file.name.replace(/\.[^/.]+$/, ""),
                    description: formData.description || null,
                    category: formData.category,
                    visibility: formData.visibility,
                    canDownload: formData.canDownload,
                    fileUrl: fileUrl,
                    fileName: file.name,
                    mimeType: file.type,
                    fileSize: file.size,
                    published: formData.isPublished,
                })
            })

            if (!docResponse.ok) throw new Error('Erreur création document')
            
            toast.success("Document ajouté avec succès")
            setIsAddModalOpen(false)
            resetForm()
            loadDocuments()
        } catch (error: any) {
            toast.error("Erreur", { description: error.message })
        } finally {
            setUploading(false)
            event.target.value = ''
        }
    }

    const handleDelete = async (documentId: string) => {
        if (!confirm("Êtes-vous sûr de vouloir supprimer ce document ?")) return
        
        try {
            const response = await fetch(`/api/admin/documents/${documentId}`, {
                method: 'DELETE'
            })
            if (!response.ok) throw new Error('Erreur suppression')
            toast.success("Document supprimé")
            loadDocuments()
        } catch (error: any) {
            toast.error("Erreur", { description: error.message })
        }
    }

    const handleTogglePublish = async (doc: Document) => {
        try {
            const response = await fetch(`/api/admin/documents/${doc.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ published: !doc.isPublished })
            })
            if (!response.ok) throw new Error('Erreur modification')
            toast.success(doc.isPublished ? 'Document caché' : 'Document publié')
            loadDocuments()
        } catch (error: any) {
            toast.error("Erreur", { description: error.message })
        }
    }

    const handleUpdatePermissions = async () => {
        if (!selectedDoc) return
        
        try {
            const response = await fetch(`/api/admin/documents/${selectedDoc.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    visibility: formData.visibility,
                    canDownload: formData.canDownload,
                })
            })
            if (!response.ok) throw new Error('Erreur modification')
            toast.success("Permissions mises à jour")
            setIsPermissionModalOpen(false)
            loadDocuments()
        } catch (error: any) {
            toast.error("Erreur", { description: error.message })
        }
    }

    const handleSaveDocument = async () => {
        try {
            const response = await fetch('/api/admin/documents', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    fileUrl: formData.fileUrl || 'placeholder.pdf',
                    fileName: formData.title + '.pdf',
                    mimeType: 'application/pdf',
                    fileSize: 0,
                })
            })
            if (!response.ok) throw new Error('Erreur création')
            toast.success("Document créé")
            setIsAddModalOpen(false)
            resetForm()
            loadDocuments()
        } catch (error: any) {
            toast.error("Erreur", { description: error.message })
        }
    }

    const openEditModal = (doc: Document) => {
        setSelectedDoc(doc)
        setFormData({
            title: doc.title,
            description: doc.description || "",
            category: doc.category,
            visibility: doc.visibility,
            canDownload: doc.canDownload,
            fileUrl: doc.fileUrl,
            isPublished: doc.isPublished,
        })
        setIsEditModalOpen(true)
    }

    const openPermissionModal = (doc: Document) => {
        setSelectedDoc(doc)
        setFormData({
            title: doc.title,
            description: doc.description || "",
            category: doc.category,
            visibility: doc.visibility,
            canDownload: doc.canDownload,
            fileUrl: doc.fileUrl,
            isPublished: doc.isPublished,
        })
        setIsPermissionModalOpen(true)
    }

    const handleUpdateDocument = async () => {
        if (!selectedDoc) return
        
        try {
            const response = await fetch(`/api/admin/documents/${selectedDoc.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: formData.title,
                    description: formData.description || null,
                    category: formData.category,
                    published: formData.isPublished,
                })
            })
            if (!response.ok) throw new Error('Erreur modification')
            toast.success("Document mis à jour")
            setIsEditModalOpen(false)
            loadDocuments()
        } catch (error: any) {
            toast.error("Erreur", { description: error.message })
        }
    }

    const resetForm = () => {
        setFormData({
            title: "",
            description: "",
            category: "ADMINISTRATIF",
            visibility: "PUBLIC",
            canDownload: true,
            fileUrl: "",
            isPublished: false,
        })
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
            default: return <File className="w-5 h-5 text-gray-500" />
        }
    }

    const getVisibilityBadge = (visibility: string) => {
        switch (visibility) {
            case 'PUBLIC': 
                return <Badge className="bg-green-100 text-green-800"><Unlock className="w-3 h-3 mr-1"/> Public</Badge>
            case 'MEMBERS_ONLY': 
                return <Badge className="bg-blue-100 text-blue-800"><Lock className="w-3 h-3 mr-1"/> Membres</Badge>
            case 'ADMIN_ONLY': 
                return <Badge className="bg-purple-100 text-purple-800"><Lock className="w-3 h-3 mr-1"/> Admin</Badge>
            default: 
                return <Badge>{visibility}</Badge>
        }
    }

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 B'
        const k = 1024
        const sizes = ['B', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
    }

    const filteredDocuments = documents.filter(doc => 
        doc.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
        (selectedCategory === 'all' || doc.category === selectedCategory) &&
        (selectedVisibility === 'all' || doc.visibility === selectedVisibility)
    )

    const stats = {
        total: documents.length,
        published: documents.filter(d => d.isPublished).length,
        draft: documents.filter(d => !d.isPublished).length,
        public: documents.filter(d => d.visibility === 'PUBLIC').length,
        membersOnly: documents.filter(d => d.visibility === 'MEMBERS_ONLY').length,
        adminOnly: documents.filter(d => d.visibility === 'ADMIN_ONLY').length,
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center flex-wrap gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">
                        Bibliothèque
                    </h1>
                    <p className="text-slate-500 mt-1">
                        Gérez les documents et leurs permissions
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={loadDocuments} disabled={loading}>
                        <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        Actualiser
                    </Button>
                    <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Upload className="w-4 h-4 mr-2" />
                                Ajouter un document
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                            <DialogHeader>
                                <DialogTitle>Ajouter un document</DialogTitle>
                                <DialogDescription>
                                    Ajoutez un nouveau document à la bibliothèque
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="title">Titre du document</Label>
                                    <Input 
                                        id="title" 
                                        value={formData.title}
                                        onChange={(e) => setFormData({...formData, title: e.target.value})}
                                        placeholder="Mon document"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="description">Description</Label>
                                    <Textarea 
                                        id="description"
                                        value={formData.description}
                                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                                        placeholder="Description du document..."
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Catégorie</Label>
                                        <Select 
                                            value={formData.category}
                                            onValueChange={(v) => setFormData({...formData, category: v})}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {categories.map(cat => (
                                                    <SelectItem key={cat.value} value={cat.value}>
                                                        {cat.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Visibilité</Label>
                                        <Select 
                                            value={formData.visibility}
                                            onValueChange={(v) => setFormData({...formData, visibility: v})}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {visibilityOptions.map(opt => (
                                                    <SelectItem key={opt.value} value={opt.value}>
                                                        {opt.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                    <div className="flex items-center gap-2">
                                        <Download className="w-4 h-4" />
                                        <Label className="cursor-pointer">Autoriser le téléchargement</Label>
                                    </div>
                                    <Switch 
                                        checked={formData.canDownload}
                                        onCheckedChange={(v) => setFormData({...formData, canDownload: v})}
                                    />
                                </div>
                                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                    <div className="flex items-center gap-2">
                                        <Eye className="w-4 h-4" />
                                        <Label className="cursor-pointer">Publier immédiatement</Label>
                                    </div>
                                    <Switch 
                                        checked={formData.isPublished}
                                        onCheckedChange={(v) => setFormData({...formData, isPublished: v})}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Fichier</Label>
                                    <Input 
                                        type="file"
                                        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                                        onChange={handleFileUpload}
                                        disabled={uploading}
                                    />
                                    {uploading && (
                                        <div className="flex items-center gap-2 text-sm text-slate-500">
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Upload en cours...
                                        </div>
                                    )}
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>
                                    Annuler
                                </Button>
                                <Button onClick={handleSaveDocument} disabled={!formData.title}>
                                    Enregistrer
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <Card>
                    <CardContent className="p-4">
                        <div className="text-center">
                            <p className="text-sm text-slate-500">Total</p>
                            <p className="text-2xl font-bold">{stats.total}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="text-center">
                            <p className="text-sm text-slate-500">Publiés</p>
                            <p className="text-2xl font-bold text-green-600">{stats.published}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="text-center">
                            <p className="text-sm text-slate-500">Brouillons</p>
                            <p className="text-2xl font-bold text-yellow-600">{stats.draft}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="text-center">
                            <p className="text-sm text-slate-500">Publics</p>
                            <p className="text-2xl font-bold text-blue-600">{stats.public}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="text-center">
                            <p className="text-sm text-slate-500">Membres</p>
                            <p className="text-2xl font-bold text-purple-600">{stats.membersOnly}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="text-center">
                            <p className="text-sm text-slate-500">Admin</p>
                            <p className="text-2xl font-bold text-orange-600">{stats.adminOnly}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1">
                            <div className="relative">
                                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                <Input
                                    placeholder="Rechercher..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>
                        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Catégorie" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Toutes catégories</SelectItem>
                                {categories.map(cat => (
                                    <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select value={selectedVisibility} onValueChange={setSelectedVisibility}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Visibilité" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Toutes visibilités</SelectItem>
                                {visibilityOptions.map(opt => (
                                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Documents Table */}
            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Document</TableHead>
                                <TableHead>Catégorie</TableHead>
                                <TableHead>Visibilité</TableHead>
                                <TableHead>Télécharg.</TableHead>
                                <TableHead>Statut</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8">
                                        <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                                    </TableCell>
                                </TableRow>
                            ) : filteredDocuments.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                                        Aucun document trouvé
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredDocuments.map((doc) => (
                                    <TableRow key={doc.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                {getFileIcon(doc.mimeType)}
                                                <div>
                                                    <p className="font-medium">{doc.title}</p>
                                                    <p className="text-xs text-slate-500">
                                                        {doc.fileName} • {formatFileSize(doc.fileSize)}
                                                    </p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline">
                                                {categories.find(c => c.value === doc.category)?.label || doc.category}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{getVisibilityBadge(doc.visibility)}</TableCell>
                                        <TableCell>
                                            {doc.canDownload ? (
                                                <span className="text-green-600 flex items-center gap-1">
                                                    <Check className="w-4 h-4" /> Oui
                                                </span>
                                            ) : (
                                                <span className="text-red-600 flex items-center gap-1">
                                                    <X className="w-4 h-4" /> Non
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {doc.isPublished ? (
                                                <Badge className="bg-green-100 text-green-800">Publié</Badge>
                                            ) : (
                                                <Badge className="bg-yellow-100 text-yellow-800">Brouillon</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex gap-1">
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm"
                                                    onClick={() => handleTogglePublish(doc)}
                                                    title={doc.isPublished ? "Masquer" : "Publier"}
                                                >
                                                    {doc.isPublished ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                </Button>
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm"
                                                    onClick={() => openPermissionModal(doc)}
                                                    title="Permissions"
                                                >
                                                    <Settings className="w-4 h-4" />
                                                </Button>
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm"
                                                    onClick={() => openEditModal(doc)}
                                                    title="Modifier"
                                                >
                                                    <FileText className="w-4 h-4" />
                                                </Button>
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm"
                                                    onClick={() => handleDelete(doc.id)}
                                                    title="Supprimer"
                                                    className="text-red-500 hover:text-red-600"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Permission Modal */}
            <Dialog open={isPermissionModalOpen} onOpenChange={setIsPermissionModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Gérer les permissions</DialogTitle>
                        <DialogDescription>
                            Configurez qui peut voir et télécharger ce document
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="p-3 bg-slate-50 rounded-lg">
                            <p className="font-medium">{selectedDoc?.title}</p>
                        </div>
                        <div className="space-y-2">
                            <Label>Visibilité</Label>
                            <Select 
                                value={formData.visibility}
                                onValueChange={(v) => setFormData({...formData, visibility: v})}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {visibilityOptions.map(opt => (
                                        <SelectItem key={opt.value} value={opt.value}>
                                            {opt.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center gap-2">
                                <Download className="w-4 h-4" />
                                <div>
                                    <p className="font-medium">Téléchargement</p>
                                    <p className="text-xs text-slate-500">Autoriser les utilisateurs à télécharger</p>
                                </div>
                            </div>
                            <Switch 
                                checked={formData.canDownload}
                                onCheckedChange={(v) => setFormData({...formData, canDownload: v})}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsPermissionModalOpen(false)}>
                            Annuler
                        </Button>
                        <Button onClick={handleUpdatePermissions}>
                            Enregistrer les permissions
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Modal */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Modifier le document</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-title">Titre</Label>
                            <Input 
                                id="edit-title" 
                                value={formData.title}
                                onChange={(e) => setFormData({...formData, title: e.target.value})}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-description">Description</Label>
                            <Textarea 
                                id="edit-description"
                                value={formData.description}
                                onChange={(e) => setFormData({...formData, description: e.target.value})}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Catégorie</Label>
                                <Select 
                                    value={formData.category}
                                    onValueChange={(v) => setFormData({...formData, category: v})}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categories.map(cat => (
                                            <SelectItem key={cat.value} value={cat.value}>
                                                {cat.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-center justify-end pb-2">
                                <div className="flex items-center gap-2">
                                    <Label htmlFor="edit-published" className="cursor-pointer">Publié</Label>
                                    <Switch 
                                        id="edit-published"
                                        checked={formData.isPublished}
                                        onCheckedChange={(v) => setFormData({...formData, isPublished: v})}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
                            Annuler
                        </Button>
                        <Button onClick={handleUpdateDocument}>
                            Enregistrer
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
