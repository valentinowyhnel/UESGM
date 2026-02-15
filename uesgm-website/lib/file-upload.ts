import { v4 as uuidv4 } from 'uuid'

const ALLOWED_MIME_TYPES = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'application/pdf': 'pdf',
}

const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5MB
const MAX_PDF_SIZE = 20 * 1024 * 1024 // 20MB

/**
 * Validate an uploaded file
 */
export async function validateUpload(file: File) {
    // 1. Check MIME type
    const extension = ALLOWED_MIME_TYPES[file.type as keyof typeof ALLOWED_MIME_TYPES]
    if (!extension) {
        throw new Error("Type de fichier non autorisé. Utilisez JPEG, PNG, WebP ou PDF.")
    }

    // 2. Check size
    const maxSize = file.type.startsWith('image/') ? MAX_IMAGE_SIZE : MAX_PDF_SIZE
    if (file.size > maxSize) {
        throw new Error(`Fichier trop lourd. Maximum ${maxSize / (1024 * 1024)}MB autorisé.`)
    }

    // 3. Generate secure filename
    const secureName = `${uuidv4()}.${extension}`

    return { secureName, extension }
}
