"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { 
  Plus, Edit, Trash2, Eye, Loader2, Search, Filter, 
  Calendar, MapPin, Users, Image
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { CriticalAction } from "@/components/admin/SecureAction"

interface Project {
  id: string
  title: string
  slug: string
  description: string
  shortDesc: string
  imageUrl?: string | null
  category: 'EDUCATION' | 'SOCIAL' | 'HEALTH' | 'DIGITAL' | 'PARTNERSHIP'
  status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  progress: number
  isPublished: boolean
  startDate?: string | null
  endDate?: string | null
  createdAt: string
  updatedAt: string
  createdById: string
  createdBy: {
    id: string
    name: string
    email: string
  }
  tags: ProjectTag[]
}

interface ProjectTag {
  id: string
  name: string
  projectId: string
}

interface ProjectsResponse {
  data: Project[]
  pagination: {
    page: number
    totalPages: number
    totalItems: number
    hasNext: boolean
    hasPrev: boolean
    limit: number
  }
}

const statusConfig = {
  PLANNED: { label: "Planifié", variant: "outline" as const, color: "bg-gray-100 text-gray-800" },
  IN_PROGRESS: { label: "En Cours", variant: "secondary" as const, color: "bg-blue-100 text-blue-800" },
  COMPLETED: { label: "Terminé", variant: "default" as const, color: "bg-green-100 text-green-800" },
  CANCELLED: { label: "Annulé", variant: "destructive" as const, color: "bg-red-100 text-red-800" }
}

const categoryConfig = {
  EDUCATION: { label: "Éducation", color: "bg-purple-100 text-purple-800" },
  SOCIAL: { label: "Social", color: "bg-pink-100 text-pink-800" },
  HEALTH: { label: "Santé", color: "bg-red-100 text-red-800" },
  DIGITAL: { label: "Digital", color: "bg-indigo-100 text-indigo-800" },
  PARTNERSHIP: { label: "Partenariat", color: "bg-yellow-100 text-yellow-800" }
}

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
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
    hasPrev: false,
    limit: 10
  })

  useEffect(() => {
    loadProjects()
  }, [searchTerm, selectedStatus, selectedCategory, currentPage])

  const loadProjects = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(selectedStatus !== "all" && { status: selectedStatus }),
        ...(selectedCategory !== "all" && { category: selectedCategory })
      })

      const response = await fetch(`/api/admin/projects-new?${params}`)
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des projets')
      }
      const data: ProjectsResponse = await response.json()
      setProjects(data.data)
      setPagination(data.pagination)
    } catch (error: any) {
      toast.error('Erreur', {
        description: error.message || 'Impossible de charger les projets'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (projectId: string) => {
    try {
      const response = await fetch(`/api/admin/projects-new/${projectId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erreur lors de la suppression')
      }

      toast.success('Projet supprimé avec succès')
      loadProjects()
    } catch (error: any) {
      throw error
    }
  }

  const handleStatusChange = async (projectId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/admin/projects-new/${projectId}/status`, {
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
      loadProjects()
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
      year: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Chargement des projets...</p>
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
            Gestion des Projets
          </h1>
          <p className="text-muted-foreground mt-2">
            Gérez tous les projets de l'UESGM
          </p>
        </div>
        <Button className="bg-gold hover:bg-gold-dark text-slate-950 font-bold px-6" asChild>
          <Link href="/admin/projets/nouveau">
            <Plus className="w-5 h-5 mr-2" />
            Nouveau Projet
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
                  placeholder="Rechercher un projet..."
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
                <SelectItem value="PLANNED">Planifié</SelectItem>
                <SelectItem value="IN_PROGRESS">En Cours</SelectItem>
                <SelectItem value="COMPLETED">Terminé</SelectItem>
                <SelectItem value="CANCELLED">Annulé</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les catégories</SelectItem>
                <SelectItem value="EDUCATION">Éducation</SelectItem>
                <SelectItem value="SOCIAL">Social</SelectItem>
                <SelectItem value="HEALTH">Santé</SelectItem>
                <SelectItem value="DIGITAL">Digital</SelectItem>
                <SelectItem value="PARTNERSHIP">Partenariat</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tableau des projets */}
      <Card>
        <CardHeader>
          <CardTitle>
            Projets ({pagination.totalItems})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4">Image</th>
                  <th className="text-left p-4">Titre</th>
                  <th className="text-left p-4">Catégorie</th>
                  <th className="text-left p-4">Progression</th>
                  <th className="text-left p-4">Statut</th>
                  <th className="text-left p-4">Publié</th>
                  <th className="text-left p-4">Tags</th>
                  <th className="text-left p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((project) => (
                  <tr key={project.id} className="border-b hover:bg-gray-50">
                    <td className="p-4">
                      {project.imageUrl ? (
                        <img 
                          src={project.imageUrl} 
                          alt={project.title}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
                          <Image className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      <div>
                        <div className="font-medium">{project.title}</div>
                        <div className="text-sm text-gray-500 line-clamp-1">
                          {project.shortDesc}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge className={categoryConfig[project.category].color}>
                        {categoryConfig[project.category].label}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <div className="w-32">
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span>{project.progress}%</span>
                        </div>
                        <Progress value={project.progress} className="h-2" />
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge className={statusConfig[project.status].color}>
                        {statusConfig[project.status].label}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          project.isPublished ? 'bg-green-500' : 'bg-gray-300'
                        }`} />
                        <span className="text-sm">
                          {project.isPublished ? 'Oui' : 'Non'}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-1">
                        {project.tags.slice(0, 2).map((tag) => (
                          <Badge key={tag.id} variant="outline" className="text-xs">
                            {tag.name}
                          </Badge>
                        ))}
                        {project.tags.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{project.tags.length - 2}
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/admin/projets/${project.id}`}>
                            <Eye className="w-4 h-4" />
                          </Link>
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/admin/projets/${project.id}/edit`}>
                            <Edit className="w-4 h-4" />
                          </Link>
                        </Button>
                        
                        {/* Actions rapides de statut */}
                        {project.status === 'PLANNED' && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleStatusChange(project.id, 'IN_PROGRESS')}
                          >
                            Démarrer
                          </Button>
                        )}
                        {project.status === 'IN_PROGRESS' && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleStatusChange(project.id, 'COMPLETED')}
                          >
                            Terminer
                          </Button>
                        )}
                        
                        {/* Suppression */}
                        <CriticalAction
                          action={async () => handleDelete(project.id)}
                          title="Supprimer le projet"
                          description="Êtes-vous sûr de vouloir supprimer ce projet ? Cette action est irréversible."
                          confirmText="Supprimer"
                          cancelText="Annuler"
                          successMessage="Projet supprimé avec succès"
                          errorMessage="Erreur lors de la suppression"
>
           <Button variant="outline" size="sm">
                             <Trash2 className="w-4 h-4" />
                           </Button>
                         </CriticalAction>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-600">
                Page {pagination.page} sur {pagination.totalPages} ({pagination.totalItems} projets)
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
