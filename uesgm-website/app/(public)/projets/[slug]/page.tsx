import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Calendar, MapPin, Users, Target, Clock } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

// Données statiques (à remplacer par un appel API plus tard)
const projects = [
    {
        id: 1,
        title: "Guide de l'Étudiant 2026",
        slug: "guide-etudiant-2026",
        status: "IN_PROGRESS",
        progress: 75,
        category: "Éducation",
        description: "Rédaction et mise à jour du guide d'accueil pour les nouveaux étudiants gabonais au Maroc.",
        longDescription: "Ce projet vise à créer un guide complet pour les étudiants gabonais arrivant au Maroc. Il inclut des informations sur les démarches administratives, le logement, les transports, la santé, et la vie étudiante. Le guide est mis à jour annuellement pour refléter les derniers changements réglementaires et les nouvelles opportunités.",
        tags: ["Documentation", "Accueil"],
        images: ["/images/guide-etudiant-1.jpg", "/images/guide-etudiant-2.jpg"],
        startDate: "2025-01-15",
        endDate: "2025-06-30",
        location: "Rabat",
        team: ["Marie Dupont", "Jean Martin", "Sophie Bernard"],
        objectives: [
            "Faciliter l'intégration des nouveaux étudiants",
            "Centraliser l'information utile",
            "Réduire le stress lié à l'arrivée au Maroc"
        ],
        budget: 50000,
        currentBudget: 37500
    },
    {
        id: 2,
        title: "Partenariat Assurance Santé",
        slug: "partenariat-assurance-sante",
        status: "PLANNED",
        progress: 10,
        category: "Santé",
        description: "Négociation d'une convention avec une compagnie d'assurance pour une couverture santé abordable.",
        longDescription: "Ce projet consiste à négocier un partenariat avec une compagnie d'assurance marocaine pour offrir aux étudiants gabonais une couverture santé à des tarifs préférentiels. L'objectif est de garantir l'accès aux soins médicaux de qualité sans représenter une charge financière trop lourde pour les étudiants et leurs familles.",
        tags: ["Social", "Santé"],
        images: ["/images/assurance-sante-1.jpg"],
        startDate: "2025-03-01",
        endDate: "2025-12-31",
        location: "Rabat",
        team: ["Dr. Ahmed Hassan", "Fatima Zahra"],
        objectives: [
            "Négocier des tarifs préférentiels",
            "Garantir une couverture complète",
            "Faciliter les démarches d'assurance"
        ],
        budget: 25000,
        currentBudget: 2500
    },
    {
        id: 3,
        title: "Rénovation Bibliothèque Rabat",
        slug: "renovation-bibliotheque-rabat",
        status: "COMPLETED",
        progress: 100,
        category: "Infrastructure",
        description: "Aménagement d'un nouvel espace de travail pour les étudiants au siège de l'UESGM.",
        longDescription: "La rénovation de la bibliothèque du siège de l'UESGM a permis de créer un espace moderne et fonctionnel pour les étudiants. Le projet inclut l'installation de nouveaux mobiliers, un système de climatisation, des ordinateurs connectés, et une collection de livres spécialisés dans les domaines d'études des étudiants gabonais.",
        tags: ["Siège", "Équipement"],
        images: ["/images/bibliotheque-avant.jpg", "/images/bibliotheque-apres.jpg"],
        startDate: "2024-09-01",
        endDate: "2024-12-15",
        location: "Rabat, Siège UESGM",
        team: ["Architecte Youssef", "Équipe technique"],
        objectives: [
            "Moderniser l'espace de travail",
            "Augmenter la capacité d'accueil",
            "Améliorer les conditions d'étude"
        ],
        budget: 100000,
        currentBudget: 95000
    }
]

