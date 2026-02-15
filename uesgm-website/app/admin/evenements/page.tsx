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
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
    Plus, Calendar, Search, Filter, Edit, Trash2, Eye, Loader2,
    Clock, MapPin, Users, Image
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { CriticalAction } from "@/components/admin/SecureAction"

interface Event {
    id: string
    title: string
    slug: string
    description: string
    location: string
    imageUrl?: string | null
    category: 'INTEGRATION' | 'ACADEMIC' | 'SOCIAL' | 'CULTURAL'
    status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
    startDate: string
    endDate?: string | null
    maxAttendees?: number | null
    createdAt: string
    updatedAt: string
    createdById: string
    createdBy: {
        id: string
        name: string
        email: string
    }
    _count?: {
        attendees: number
    }
}

interface EventsResponse {
    data: Event[]
    pagination: {
        page: number
        totalPages: number
        totalItems: number
        hasNext: boolean
        hasPrev: boolean
    }
}

const statusConfig = {
    DRAFT: { label: "Brouillon", variant: "secondary" as const, color: "bg-orange-100 text-orange-800" },
    PUBLISHED: { label: "Publié", variant: "default" as const, color: "bg-green-100 text-green-800" },
    ARCHIVED: { label: "Archivé", variant: "outline" as const, color: "bg-gray-100 text-gray-800" }
}

const categoryConfig = {
    INTEGRATION: { label: "Intégration", color: "bg-blue-100 text-blue-800" },
    ACADEMIC: { label: "Académique", color: "bg-purple-100 text-purple-800" },
    SOCIAL: { label: "Social", color: "bg-pink-100 text-pink-800" },
    CULTURAL: { label: "Culturel", color: "bg-indigo-100 text-indigo-800" }
}

