import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { z } from "zod"

const CompleteUploadSchema = z.object({
  fileUrl: z.string().url(),
  fileName: z.string(),
  fileSize: z.number(),
  mimeType: z.string(),
  type: z.enum(['image', 'document', 'profile', 'executive', 'event', 'project']),
  referenceId: z.string().optional(),
  metadata: z.any().optional()
})

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const data = CompleteUploadSchema.parse(body)

    switch (data.type) {
      case 'document':
        await prisma.document.create({
          data: {
            title: data.metadata?.title || data.fileName,
            slug: `${data.fileName.toLowerCase().replace(/[^\w-]+/g, '-')}-${Date.now()}`,
            category: data.metadata?.category || 'RAPPORT',
            fileUrl: data.fileUrl,
            fileName: data.fileName,
            fileSize: data.fileSize,
            mimeType: data.mimeType,
            createdById: (session.user as any).id,
            isPublished: data.metadata?.published || false
          }
        })
        break
      case 'event':
        if (data.referenceId) {
          await prisma.event.update({
            where: { id: data.referenceId },
            data: { imageUrl: data.fileUrl }
          })
        }
        break
      case 'project':
        if (data.referenceId) {
          await prisma.project.update({
            where: { id: data.referenceId },
            data: { imageUrl: data.fileUrl }
          })
        }
        break
      case 'executive':
        if (data.referenceId) {
          await prisma.executiveMember.update({
            where: { id: data.referenceId },
            data: { photo: data.fileUrl }
          })
        }
        break
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
