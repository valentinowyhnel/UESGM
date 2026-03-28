import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { v4 as uuidv4 } from "uuid"

const UploadSchema = z.object({
  type: z.enum(['image', 'document', 'profile', 'executive', 'event', 'project']),
  category: z.string().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const body = await req.json()
    const { type, category } = UploadSchema.parse(body)

    // Check permissions
    if (['executive', 'event', 'project'].includes(type)) {
      if (!session?.user?.role || !['ADMIN', 'SUPER_ADMIN', 'MODERATOR'].includes(session.user.role)) {
        return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
      }
    } else if (type === 'profile' && !session) {
      return NextResponse.json({ error: 'Authentification requise' }, { status: 401 })
    }

    // In a real scenario with Supabase/S3, we would generate a signed URL here.
    // For this implementation, we simulate the signed URL generation.
    const fileId = uuidv4()
    const fileName = `${type}/${fileId}`
    const signedUrl = `https://mock-storage.uesgm.ma/upload/${fileName}?token=mock-token`

    return NextResponse.json({
      success: true,
      data: {
        fileId,
        signedUrl,
        fileName,
        maxSize: type === 'document' ? 50 * 1024 * 1024 : 5 * 1024 * 1024,
        allowedTypes: type === 'document' ? ['application/pdf'] : ['image/jpeg', 'image/png', 'image/webp'],
        expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
      }
    })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Requête invalide", details: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
