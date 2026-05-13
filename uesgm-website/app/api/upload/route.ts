import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { createClient } from "@supabase/supabase-js"
import { v4 as uuidv4 } from "uuid"

const supabaseUrl = process.env.SUPABASE_URL || ""
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""
const supabase = createClient(supabaseUrl, supabaseKey)

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }
    
    const body = await req.json()
    const { fileName, fileType, folder = "uploads" } = body
    
    if (!fileName || !fileType) {
      return NextResponse.json({ error: "fileName et fileType sont requis" }, { status: 400 })
    }
    
    const fileExt = fileName.split('.').pop()
    const filePath = `${folder}/${uuidv4()}.${fileExt}`
    
    const { data, error } = await supabase.storage
      .from('uesgm-bucket')
      .createSignedUploadUrl(filePath)
    
    if (error) {
      console.error("Supabase storage error:", error)
      return NextResponse.json({ error: "Erreur lors de la génération de l'URL signée" }, { status: 500 })
    }
    
    return NextResponse.json({
      uploadUrl: data.signedUrl,
      publicUrl: `${supabaseUrl}/storage/v1/object/public/uesgm-bucket/${filePath}`,
      filePath,
      token: data.token
    })
    
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
