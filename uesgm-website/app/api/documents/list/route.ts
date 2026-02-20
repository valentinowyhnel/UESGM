import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { z } from "zod"
import type { DefaultSession } from "next-auth"
import { DocumentCategory } from '@prisma/client'

type ExtendedSession = Awaited<ReturnType<typeof getServerSession>> & {
  user: {
    id: string
    email: string
    name: string
    role: "SUPER_ADMIN" | "ADMIN" | "MEMBER"
  }
}

// Document schema for creating/updating documents
const DocumentSchema = z.object({
  title: z.string().min(5).max(200),
  description: z.string().max(1000).optional(),
  category: z.enum(['STATUTS', 'RAPPORT', 'GUIDE', 'LIVRE', 'ARTICLE', 'ACADEMIQUE', 'JURIDIQUE', 'ADMINISTRATIF']),
  fileUrl: z.string().url(),
  fileType: z.string(),
  fileSize: z.number().int().positive().optional(),
  tags: z.array(z.string()).default([]),
  published: z.boolean().default(false),
  submittedByEmail: z.string().email().max(255).optional(),
  submittedByName: z.string().max(100).optional(),
  antenneIds: z.array(z.string()).optional(),
  fileName: z.string().optional(),
  mimeType: z.string().optional(),
  slug: z.string().optional(),
  createdBy: z.string().optional()
});

// Mapping des catégories depuis les valeurs françaises vers les valeurs enum
const categoryLabelToEnum: Record<string, string> = {
  'statuts': 'STATUTS',
  'rapports': 'RAPPORT',
  'rapport': 'RAPPORT',
  'guides': 'GUIDE',
  'guide': 'GUIDE',
  'livres': 'LIVRE',
  'livre': 'LIVRE',
  'articles': 'ARTICLE',
  'article': 'ARTICLE',
  'académique': 'ACADEMIQUE',
  'academique': 'ACADEMIQUE',
  'juridique': 'JURIDIQUE',
  'administratif': 'ADMINISTRATIF',
}

function normalizeCategory(value: string | null): string {
  if (!value || value === 'all' || value === '') return 'all'
  const normalized = value.toLowerCase().trim()
  return categoryLabelToEnum[normalized] || value.toUpperCase()
}

// Query parameters schema
const DocumentQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  per: z.coerce.number().min(1).max(50).default(10),
  category: z.string().default('all'),
  published: z.enum(['true', 'false', 'all']).default('all'),
  search: z.string().optional(),
  tags: z.string().optional(),
  antenneId: z.string().optional(),
});

// GET - Liste des documents
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const query = DocumentQuerySchema.parse(Object.fromEntries(searchParams))

    // Vérifier la session pour déterminer si l'utilisateur est authentifié
    const session = await getServerSession(authOptions) as ExtendedSession | null;
    const userRole = session?.user?.role;
    const isAdmin = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';
    
    // Pour les utilisateurs non-admin, force always published=true for public access
    // Seul les admins peuvent voir les documents non publiés
    let publishedFilter = query.published;
    if (!isAdmin) {
      publishedFilter = 'true'; // Force published for public users
    }

    const where: any = {}
    
    // Filtres
    const normalizedCategory = normalizeCategory(query.category)
    if (normalizedCategory !== 'all') {
      where.category = normalizedCategory
    }
    
    // Apply published filter (enforced to 'true' for non-admin users)
    // Note: Prisma schema uses 'isPublished' field
    if (publishedFilter !== 'all') {
      where.isPublished = publishedFilter === 'true'
    }
    
    if (query.antenneId) {
      where.antennes = {
        some: { antenneId: query.antenneId }
      }
    }
    
    // Rest of your GET implementation remains the same...
    // [Previous GET implementation continues...]
    
    // Recherche textuelle
    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
        { tags: { hasSome: [query.search] } },
      ]
    }
    
    // Filtre par tags
    if (query.tags) {
      const tagList = query.tags.split(',').map(tag => tag.trim())
      where.tags = { hasSome: tagList }
    }

    // Vérifier d'abord si la table existe (case-insensitive)
    interface TableExistsResult {
      exists: boolean;
    }
    
    const tableExists = await prisma.$queryRaw<TableExistsResult[]>`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('documents', 'Document', 'document')
      ) as "exists"
    `

    if (!tableExists[0]?.exists) {
      console.error('La table Document n\'existe pas dans la base de données')
      return NextResponse.json(
        { error: 'Table des documents non trouvée', code: 'TABLE_NOT_FOUND' },
        { status: 404 }
      )
    }

    // Récupérer les documents avec gestion d'erreur
    try {
      const [documents, total] = await Promise.all([
        prisma.document.findMany({
          where,
          orderBy: [
            { isPublished: 'desc' },
            { createdAt: 'desc' }
          ],
          skip: (query.page - 1) * query.per,
          take: query.per,
          include: {
            antennes: {
              select: { 
                antenne: {
                  select: { id: true, city: true }
                }
              }
            }
          }
        }),
        prisma.document.count({ where }),
      ])

      return NextResponse.json({
        success: true,
        data: documents,
        pagination: {
          page: query.page,
          per: query.per,
          total,
          pages: Math.ceil(total / query.per),
          hasNext: query.page * query.per < total,
        },
      })
    } catch (error: unknown) {
      console.error('❌ Erreur GET /api/documents:', error)
      
      // Log plus détaillé pour le débogage
      let errorMessage = 'Une erreur inconnue est survenue'
      if (error instanceof Error) {
        console.error('Message d\'erreur:', error.message)
        console.error('Stack trace:', error.stack)
        errorMessage = error.message
      } else {
        console.error('Erreur inconnue:', JSON.stringify(error, null, 2))
      }

      return NextResponse.json(
        { 
          error: 'Erreur serveur',
          ...(process.env.NODE_ENV === 'development' && { details: errorMessage })
        },
        { status: 500 }
      )
    }
  } catch (error: unknown) {
    console.error('❌ Erreur GET /api/documents:', error)
    const errorMessage = error instanceof Error ? error.message : 'Une erreur inconnue est survenue'
    return NextResponse.json(
      { 
        error: 'Erreur serveur',
        ...(process.env.NODE_ENV === 'development' && { details: errorMessage })
      },
      { status: 500 }
    )
  }
}

