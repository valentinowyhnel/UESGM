import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth-utils"
import { createClient } from "@supabase/supabase-js"
import { v4 as uuidv4 } from "uuid"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 403 })

    const { filename, contentType } = await req.json()
    const ext = filename.split('.').pop()
    const path = `${uuidv4()}.${ext}`

    const { data, error } = await supabase.storage
      .from('uploads')
      .createSignedUploadUrl(path)

    if (error) throw error

    return NextResponse.json({
      success: true,
      data: {
        signedUrl: data.signedUrl,
        path: path,
        token: data.token
      }
    })
  } catch (error) {
    console.error("Upload API Error:", error)
    return NextResponse.json({ error: "Erreur lors de la génération de l'URL d'upload" }, { status: 500 })
  }
}
