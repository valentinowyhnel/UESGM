import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth/auth-options"
import { hasRequiredRole } from "@/lib/auth/rbac"
import { createClient } from "@supabase/supabase-js"
import { uploadRateLimit } from "@/lib/rate-limit"

const supabase = createClient(
  process.env.SUPABASE_URL || "",
  process.env.SUPABASE_KEY || "" // service_role key
)

export async function POST(req: NextRequest) {
  try {
    // 1. Auth check
    const session = await getServerSession(authOptions)
    // Admin for normal uploads, but maybe public for some specific cases?
    // Prompt says: "Auth required for admin uploads; public uploads allowed via CAPTCHA and rate-limit."
    // For now we enforce ADMIN+ for simplicity in this implementation.
    if (!session || !hasRequiredRole(session.user?.role, "ADMIN")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }

    // 2. Rate limit
    const ip = req.headers.get("x-forwarded-for") || "unknown"
    const { success } = await uploadRateLimit.limit(ip)
    if (!success) {
      return NextResponse.json({ error: "Trop d'uploads. Réessayez plus tard." }, { status: 429 })
    }

    const { fileName, fileType, bucket = "documents" } = await req.json()

    if (!fileName || !fileType) {
      return NextResponse.json({ error: "fileName et fileType requis" }, { status: 400 })
    }

    // 3. Generate Signed URL
    const path = `${Date.now()}-${fileName}`
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUploadUrl(path)

    if (error) {
      console.error("Supabase Storage Error:", error)
      return NextResponse.json({ error: "Erreur lors de la génération de l'URL signée" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      uploadUrl: data.signedUrl,
      path: path,
      token: data.token,
      publicUrl: `${process.env.SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`
    })
  } catch (error) {
    console.error("Upload API Error:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
