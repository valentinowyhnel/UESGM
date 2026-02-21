import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import EventForm from "@/components/admin/EventForm"
import { ChevronLeft } from "lucide-react"
import Link from "next/link"

async function getEvent(id: string) {
  try {
    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        antennes: {
          include: {
            antenne: { select: { id: true, city: true } }
          }
        }
      }
    })
    return event
  } catch (error) {
    console.error('Erreur récupération événement:', error)
    return null
  }
}

export default async function EditEventPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await getServerSession(authOptions)

  if (!session || (session.user as any).role === "MEMBER") {
    redirect("/login")
  }

  const { id } = await params
  const event = await getEvent(id)

  if (!event) {
    notFound()
  }

  // Préparer les données initiales
  const initialData = {
    title: event.title,
    description: event.description,
    date: new Date(event.startDate).toISOString().split('T')[0],
    location: event.location || '',
    category: event.category || '',
    published: !!event.publishedAt,
    image: event.imageUrl || undefined,
    images: [], // Le modèle Event ne contient pas de champ images
    antenneIds: event.antennes.map((a: { antenne: { id: string } }) => a.antenne.id),
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href="/admin/evenements" className="p-2 hover:bg-slate-100 rounded-full transition-colors">
          <ChevronLeft className="w-6 h-6" />
        </Link>
        <h1 className="text-3xl font-bold font-montserrat text-slate-900">
          Modifier l'événement
        </h1>
      </div>

      <EventForm eventId={id} initialData={initialData} />
    </div>
  )
}