function ProjectImageGallery({ images }: { images: string[] }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {images.map((image, index) => (
                <div key={index} className="relative aspect-video rounded-lg overflow-hidden">
                    <Image
                        src={image}
                        alt={`Image ${index + 1} du projet`}
                        fill
                        className="object-cover hover:scale-105 transition-transform duration-300"
                    />
                </div>
            ))}
        </div>
    )
}

function ProjectInfo({ icon: Icon, label, value }: { icon: any, label: string, value: string }) {
    return (
        <div className="flex items-center gap-3">
            <Icon className="w-5 h-5 text-gold" />
            <div>
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="font-medium">{value}</p>
            </div>
        </div>
    )
}

export default function ProjectDetailPage({ params }: { params: { slug: string } }) {
    const project = projects.find(p => p.slug === params.slug)

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

    type ProjectStatus = 'COMPLETED' | 'IN_PROGRESS' | 'PLANNED'
    
    const statusConfig = {
        COMPLETED: { label: "Terminé", variant: "default" as const, color: "bg-green-600" },
        IN_PROGRESS: { label: "En Cours", variant: "secondary" as const, color: "bg-gold text-primary-dark" },
        PLANNED: { label: "Planifié", variant: "outline" as const, color: "" }
    }

    // Vérifier que le statut est valide
    const statusKey = (Object.keys(statusConfig) as ProjectStatus[]).includes(project.status as ProjectStatus) 
        ? project.status as ProjectStatus 
        : 'PLANNED' as const
        
    const status = statusConfig[statusKey]

    return (
        <div className="container mx-auto px-4 py-12 md:py-20">
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
                                {project.category}
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

                <div className="flex flex-wrap gap-2">
                    {project.tags.map(tag => (
                        <span key={tag} className="text-xs bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-md text-slate-600 dark:text-slate-400">
                            #{tag}
                        </span>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                {/* Contenu principal */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Description */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Target className="w-5 h-5 text-gold" />
                                Description du projet
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground leading-relaxed">
                                {project.longDescription}
                            </p>
                        </CardContent>
                    </Card>

                    {/* Galerie d'images */}
                    {project.images && project.images.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Galerie du projet</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ProjectImageGallery images={project.images} />
                            </CardContent>
                        </Card>
                    )}

                    {/* Objectifs */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Target className="w-5 h-5 text-gold" />
                                Objectifs du projet
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-3">
                                {project.objectives.map((objective, index) => (
                                    <li key={index} className="flex items-start gap-3">
                                        <div className="w-2 h-2 bg-gold rounded-full mt-2 flex-shrink-0" />
                                        <span className="text-muted-foreground">{objective}</span>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Informations */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Informations</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <ProjectInfo 
                                icon={Calendar} 
                                label="Date de début" 
                                value={new Date(project.startDate).toLocaleDateString('fr-FR')} 
                            />
                            <ProjectInfo 
                                icon={Clock} 
                                label="Date de fin" 
                                value={new Date(project.endDate).toLocaleDateString('fr-FR')} 
                            />
                            <ProjectInfo 
                                icon={MapPin} 
                                label="Lieu" 
                                value={project.location} 
                            />
                        </CardContent>
                    </Card>

                    {/* Équipe */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="w-5 h-5 text-gold" />
                                Équipe du projet
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {project.team.map((member, index) => (
                                    <div key={index} className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                                            <span className="text-xs font-bold text-primary">
                                                {member.split(' ').map(n => n[0]).join('')}
                                            </span>
                                        </div>
                                        <span className="text-sm">{member}</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Budget */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Budget</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                <div>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span>Budget total</span>
                                        <span className="font-bold">{project.budget.toLocaleString()} MAD</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span>Dépensé</span>
                                        <span className="font-bold text-gold">{project.currentBudget.toLocaleString()} MAD</span>
                                    </div>
                                </div>
                                <Progress value={(project.currentBudget / project.budget) * 100} className="h-2" />
                                <div className="text-xs text-muted-foreground text-right">
                                    {((project.currentBudget / project.budget) * 100).toFixed(1)}% du budget utilisé
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
