import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_KEY! // service_role key for server-side signed URLs
)

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !['ADMIN', 'SUPER_ADMIN', 'MODERATOR'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const { fileName, fileType, bucket = 'documents' } = await req.json()

    if (!fileName || !fileType) {
      return NextResponse.json({ error: 'fileName and fileType are required' }, { status: 400 })
    }

    const fileExt = fileName.split('.').pop()
    const path = `${session.user.id}/${uuidv4()}.${fileExt}`

    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUploadUrl(path)

    if (error) {
      throw error
    }

    return NextResponse.json({
      uploadUrl: data.signedUrl,
      path: path,
      token: data.token,
      fileUrl: `${process.env.SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`
    })
  } catch (error: any) {
    console.error('❌ POST /api/upload error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