export default function AdminEventsPage() {
    const [events, setEvents] = useState<Event[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [selectedStatus, setSelectedStatus] = useState("all")
    const [selectedCategory, setSelectedCategory] = useState("all")
    const [currentPage, setCurrentPage] = useState(1)
    const [pagination, setPagination] = useState({
        page: 1,
        totalPages: 1,
        totalItems: 0,
        hasNext: false,
        hasPrev: false
    })

    useEffect(() => {
        loadEvents()
    }, [searchTerm, selectedStatus, selectedCategory, currentPage])

    const loadEvents = async () => {
        try {
            setLoading(true)
            const params = new URLSearchParams({
                page: currentPage.toString(),
                ...(searchTerm && { search: searchTerm }),
                ...(selectedStatus !== "all" && { status: selectedStatus }),
                ...(selectedCategory !== "all" && { category: selectedCategory })
            })

            const response = await fetch(`/api/admin/events?${params}`)
            if (!response.ok) {
                throw new Error('Erreur lors du chargement des événements')
            }
            const data: EventsResponse = await response.json()
            setEvents(data.data)
            setPagination(data.pagination)
        } catch (error: any) {
            toast.error('Erreur', {
                description: error.message || 'Impossible de charger les événements'
            })
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (eventId: string) => {
        try {
            const response = await fetch(`/api/admin/events/${eventId}`, {
                method: 'DELETE'
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || 'Erreur lors de la suppression')
            }

            toast.success('Événement supprimé avec succès')
            loadEvents()
        } catch (error: any) {
            throw error
        }
    }

    const handleStatusChange = async (eventId: string, newStatus: string) => {
        try {
            const response = await fetch(`/api/admin/events/${eventId}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || 'Erreur lors du changement de statut')
            }

            const data = await response.json()
            toast.success(data.message)
            loadEvents()
        } catch (error: any) {
            toast.error('Erreur', {
                description: error.message || 'Impossible de changer le statut'
            })
        }
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
                    <p className="text-gray-600">Chargement des événements...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="container mx-auto px-4 py-8">
            {/* En-tête */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold font-montserrat text-primary-dark flex items-center gap-2">
                        <Calendar className="w-8 h-8 text-gold" />
                        Gestion des Événements
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        Gérez tous les événements de l'UESGM
                    </p>
                </div>
                <Button className="bg-gold hover:bg-gold-dark text-slate-950 font-bold px-6" asChild>
                    <Link href="/admin/evenements/nouveau">
                        <Plus className="w-5 h-5 mr-2" />
                        Nouvel Événement
                    </Link>
                </Button>
            </div>

            {/* Filtres */}
            <Card className="mb-6">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Filter className="w-5 h-5" />
                        Filtres et Recherche
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <Input
                                    placeholder="Rechercher un événement..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>
                        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                            <SelectTrigger className="w-full md:w-48">
                                <SelectValue placeholder="Statut" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tous les statuts</SelectItem>
                                <SelectItem value="DRAFT">Brouillon</SelectItem>
                                <SelectItem value="PUBLISHED">Publié</SelectItem>
                                <SelectItem value="ARCHIVED">Archivé</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                            <SelectTrigger className="w-full md:w-48">
                                <SelectValue placeholder="Catégorie" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Toutes les catégories</SelectItem>
                                <SelectItem value="INTEGRATION">Intégration</SelectItem>
                                <SelectItem value="ACADEMIC">Académique</SelectItem>
                                <SelectItem value="SOCIAL">Social</SelectItem>
                                <SelectItem value="CULTURAL">Culturel</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Tableau des événements */}
            <Card>
                <CardHeader>
                    <CardTitle>
                        Événements ({pagination.totalItems})
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Image</TableHead>
                                    <TableHead>Titre</TableHead>
                                    <TableHead>Catégorie</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Lieu</TableHead>
                                    <TableHead>Inscriptions</TableHead>
                                    <TableHead>Statut</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {events.map((event) => (
                                    <TableRow key={event.id}>
                                        <TableCell>
                                            {event.imageUrl ? (
                                                <img 
                                                    src={event.imageUrl} 
                                                    alt={event.title}
                                                    className="w-12 h-12 rounded-lg object-cover"
                                                />
                                            ) : (
                                                <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
                                                    <Image className="w-6 h-6 text-gray-400" />
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div>
                                                <div className="font-medium">{event.title}</div>
                                                <div className="text-sm text-gray-500 line-clamp-1">
                                                    {event.description}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={categoryConfig[event.category].color}>
                                                {categoryConfig[event.category].label}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1 text-sm">
                                                <Clock className="w-4 h-4 text-gray-400" />
                                                {formatDate(event.startDate)}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1 text-sm">
                                                <MapPin className="w-4 h-4 text-gray-400" />
                                                {event.location}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1 text-sm">
                                                <Users className="w-4 h-4 text-gray-400" />
                                                {event._count?.attendees || 0}
                                                {event.maxAttendees && `/${event.maxAttendees}`}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={statusConfig[event.status].color}>
                                                {statusConfig[event.status].label}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Button variant="outline" size="sm" asChild>
                                                    <Link href={`/admin/evenements/${event.id}`}>
                                                        <Eye className="w-4 h-4" />
                                                    </Link>
                                                </Button>
                                                <Button variant="outline" size="sm" asChild>
                                                    <Link href={`/admin/evenements/${event.id}/edit`}>
                                                        <Edit className="w-4 h-4" />
                                                    </Link>
                                                </Button>
                                                
                                                {/* Actions rapides de statut */}
                                                {event.status === 'DRAFT' && (
                                                    <Button 
                                                        variant="outline" 
                                                        size="sm"
                                                        onClick={() => handleStatusChange(event.id, 'PUBLISHED')}
                                                    >
                                                        Publier
                                                    </Button>
                                                )}
                                                {event.status === 'PUBLISHED' && (
                                                    <Button 
                                                        variant="outline" 
                                                        size="sm"
                                                        onClick={() => handleStatusChange(event.id, 'ARCHIVED')}
                                                    >
                                                        Archiver
                                                    </Button>
                                                )}
                                                
                                                {/* Suppression */}
                                                <CriticalAction
                                                    action={async () => handleDelete(event.id)}
                                                    title="Supprimer l'événement"
                                                    description="Êtes-vous sûr de vouloir supprimer cet événement ? Cette action est irréversible."
                                                    confirmText="Supprimer"
                                                    cancelText="Annuler"
                                                    successMessage="Événement supprimé avec succès"
                                                    errorMessage="Erreur lors de la suppression"
                                                >
                                                    <Button variant="outline" size="sm">
                                                        <Trash2 className="w-4 h-4" />
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
                    {pagination.totalPages > 1 && (
                        <div className="flex items-center justify-between mt-4">
                            <div className="text-sm text-gray-600">
                                Page {pagination.page} sur {pagination.totalPages} ({pagination.totalItems} événements)
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={!pagination.hasPrev}
                                    onClick={() => setCurrentPage(currentPage - 1)}
                                >
                                    Précédent
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={!pagination.hasNext}
                                    onClick={() => setCurrentPage(currentPage + 1)}
                                >
                                    Suivant
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
