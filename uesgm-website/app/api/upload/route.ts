import { NextResponse } from 'next/server'
import { z } from 'zod'
import { v4 as uuidv4 } from 'uuid'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_KEY || ''
const supabase = createClient(supabaseUrl, supabaseKey)

// Schéma de validation pour l'upload
const UploadSchema = z.object({
  type: z.enum(['image', 'document', 'profile', 'executive', 'event', 'project']),
  fileName: z.string(),
  contentType: z.string(),
})

// POST - Demande d'upload (génère une URL signée)
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    const userRole = (session?.user as any)?.role
    
    if (!session || !userRole || !['MODERATOR', 'ADMIN', 'SUPER_ADMIN'].includes(userRole)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await req.json()
    const { type, fileName, contentType } = UploadSchema.parse(body)

    const fileId = uuidv4()
    const path = `${type}/${fileId}-${fileName}`

    const { data, error } = await supabase.storage
      .from('uesgm-assets')
      .createSignedUploadUrl(path)

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ error: 'Erreur Supabase' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: {
        signedUrl: data.signedUrl,
        path,
        token: data.token,
        publicUrl: `${supabaseUrl}/storage/v1/object/public/uesgm-assets/${path}`
      }
    })
  } catch (error: any) {
    console.error('❌ Erreur POST /api/upload:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// PUT - Webhook / Callback de confirmation
export async function PUT(req: Request) {
    try {
      const session = await getServerSession(authOptions)
      const userRole = (session?.user as any)?.role
      if (!session || !userRole) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

      const body = await req.json()
      const { path, type, title, metadata } = body

      const publicUrl = `${supabaseUrl}/storage/v1/object/public/uesgm-assets/${path}`

      let result
      if (type === 'document') {
          result = await prisma.document.create({
              data: {
                  title: title || 'Nouveau Document',
                  fileUrl: publicUrl,
                  fileName: path.split('/').pop() || 'file',
                  fileSize: metadata?.size || 0,
                  mimeType: metadata?.mimeType || 'application/octet-stream',
                  category: metadata?.category || 'ADMINISTRATIF',
                  slug: (title || 'doc').toLowerCase().replace(/ /g, '-') + '-' + Date.now(),
                  createdById: (session.user as any).id,
              }
          })
      } else if (type === 'event') {
          result = await prisma.event.update({
              where: { id: metadata.eventId },
              data: { imageUrl: publicUrl }
          })
      } else if (type === 'project') {
          result = await prisma.project.update({
              where: { id: metadata.projectId },
              data: { imageUrl: publicUrl }
          })
      } else if (type === 'executive') {
          result = await prisma.executiveMember.update({
              where: { id: metadata.memberId },
              data: { photoUrl: publicUrl }
          })
      }

      return NextResponse.json({ success: true, data: result })
    } catch (error: any) {
      console.error('❌ Erreur PUT /api/upload:', error)
      return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
    }
}
