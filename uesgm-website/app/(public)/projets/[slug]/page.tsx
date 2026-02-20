import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Calendar, MapPin, Users, Clock, Tag } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"

// Récupérer un Projet par slug depuis la base de données
async function getProject(slug: string) {
  try {
    const project = await prisma.project.findUnique({
      where: { slug, isPublished: true },
      include: {
        tags: true,
        createdBy: {
          select: { name: true, email: true, image: true }
        }
      }
    })
    return project
  } catch (error) {
    console.error('Erreur lors de la récupération du projet:', error)
    return null
  }
}

// Fonction pour formater la date
function formatDate(date: Date | string | null): string {
  if (!date) return 'Non définie'
  return new Date(date).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

// Type pour le statut du projet
type ProjectStatus = 'COMPLETED' | 'IN_PROGRESS' | 'PLANNED'

const statusConfig = {
  COMPLETED: { label: "Terminé", variant: "default" as const, color: "bg-green-600" },
  IN_PROGRESS: { label: "En Cours", variant: "secondary" as const, color: "bg-gold text-primary-dark" },
  PLANNED: { label: "Planifié", variant: "outline" as const, color: "" }
}

// Catégories
const categoryLabels: Record<string, string> = {
  EDUCATION: "Éducation",
  SOCIAL: "Social",
  CULTUREL: "Culturel",
  SPORT: "Sport",
  INFRASTRUCTURE: "Infrastructure",
  SANTE: "Santé",
  AUTRE: "Autre"
}

export default async function ProjectDetailPage({ params }: { params: { slug: string } }) {
  const project = await getProject(params.slug)

  if (!project) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold mb-4">Projet non trouvé</h1>
        <p className="text-muted-foreground mb-8">Le projet que vous recherchez n'existe pas.</p>
        <Link href="/projets">
          <Button>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour aux projets
          </Button>
        </Link>
      </div>
    )
  }

  // Vérifier que le statut est valide
  const statusKey = (Object.keys(statusConfig) as ProjectStatus[]).includes(project.status as ProjectStatus) 
    ? project.status as ProjectStatus 
    : 'PLANNED'
    
  const status = statusConfig[statusKey]
  const categoryLabel = categoryLabels[project.category] || project.category

  return (
    <div className="container mx-auto px-4 py-12 md:py-20 lg:max-w-6xl">
      {/* Navigation */}
      <Link href="/projets" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary mb-8 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Retour aux projets
      </Link>

      {/* En-tête */}
      <div className="mb-12">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <Badge variant={status.variant} className={`${status.color} px-3 py-1`}>
                {status.label}
              </Badge>
              <span className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
                {categoryLabel}
              </span>
            </div>
            <h1 className="text-4xl font-bold font-montserrat text-primary-dark mb-4">
              {project.title}
            </h1>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-gold mb-1">{project.progress}%</div>
            <div className="text-sm text-muted-foreground">Progression</div>
          </div>
        </div>

        <Progress value={project.progress} className="h-3 mb-6" />

        {/* Tags */}
        {project.tags && project.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {project.tags.map((tag) => (
              <span key={tag.id} className="text-xs bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-md text-slate-600 dark:text-slate-400">
                #{tag.name}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Image principale */}
      {project.imageUrl && (
        <div className="relative w-full h-[400px] mb-12 rounded-xl overflow-hidden">
          <Image
            src={project.imageUrl}
            alt={project.title}
            fill
            className="object-cover"
            priority
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Description principale */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Description du projet</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {project.description}
              </p>
              
              {project.shortDesc && project.shortDesc !== project.description && (
                <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                  <h4 className="font-semibold mb-2">En bref</h4>
                  <p className="text-sm text-muted-foreground">{project.shortDesc}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Informations latérales */}
        <div className="space-y-6">
          {/* Dates */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="w-5 h-5 text-gold" />
                Calendrier
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Date de début</p>
                <p className="font-medium">{formatDate(project.startDate)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Date de fin prévue</p>
                <p className="font-medium">{formatDate(project.endDate)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Créé le</p>
                <p className="font-medium">{formatDate(project.createdAt)}</p>
              </div>
            </CardContent>
          </Card>

          {/* Équipe */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="w-5 h-5 text-gold" />
                Responsable
              </CardTitle>
            </CardHeader>
            <CardContent>
              {project.createdBy ? (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    {project.createdBy.image ? (
                      <Image
                        src={project.createdBy.image}
                        alt={project.createdBy.name || 'User'}
                        width={40}
                        height={40}
                        className="rounded-full"
                      />
                    ) : (
                      <span className="text-primary font-bold">
                        {(project.createdBy.name || 'U').charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{project.createdBy.name || 'Administrateur'}</p>
                    <p className="text-sm text-muted-foreground">Créateur du projet</p>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">Information non disponible</p>
              )}
            </CardContent>
          </Card>

          {/* Progression */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="w-5 h-5 text-gold" />
                Avancement
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Progression</span>
                  <span className="font-medium">{project.progress}%</span>
                </div>
                <Progress value={project.progress} className="h-2" />
                <p className="text-xs text-muted-foreground mt-2">
                  {project.progress === 100 
                    ? "Projet terminé" 
                    : project.progress === 0 
                      ? "Projet à venir"
                      : "Projet en cours de réalisation"}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Tags */}
          {project.tags && project.tags.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Tag className="w-5 h-5 text-gold" />
                  Tags
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {project.tags.map((tag) => (
                    <span key={tag.id} className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-slate-600 dark:text-slate-400">
                      {tag.name}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Bouton retour */}
      <div className="mt-12 text-center">
        <Link href="/projets">
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voir tous les projets
          </Button>
        </Link>
      </div>
    </div>
  )
}
