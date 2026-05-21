import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-utils'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_KEY || ''
)

const UploadSchema = z.object({
  fileName: z.string(),
  fileType: z.string(),
  bucket: z.string().default('documents'),
})

const CompletionSchema = z.object({
  filePath: z.string(),
  bucket: z.string(),
  title: z.string(),
  category: z.string().optional(),
  type: z.enum(['DOCUMENT', 'EVENT_IMAGE', 'PROJECT_IMAGE']),
  targetId: z.string().optional(), // eventId or projectId
})

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await req.json()
    const { fileName, fileType, bucket } = UploadSchema.parse(body)

    const filePath = `${session.user.id}/${Date.now()}-${fileName}`

    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(filePath, 3600, {
        upsert: true,
      })

    if (error) throw error

    return NextResponse.json({
      uploadUrl: data.signedUrl,
      filePath,
      bucket
    })
  } catch (error) {
    console.error('Erreur API Upload:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la génération de l\'URL signée' },
      { status: 500 }
    )
  }
}

// Webhook de complétion
export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await req.json()
    const { filePath, bucket, title, category, type, targetId } = CompletionSchema.parse(body)

    const fileUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/${bucket}/${filePath}`

    if (type === 'DOCUMENT') {
      const doc = await prisma.document.create({
        data: {
          title,
          category,
          fileUrl,
          fileType: filePath.split('.').pop() || 'unknown',
          userId: session.user.id,
          published: false,
        }
      })
      return NextResponse.json(doc)
    }

    if (type === 'EVENT_IMAGE' && targetId) {
      const event = await prisma.event.update({
        where: { id: targetId },
        data: { imageUrl: fileUrl }
      })
      return NextResponse.json(event)
    }

    if (type === 'PROJECT_IMAGE' && targetId) {
      const project = await prisma.project.update({
        where: { id: targetId },
        data: { imageUrl: fileUrl }
      })
      return NextResponse.json(project)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erreur Upload Completion:', error)
    return NextResponse.json({ error: 'Erreur de finalisation' }, { status: 500 })
  }
}
