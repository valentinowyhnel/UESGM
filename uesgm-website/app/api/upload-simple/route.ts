import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { v4 as uuidv4 } from 'uuid'

// Types MIME autorisés
const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'image/jpeg',
  'image/png',
  'image/gif',
  'video/mp4',
  'video/avi',
  'audio/mp3',
  'audio/wav'
]

// Taille maximale (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024

// Chemin vers le dossier d'upload
const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads')

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'Aucun fichier fourni' },
        { status: 400 }
      )
    }

    // Validation du type MIME
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Type de fichier non autorisé' },
        { status: 400 }
      )
    }

    // Validation de la taille
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'Fichier trop volumineux (max 10MB)' },
        { status: 400 }
      )
    }

    // Créer le dossier d'upload s'il n'existe pas
    try {
      await mkdir(UPLOAD_DIR, { recursive: true })
    } catch (err) {
      console.error('Erreur lors de la création du dossier uploads:', err)
      return NextResponse.json(
        { error: 'Erreur lors de la configuration du serveur' },
        { status: 500 }
      )
    }

    // Générer un nom de fichier unique
    const fileExtension = file.name.split('.').pop()
    const uniqueName = `${uuidv4()}.${fileExtension}`
    const filePath = join(UPLOAD_DIR, uniqueName)
    const publicUrl = `/uploads/${uniqueName}`

    // Convertir le fichier en buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Sauvegarder le fichier
    await writeFile(filePath, buffer)

    const uploadResult = {
      id: uuidv4(),
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      uploadUrl: publicUrl,
      uploadedAt: new Date().toISOString()
    }

    console.log('✅ Fichier uploadé:', uploadResult)

    return NextResponse.json({ 
      success: true,
      url: uploadResult.uploadUrl,
      message: 'Fichier uploadé avec succès',
      file: uploadResult 
    })

  } catch (error: any) {
    console.error('❌ Upload error:', error)
    return NextResponse.json(
      { error: `Erreur lors de l'upload du fichier: ${error.message}` },
      { status: 500 }
    )
  }
}
