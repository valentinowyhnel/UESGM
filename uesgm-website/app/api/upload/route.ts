import { NextResponse } from 'next/server'
import { z } from 'zod'
import { v4 as uuidv4 } from 'uuid'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// Schéma de validation pour l'upload
const UploadSchema = z.object({
  type: z.enum(['image', 'document', 'profile', 'executive', 'event', 'project']),
  category: z.string().optional(),
  eventId: z.string().optional(),
  projectId: z.string().optional(),
  memberId: z.string().optional(),
})

// Schéma de validation pour la confirmation d'upload
const UploadConfirmSchema = z.object({
  fileId: z.string(),
  fileName: z.string(),
  fileSize: z.number().int().positive(),
  mimeType: z.string(),
  type: z.enum(['image', 'document', 'profile', 'executive', 'event', 'project']),
  category: z.string().optional(),
  eventId: z.string().optional(),
  projectId: z.string().optional(),
  memberId: z.string().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
})

// POST - Demande d'upload (génère une URL signée)
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    const userRole = (session?.user as any)?.role
    
    // Vérifier si la requête est de type multipart/form-data
    const contentType = req.headers.get('content-type')
    let uploadData
    
    if (contentType && contentType.includes('multipart/form-data')) {
      // Si c'est un upload de fichier direct
      const formData = await req.formData()
      const file = formData.get('file') as File
      
      if (!file) {
        return NextResponse.json(
          { error: 'Aucun fichier fourni' },
          { status: 400 }
        )
      }
      
      // Déterminer le type de fichier basé sur le MIME type
      let fileType: string
      if (file.type.startsWith('image/')) {
        fileType = 'image'
      } else if (file.type === 'application/pdf' || file.type.includes('document') || file.type.includes('msword')) {
        fileType = 'document'
      } else {
        fileType = 'document' // Par défaut
      }
      
      uploadData = {
        type: fileType,
        mimeType: file.type,
        fileSize: file.size,
        fileName: file.name,
      }
      
      // Vérifier les permissions pour les types non publics
      if (!['image', 'document'].includes(fileType)) {
        if (!session) {
          return NextResponse.json(
            { error: 'Authentification requise' },
            { status: 401 }
          )
        }
        if (session && !userRole) {
          return NextResponse.json(
            { error: 'Utilisateur non valide' },
            { status: 401 }
          )
        }
      }
    } else {
      // Si c'est une requête JSON standard
      const body = await req.json()
      uploadData = UploadSchema.parse(body)
      
      // Vérifier les permissions pour les types non publics
      if (!['image', 'document'].includes(uploadData.type)) {
        if (!session) {
          return NextResponse.json(
            { error: 'Authentification requise' },
            { status: 401 }
          )
        }
        if (session && !userRole) {
          return NextResponse.json(
            { error: 'Utilisateur non valide' },
            { status: 401 }
          )
        }
      }
    }

    // Générer un ID unique pour le fichier
    const fileId = uuidv4()
    const timestamp = Date.now()
    
    // Définir le type pour la configuration
    type FileTypeConfig = {
      maxSize: number;
      allowedTypes: string[];
      folder: string;
    };

    type ConfigType = {
      [key: string]: FileTypeConfig;
      image: FileTypeConfig;
      document: FileTypeConfig;
      profile: FileTypeConfig;
      executive: FileTypeConfig;
      event: FileTypeConfig;
      project: FileTypeConfig;
    };

    // Déterminer les limites et types autorisés
    const config: ConfigType = {
      image: {
        maxSize: 5 * 1024 * 1024, // 5MB
        allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
        folder: 'images',
      },
      document: {
        maxSize: 50 * 1024 * 1024, // 50MB
        allowedTypes: [
          'application/pdf', 
          'application/msword', 
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-powerpoint',
          'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          'text/plain'
        ],
        folder: 'documents',
      },
      profile: {
        maxSize: 2 * 1024 * 1024, // 2MB
        allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
        folder: 'profiles',
      },
      executive: {
        maxSize: 2 * 1024 * 1024, // 2MB
        allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
        folder: 'executive',
      },
      event: {
        maxSize: 10 * 1024 * 1024, // 10MB
        allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
        folder: 'events',
      },
      project: {
        maxSize: 10 * 1024 * 1024, // 10MB
        allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
        folder: 'projects',
      },
    }

    // Vérifier que le type est valide
    const fileType = uploadData.type as keyof typeof config;
    const typeConfig = config[fileType];
    
    if (!typeConfig) {
      return NextResponse.json(
        { error: 'Type de fichier non supporté' },
        { status: 400 }
      )
    }

    // Générer le nom du fichier
    const fileExt = (uploadData as any).fileName?.split('.').pop() || 'jpg'
    const fileName = `${uploadData.type}/${fileId}_${timestamp}.${fileExt}`
    
    // Utiliser une URL absolue basée sur l'environnement
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://uesgm.ma'
    const fileUrl = `${baseUrl}/uploads/${fileName}`
    
    // Enregistrer les métadonnées de l'upload en attente
    const uploadMetadata = {
      id: fileId,
      fileName,
      fileUrl,
      type: uploadData.type,
      category: (uploadData as any).category,
      eventId: (uploadData as any).eventId,
      projectId: (uploadData as any).projectId,
      memberId: (uploadData as any).memberId,
      maxSize: typeConfig.maxSize,
      allowedTypes: typeConfig.allowedTypes,
      signedUrl: fileUrl,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 heure
      uploadedBy: session?.user?.email || 'anonymous',
    }

    return NextResponse.json({
      success: true,
      data: {
        fileId,
        url: fileUrl,
        fileName,
        maxSize: typeConfig.maxSize,
        allowedTypes: typeConfig.allowedTypes,
        expiresAt: uploadMetadata.expiresAt,
      },
      message: 'URL signée générée avec succès'
    })
  } catch (error: any) {
    console.error('❌ Erreur POST /api/upload:', error)
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Paramètres invalides', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

// PUT - Confirmation d'upload (après upload réussi)
export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    const userRole = (session?.user as any)?.role
    
    if (!session || !userRole) {
      return NextResponse.json(
        { error: 'Authentification requise' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const confirmData = UploadConfirmSchema.parse(body)

    // Vérifier que le fichier existe et n'a pas expiré
    // En production, vérifier avec Supabase Storage ou S3
    
    let savedFile = null

    // Traiter selon le type
    switch (confirmData.type) {
      case 'document':
        // Vérifier que l'email de l'utilisateur est défini
        if (!session.user.email) {
          return NextResponse.json(
            { error: 'Email utilisateur manquant' },
            { status: 400 }
          )
        }

        // Créer le document avec les tags
        savedFile = await prisma.document.create({
          data: {
            title: confirmData.title || confirmData.fileName,
            description: confirmData.description,
            category: confirmData.category as any || 'ARTICLE',
            fileUrl: `https://uesgm.ma/uploads/${confirmData.fileName}`,
            mimeType: confirmData.mimeType,
            fileSize: confirmData.fileSize,
            fileName: confirmData.fileName,
            isPublished: false,
            createdBy: {
              connect: { email: session.user.email }
            },
            // Initialiser les tags
            tags: {
              create: (confirmData.tags || []).map((tag: string) => ({
                name: tag
              }))
            },
            slug: `${confirmData.fileName.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '')}-${Date.now()}`
          }
        })
        break

      case 'event':
        if (confirmData.eventId) {
          const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://uesgm.ma'
          await prisma.event.update({
            where: { id: confirmData.eventId },
            data: { imageUrl: `${baseUrl}/uploads/${confirmData.fileName}` }
          })
        }
        break

      case 'project':
        if (confirmData.projectId) {
          const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://uesgm.ma'
          await prisma.project.update({
            where: { id: confirmData.projectId },
            data: { imageUrl: `${baseUrl}/uploads/${confirmData.fileName}` }
          })
        }
        break

      case 'executive':
        if (confirmData.memberId) {
          await prisma.executiveMember.update({
            where: { id: confirmData.memberId },
            data: { photo: `https://uesgm.ma/uploads/${confirmData.fileName}` }
          })
        }
        break

      case 'profile':
        // Mettre à jour le profil de l'utilisateur
        if (session.user.email) {
          await prisma.user.update({
            where: { email: session.user.email },
            data: { image: `https://uesgm.ma/uploads/${confirmData.fileName}` }
          })
        }
        break
    }

    return NextResponse.json({
      success: true,
      data: savedFile,
      message: 'Fichier uploadé avec succès'
    })
  } catch (error: any) {
    console.error('❌ Erreur PUT /api/upload:', error)
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Paramètres invalides', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

// GET - Liste des uploads (admin uniquement)
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    const userRole = (session?.user as any)?.role
    
    if (!session || !userRole || !['ADMIN', 'SUPER_ADMIN'].includes(userRole)) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type')
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const per = Math.min(50, Math.max(1, parseInt(searchParams.get('per') || '10')))

    // Récupérer les documents récemment uploadés
    const documents = await prisma.document.findMany({
      where: type ? { category: type as any } : {},
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * per,
      take: per,
      select: {
        id: true,
        title: true,
        category: true,
        mimeType: true,
        fileSize: true,
        downloads: true,
        isPublished: true,
        fileName: true,
        fileUrl: true,
        createdAt: true,
        createdBy: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })

    const total = await prisma.document.count({
      where: type ? { category: type as any } : {}
    })

    return NextResponse.json({
      success: true,
      data: documents,
      pagination: {
        page,
        per,
        total,
        pages: Math.ceil(total / per),
        hasNext: page * per < total,
      }
    })
  } catch (error) {
    console.error('❌ Erreur GET /api/upload:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
