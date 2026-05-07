import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

// Schéma de validation pour la recherche
const SearchSchema = z.object({
  query: z.string().min(2).max(100),
  type: z.enum(['all', 'events', 'projects', 'documents', 'partners', 'antennes', 'executive-members']).default('all'),
  page: z.coerce.number().min(1).default(1),
  per: z.coerce.number().min(1).max(20).default(10),
  category: z.string().optional(),
  status: z.string().optional(),
  published: z.string().optional(),
  city: z.string().optional(),
})

// GET - Recherche globale
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const searchQuery = SearchSchema.parse(Object.fromEntries(searchParams))

    const { query, type, page, per, category, status, published, city } = searchQuery
    const skip = (page - 1) * per

    const results: any = {
      events: [],
      projects: [],
      documents: [],
      partners: [],
      antennes: [],
      executiveMembers: [],
    }
    let totalResults = 0

    // Recherche dans les événements
    if (type === 'all' || type === 'events') {
      const eventWhere: any = {
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          { location: { contains: query, mode: 'insensitive' } },
          { category: { contains: query, mode: 'insensitive' } },
        ]
      }

      if (category) eventWhere.category = category
      if (published !== undefined) eventWhere.published = published === 'true'

      const [events, count] = await Promise.all([
        prisma.event.findMany({
          where: eventWhere,
          orderBy: { createdAt: 'desc' },
          skip: type === 'events' ? skip : 0,
          take: type === 'events' ? per : 5,
        }),
        prisma.event.count({ where: eventWhere })
      ])

      results.events = events
      totalResults += count
    }

    // Recherche dans les projets
    if (type === 'all' || type === 'projects') {
      const projectWhere: any = {
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          { category: { contains: query, mode: 'insensitive' } },
          { city: { contains: query, mode: 'insensitive' } },
          { tags: { some: { name: { contains: query, mode: 'insensitive' } } } },
        ]
      }

      if (category) projectWhere.category = category
      if (status) projectWhere.status = status
      if (published !== undefined) projectWhere.published = published === 'true'

      const [projects, count] = await Promise.all([
        prisma.project.findMany({
          where: projectWhere,
          orderBy: { createdAt: 'desc' },
          skip: type === 'projects' ? skip : 0,
          take: type === 'projects' ? per : 5,
        }),
        prisma.project.count({ where: projectWhere })
      ])

      results.projects = projects
      totalResults += count
    }

    // Recherche dans les documents
    if (type === 'all' || type === 'documents') {
      const documentWhere: any = {
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          { tags: { some: { name: { contains: query, mode: 'insensitive' } } } },
        ]
      }

      if (category) documentWhere.category = category
      if (published !== undefined) documentWhere.published = published === 'true'

      const [documents, count] = await Promise.all([
        prisma.document.findMany({
          where: documentWhere,
          orderBy: { createdAt: 'desc' },
          skip: type === 'documents' ? skip : 0,
          take: type === 'documents' ? per : 5,
        }),
        prisma.document.count({ where: documentWhere })
      ])

      results.documents = documents
      totalResults += count
    }

    // Recherche dans les partenaires
    if (type === 'all' || type === 'partners') {
      const partnerWhere: any = {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
        ]
      }

      const [partners, count] = await Promise.all([
        prisma.partner.findMany({
          where: partnerWhere,
          orderBy: { order: 'asc' },
          skip: type === 'partners' ? skip : 0,
          take: type === 'partners' ? per : 5,
        }),
        prisma.partner.count({ where: partnerWhere })
      ])

      results.partners = partners
      totalResults += count
    }

    // Recherche dans les antennes
    if (type === 'all' || type === 'antennes') {
      const antenneWhere: any = {
        OR: [
          { city: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
        ]
      }

      if (city) antenneWhere.city = city

      const [antennes, count] = await Promise.all([
        prisma.antenne.findMany({
          where: antenneWhere,
          orderBy: { city: 'asc' },
          skip: type === 'antennes' ? skip : 0,
          take: type === 'antennes' ? per : 5,
        }),
        prisma.antenne.count({ where: antenneWhere })
      ])

      results.antennes = antennes
      totalResults += count
    }

    // Recherche dans les membres du bureau exécutif
    if (type === 'all' || type === 'executive-members') {
      const memberWhere: any = {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { position: { contains: query, mode: 'insensitive' } },
        ]
      }

      const [members, count] = await Promise.all([
        prisma.executiveMember.findMany({
          where: memberWhere,
          orderBy: { order: 'asc' },
          skip: type === 'executive-members' ? skip : 0,
          take: type === 'executive-members' ? per : 5,
        }),
        prisma.executiveMember.count({ where: memberWhere })
      ])

      results.executiveMembers = members
      totalResults += count
    }

    return NextResponse.json({
      success: true,
      data: {
        ...results,
        total: totalResults
      },
      query,
      type
    })
  } catch (error: any) {
    console.error('❌ Erreur GET /api/search:', error)
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Paramètres de recherche invalides', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
