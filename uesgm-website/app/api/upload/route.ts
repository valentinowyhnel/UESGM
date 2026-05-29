import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createClient } from "@supabase/supabase-js"
import { v4 as uuidv4 } from "uuid"
import { prisma } from "@/lib/prisma"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
)

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  try {
    const { fileName, fileType, category } = await req.json()
    
    const fileId = uuidv4()
    const path = `${category}/${fileId}-${fileName}`

    const { data, error } = await supabase.storage
      .from("uploads")
      .createSignedUrl(path, 3600, { upsert: true })

    if (error) throw error

    return NextResponse.json({
      success: true,
      data: {
        signedUrl: data.signedUrl,
        path: path,
        fileId: fileId
      }
    })
  } catch (error) {
    console.error("Upload API Error:", error)
    return NextResponse.json({ error: "Erreur lors de la génération de l'URL signée" }, { status: 500 })
  }
}

// Webhook de complétion - Enregistre le document dans la DB
export async function PUT(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  try {
    const { fileId, fileName, fileSize, mimeType, category, title, description } = await req.json()
    
    // Si c'est un document, on l'ajoute à la table Document
    if (category === 'document') {
      const document = await prisma.document.create({
        data: {
          title: title || fileName,
          description: description || "",
          fileUrl: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/uploads/document/${fileId}-${fileName}`,
          fileName: fileName,
          fileSize: fileSize,
          mimeType: mimeType,
          category: 'ADMINISTRATIF', // Valeur par défaut
          createdById: session.user.id,
          slug: (title || fileName).toLowerCase().replace(/ /g, '-') + '-' + fileId.slice(0, 8),
          isPublished: false
        } as any
      })
      return NextResponse.json({ success: true, data: document })
    }

    return NextResponse.json({ success: true, message: "Upload finalisé" })
  } catch (error) {
    console.error("Finalization Error:", error)
    return NextResponse.json({ error: "Erreur lors de la finalisation" }, { status: 500 })
  }
}