// POST - Ajouter un document (admin uniquement)
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions) as ExtendedSession | null;
    const userRole = session?.user?.role;
    
    if (!session || !userRole || !['ADMIN', 'SUPER_ADMIN'].includes(userRole)) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { antenneIds, ...documentData } = DocumentSchema.parse(body);

    // Start transaction with simple type
    const result = await prisma.$transaction(async (tx: any) => {
      const userId = documentData.createdBy || session?.user?.id;
      
      if (!userId) {
        throw new Error('User ID is required');
      }
      
      // Generate slug if not provided
      const slug = documentData.slug || documentData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

      // Create the document with the user relation
      const doc = await tx.document.create({
        data: {
          title: documentData.title,
          description: documentData.description,
          category: documentData.category,
          fileUrl: documentData.fileUrl,
          fileType: documentData.fileType,
          fileSize: documentData.fileSize,
          tags: documentData.tags,
          published: documentData.published,
          fileName: documentData.fileName || documentData.title,
          mimeType: documentData.mimeType || 'application/octet-stream',
          slug: slug,
          // Use the correct field name based on your schema
          // If it's a relation to User model
          user: {
            connect: { id: userId }
          }
        }
      });

      // Create Antenne relations if any
      if (antenneIds?.length) {
        await tx.antenneDocument.createMany({
          data: antenneIds.map((antenneId: string) => ({
            antenneId,
            documentId: doc.id
          }))
        });
      }

      // Return the created document with relations
      return tx.document.findUnique({
        where: { id: doc.id },
        include: {
          user: {
            select: { id: true, name: true, email: true }
          },
          antennes: {
            include: {
              antenne: {
                select: { id: true, city: true }
              }
            }
          }
        }
      });
    });

    return NextResponse.json(
      { success: true, data: result },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('❌ Erreur POST /api/documents:', error);
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Données invalides', details: error.errors },
        { status: 400 }
      )
    }
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Document non trouvé' },
        { status: 404 }
      )
    }
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

// PUT - Mettre à jour un document (admin uniquement)
export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions) as ExtendedSession | null;
    const userRole = session?.user?.role;
    
    if (!session || !userRole || !['ADMIN', 'SUPER_ADMIN'].includes(userRole)) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { id, ...updateData } = body;
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID du document requis' },
        { status: 400 }
      );
    }

    const updateSchema = DocumentSchema.partial();
    const validatedData = updateSchema.parse(updateData);

    // Use a transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx: any) => {
      // Update the document
      const doc = await tx.document.update({
        where: { id },
        data: {
          ...validatedData,
          slug: validatedData.slug || undefined,
        }
      });

      // Return the updated document with relations
      return tx.document.findUnique({
        where: { id: doc.id },
        include: {
          user: {
            select: { id: true, name: true, email: true }
          },
          antennes: {
            include: {
              antenne: {
                select: { id: true, city: true }
              }
            }
          }
        }
      });
    });

    return NextResponse.json(
      { success: true, data: result }
    );
  } catch (error: any) {
    console.error('❌ Erreur PUT /api/documents:', error);
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Données invalides', details: error.errors },
        { status: 400 }
      )
    }
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Document non trouvé' },
        { status: 404 }
      )
    }
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

// DELETE - Suppression d'un document (admin uniquement)
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions) as ExtendedSession | null
    const userRole = session?.user?.role
    if (!session || !userRole || !['ADMIN', 'SUPER_ADMIN'].includes(userRole)) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID du document requis' },
        { status: 400 }
      )
    }

    // Use a transaction to ensure data consistency
    await prisma.$transaction([
      // First delete the relations
      prisma.antenneDocument.deleteMany({
        where: { documentId: id }
      }),
      // Then delete the document
      prisma.document.delete({
        where: { id }
      })
    ]);

    return NextResponse.json(
      { success: true, message: 'Document supprimé avec succès' },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('❌ Erreur DELETE /api/documents:', error)
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Document non trouvé' },
        { status: 404 }
      )
    }
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}