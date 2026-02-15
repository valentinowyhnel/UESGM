import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth, logAdminAction } from '@/lib/admin-events-security'

// Configuration pour l'upload
const UPLOAD_CONFIG = {
  maxSize: 5 * 1024 * 1024, // 5MB
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
  uploadDir: '/uploads/events/'
}

// Validation du fichier
function validateFile(file: File) {
  if (!file) {
    return { valid: false, error: 'Aucun fichier fourni' }
  }

  if (file.size > UPLOAD_CONFIG.maxSize) {
    return { valid: false, error: 'Le fichier est trop volumineux (max 5MB)' }
  }

  if (!UPLOAD_CONFIG.allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Type de fichier non autorisé (JPEG, PNG, WebP uniquement)' }
  }

  return { valid: true }
}

// Génération d'un nom de fichier unique
function generateFileName(originalName: string): string {
  const timestamp = Date.now()
  const randomString = Math.random().toString(36).substring(2, 8)
  const extension = originalName.split('.').pop()
  return `event-${timestamp}-${randomString}.${extension}`
}

// POST - Upload d'image pour événement
export const POST = withAdminAuth(async (req: NextRequest, user) => {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File

    // Validation du fichier
    const validation = validateFile(file)
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }

    // Génération du nom de fichier
    const fileName = generateFileName(file.name)
    const fileUrl = `${UPLOAD_CONFIG.uploadDir}${fileName}`

    // En production, vous devriez uploader vers un service de stockage
    // comme AWS S3, Cloudinary, ou Supabase Storage
    // Pour l'instant, nous simulons l'upload
    
    // Simulation de l'upload du fichier
    const buffer = await file.arrayBuffer()
    console.log(`📁 Upload simulé: ${fileName} (${file.size} bytes)`)
    
    // En production, vous feriez quelque chose comme:
    // await storageService.upload(fileName, buffer, file.type)
    // const publicUrl = await storageService.getPublicUrl(fileName)

    // Logging de l'action
    await logAdminAction(
      user.id,
      'UPLOAD',
      'event-image',
      fileName,
      { 
        originalName: file.name,
        size: file.size,
        type: file.type,
        url: fileUrl
      }
    )

    return NextResponse.json({
      success: true,
      message: 'Image uploadée avec succès',
      file: {
        name: fileName,
        originalName: file.name,
        size: file.size,
        type: file.type,
        url: fileUrl
      }
    })

  } catch (error: any) {
    console.error('POST upload error:', error)
    return NextResponse.json(
      { error: 'Erreur lors de l\'upload de l\'image' },
      { status: 500 }
    )
  }
})

// GET - Récupérer les informations sur les capacités d'upload
export const GET = withAdminAuth(async (req: NextRequest, user) => {
  return NextResponse.json({
    config: {
      maxSize: UPLOAD_CONFIG.maxSize,
      maxSizeMB: UPLOAD_CONFIG.maxSize / (1024 * 1024),
      allowedTypes: UPLOAD_CONFIG.allowedTypes,
      allowedExtensions: UPLOAD_CONFIG.allowedTypes.map(type => type.split('/')[1])
    }
  })
})
