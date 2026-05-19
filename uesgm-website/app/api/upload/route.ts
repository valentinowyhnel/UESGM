import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth/auth-options"
import prisma from "@/lib/prisma"
import { Role } from "@prisma/client"
import { v4 as uuidv4 } from "uuid"
import { createSignedUrl } from "@/lib/file-upload" // Assuming this helper exists or we'll create it

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)

  // Public uploads (e.g. for contact form) are restricted, admin has more freedom
  const isPublic = !session
  const userRole = (session?.user as any)?.role as Role || Role.PUBLIC

  try {
    const body = await request.json()
    const { type, category, fileName } = body

    if (!type || !fileName) {
      return NextResponse.json({ success: false, error: "Type et nom de fichier requis" }, { status: 400 })
    }

    // Role-based restrictions
    if (isPublic && type !== "document") {
       return NextResponse.json({ success: false, error: "Upload non autorisé" }, { status: 403 })
    }

    const fileId = uuidv4()
    const timestamp = Date.now()
    const storagePath = `${type}/${fileId}_${timestamp}_${fileName}`

    // Call Supabase / S3 signed URL generator
    const signedUrlData = await createSignedUrl(storagePath, type)

    return NextResponse.json({
      success: true,
      data: {
        fileId,
        signedUrl: signedUrlData.signedUrl,
        fileName: storagePath,
        expiresAt: new Date(Date.now() + 3600 * 1000).toISOString()
      },
      message: "URL signée générée avec succès"
    })
  } catch (error) {
    console.error("POST /api/upload error:", error)
    return NextResponse.json({ success: false, error: "Erreur lors de la génération de l'URL signée" }, { status: 500 })
  }
}

/**
 * Webhook / Finalize endpoint to record the file in DB after successful upload to storage
 */
export async function PUT(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  try {
    const body = await request.json()
    const { fileId, fileName, fileSize, mimeType, type, category, title } = body

    if (!fileName || !fileSize) {
      return NextResponse.json({ success: false, error: "Données manquantes" }, { status: 400 })
    }

    const document = await prisma.document.create({
      data: {
        title: title || fileName,
        slug: `${fileId}-${Date.now()}`,
        fileUrl: fileName, // Path in storage
        fileName: fileName,
        fileSize: fileSize,
        mimeType: mimeType || "application/octet-stream",
        fileType: mimeType,
        category: category || "ADMINISTRATIF",
        published: false,
        createdById: (session.user as any).id
      }
    })

    return NextResponse.json({
      success: true,
      data: document,
      message: "Fichier enregistré avec succès"
    })
  } catch (error) {
    console.error("PUT /api/upload error:", error)
    return NextResponse.json({ success: false, error: "Erreur lors de l'enregistrement" }, { status: 500 })
  }
}
