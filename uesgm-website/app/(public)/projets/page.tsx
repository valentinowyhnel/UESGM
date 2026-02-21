// Désactiver le cache pour récupérer les projets en temps réel
export const dynamicParams = true
export const revalidate = 0

import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import Link from "next/link"
import { prisma } from "@/lib/prisma"

// Récupérer les projets depuis la base de données
async function getProjects() {
  try {
    const projects = await prisma.project.findMany({
      where: { isPublished: true },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        tags: true
      }
    })
    return projects
  } catch (error) {
    console.error('Erreur lors de la récupération des projets:', error)
    return []
  }
}

export default async function ProjectsPage() {
  const projects = await getProjects()
    return (
        <div className="container mx-auto px-4 py-12 md:py-20 lg:max-w-6xl">
            <div className="text-center space-y-6 mb-16">
                <h1 className="text-4xl font-bold font-montserrat text-primary-dark">Nos Projets</h1>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto font-lato">
                    Découvrez les initiatives en cours et réalisées par l'UESGM pour améliorer le quotidien des étudiants.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {projects.map((project) => (
                    <Card key={project.id} className="flex flex-col hover:border-gold/50 transition-colors">
                        <CardHeader className="space-y-4">
                            <div className="flex justify-between items-start">
                                <Badge variant={
                                    project.status === "COMPLETED" ? "default" :
                                        project.status === "IN_PROGRESS" ? "secondary" : "outline"
                                } className={`
                    ${project.status === "COMPLETED" ? "bg-green-600 hover:bg-green-700" : ""}
                    ${project.status === "IN_PROGRESS" ? "bg-gold text-primary-dark hover:bg-gold-light" : ""}
                `}>
                                    {project.status === "COMPLETED" ? "Terminé" :
                                        project.status === "IN_PROGRESS" ? "En Cours" : "Planifié"}
                                </Badge>
                                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{project.category}</span>
                            </div>
                            <CardTitle className="text-2xl font-bold font-montserrat">{project.title}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 flex-grow">
                            <p className="text-muted-foreground">{project.description}</p>

                            <div className="space-y-2">
                                <div className="flex justify-between text-sm font-medium">
                                    <span>Progression</span>
                                    <span>{project.progress}%</span>
                                </div>
                                <Progress value={project.progress} className="h-2" />
                            </div>

                            <div className="flex flex-wrap gap-2 pt-2">
                                {(project.tags || []).map((tag: any) => (
                                    <span key={tag.id} className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md text-slate-600 dark:text-slate-400">#{tag.name}</span>
                                ))}
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Link href={`/projets/${project.slug}`}>
                                <Button variant="ghost" className="w-full justify-between hover:text-primary group">
                                    En savoir plus
                                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                                </Button>
                            </Link>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    )
}
