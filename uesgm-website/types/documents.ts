// Types manuels pour contourner les problèmes Prisma
export interface DocumentTag {
  id: string
  name: string
  documentId: string
}

export interface DocumentVersion {
  id: string
  fileUrl: string
  version: number
  createdAt: Date
  documentId: string
}

export interface Document {
  id: string
  title: string
  slug: string
  description?: string | null
  fileUrl: string
  fileName: string
  fileSize: number
  mimeType: string
  category: DocumentCategory
  visibility: DocumentVisibility
  version: number
  downloads: number
  isPublished: boolean
  createdAt: Date
  updatedAt: Date
  createdById: string
  tags: DocumentTag[]
  versions: DocumentVersion[]
}

export enum DocumentCategory {
  STATUTS = 'STATUTS',
  RAPPORTS = 'RAPPORTS',
  GUIDES = 'GUIDES',
  ACADEMIQUE = 'ACADEMIQUE',
  JURIDIQUE = 'JURIDIQUE',
  ADMINISTRATIF = 'ADMINISTRATIF'
}

export enum DocumentVisibility {
  PUBLIC = 'PUBLIC',
  MEMBERS_ONLY = 'MEMBERS_ONLY',
  ADMIN_ONLY = 'ADMIN_ONLY'
}
