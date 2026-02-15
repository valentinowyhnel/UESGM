// Données mockées partagées pour simuler une base de données
export interface Document {
  id: string
  title: string
  description: string
  category: string
  tags: string[]
  fileUrl: string
  fileName: string
  fileSize: number
  mimeType: string
  published: boolean
  uploadedById: string
  createdAt: Date
  updatedAt: Date
}

// Données initiales
export const mockDocuments: Document[] = [
  {
    id: '1',
    title: 'Rapport Annuel 2024.pdf',
    description: 'Rapport annuel complet des activités',
    category: 'rapports',
    tags: ['rapport', 'annuel', '2024'],
    fileUrl: '/uploads/documents/rapport-2024.pdf',
    fileName: 'rapport-2024.pdf',
    fileSize: 2048000,
    mimeType: 'application/pdf',
    published: true,
    uploadedById: 'admin-1',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15')
  },
  {
    id: '2',
    title: 'Guide Étudiant 2024.pdf',
    description: 'Guide complet pour les nouveaux étudiants',
    category: 'guides',
    tags: ['guide', 'étudiant', '2024'],
    fileUrl: '/uploads/documents/guide-etudiant-2024.pdf',
    fileName: 'guide-etudiant-2024.pdf',
    fileSize: 1536000,
    mimeType: 'application/pdf',
    published: false,
    uploadedById: 'admin-1',
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-02-01')
  }
]

// Fonctions utilitaires pour gérer les documents
export const documentService = {
  // Récupérer tous les documents
  getAll: () => mockDocuments,

  // Récupérer un document par ID
  getById: (id: string) => mockDocuments.find(doc => doc.id === id),

  // Ajouter un document
  add: (document: Document) => {
    mockDocuments.push(document)
    return document
  },

  // Mettre à jour un document
  update: (id: string, updates: Partial<Document>) => {
    const index = mockDocuments.findIndex(doc => doc.id === id)
    if (index === -1) return null
    
    mockDocuments[index] = { ...mockDocuments[index], ...updates, updatedAt: new Date() }
    return mockDocuments[index]
  },

  // Supprimer un document
  delete: (id: string) => {
    const index = mockDocuments.findIndex(doc => doc.id === id)
    if (index === -1) return null
    
    const deleted = mockDocuments[index]
    mockDocuments.splice(index, 1)
    return deleted
  }
}
