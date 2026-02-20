/**
 * Validation Schemas
 * 
 * Centralized Zod schemas for API request validation.
 * Provides type-safe validation for all admin API routes.
 */

import { z } from 'zod'

// ============================================
// COMMON SCHEMAS
// ============================================

/**
 * Pagination params schema
 */
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().optional(),
})

/**
 * UUID schema
 */
export const uuidSchema = z.string().uuid({
  message: 'ID invalide'
})

/**
 * Slug schema
 */
export const slugSchema = z.string()
  .min(3)
  .max(100)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug invalide')

// ============================================
// PROJECT SCHEMAS
// ============================================

/**
 * Project category enum
 */
export const projectCategorySchema = z.enum([
  'EDUCATION',
  'SOCIAL', 
  'HEALTH',
  'DIGITAL',
  'PARTNERSHIP'
])

/**
 * Project status enum
 */
export const projectStatusSchema = z.enum([
  'PLANNED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED'
])

/**
 * Create project schema
 */
export const createProjectSchema = z.object({
  title: z.string().min(3).max(200),
  slug: slugSchema.optional(),
  description: z.string().min(5).max(5000),
  shortDesc: z.string().max(500).optional(),
  category: projectCategorySchema,
  status: projectStatusSchema.default('PLANNED'),
  progress: z.number().int().min(0).max(100).default(0),
  imageUrl: z.string().url().optional().or(z.literal('')),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  isPublished: z.boolean().default(false)
})

/**
 * Update project schema
 */
export const updateProjectSchema = createProjectSchema.partial().extend({
  title: z.string().min(3).max(200).optional()
})

/**
 * Project filter schema
 */
export const projectFilterSchema = paginationSchema.extend({
  status: projectStatusSchema.optional(),
  category: projectCategorySchema.optional()
})

// ============================================
// EVENT SCHEMAS
// ============================================

/**
 * Event category enum
 */
export const eventCategorySchema = z.enum([
  'CULTURAL',
  'SPORT',
  'EDUCATIONAL',
  'SOCIAL',
  'NETWORKING',
  'OTHER'
])

/**
 * Event status enum
 */
export const eventStatusSchema = z.enum([
  'DRAFT',
  'PUBLISHED',
  'CANCELLED'
])

/**
 * Create event schema
 */
export const createEventSchema = z.object({
  title: z.string().min(3).max(200),
  slug: slugSchema.optional(),
  description: z.string().min(5).max(5000),
  date: z.string().datetime(),
  endDate: z.string().datetime().optional(),
  location: z.string().min(2).max(200),
  category: eventCategorySchema,
  imageUrl: z.string().url().optional().or(z.literal('')),
  maxParticipants: z.number().int().positive().optional(),
  isPublished: z.boolean().default(false)
})

/**
 * Update event schema
 */
export const updateEventSchema = createEventSchema.partial()

/**
 * Event filter schema
 */
export const eventFilterSchema = paginationSchema.extend({
  status: eventStatusSchema.optional(),
  category: eventCategorySchema.optional()
})

// ============================================
// DOCUMENT SCHEMAS
// ============================================

/**
 * Document category enum
 */
export const documentCategorySchema = z.enum([
  'STATUTS',
  'RAPPORT',
  'GUIDE',
  'LIVRE',
  'ARTICLE',
  'ACADEMIQUE',
  'JURIDIQUE',
  'ADMINISTRATIF'
])

/**
 * Document visibility enum
 */
export const documentVisibilitySchema = z.enum([
  'PUBLIC',
  'MEMBERS_ONLY',
  'ADMIN_ONLY'
])

/**
 * Create document schema
 */
export const createDocumentSchema = z.object({
  title: z.string().min(3).max(200),
  slug: slugSchema.optional(),
  description: z.string().max(1000).optional(),
  category: documentCategorySchema,
  visibility: documentVisibilitySchema.default('PUBLIC'),
  canDownload: z.boolean().default(true),
  fileUrl: z.string().url(),
  fileName: z.string().optional(),
  mimeType: z.string().optional(),
  fileSize: z.number().int().positive().optional(),
  tags: z.array(z.string()).optional(),
  published: z.boolean().default(false)
})

/**
 * Update document schema
 */
export const updateDocumentSchema = createDocumentSchema.partial()

/**
 * Document filter schema
 */
export const documentFilterSchema = paginationSchema.extend({
  category: documentCategorySchema.optional(),
  visibility: documentVisibilitySchema.optional()
})

// ============================================
// ANTENNA SCHEMAS
// ============================================

/**
 * Create antenna schema
 */
export const createAntennaSchema = z.object({
  city: z.string().min(2).max(100),
  name: z.string().min(2).max(200).optional(),
  responsable: z.string().min(2).max(100),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional()
})

/**
 * Update antenna schema
 */
export const updateAntennaSchema = createAntennaSchema.partial()

// ============================================
// USER SCHEMAS
// ============================================

/**
 * User role enum
 */
export const userRoleSchema = z.enum([
  'MEMBER',
  'ADMIN',
  'SUPER_ADMIN'
])

/**
 * Update user role schema
 */
export const updateUserRoleSchema = z.object({
  role: userRoleSchema
})

// ============================================
// NEWSLETTER SCHEMAS
// ============================================

/**
 * Send newsletter schema
 */
export const sendNewsletterSchema = z.object({
  subject: z.string().min(5).max(200),
  content: z.string().min(20),
  recipientEmails: z.array(z.string().email()).optional(),
  segment: z.enum(['all', 'members', 'admins']).default('all')
})

// ============================================
// TYPE EXPORTS
// ============================================

export type PaginationParams = z.infer<typeof paginationSchema>
export type CreateProject = z.infer<typeof createProjectSchema>
export type UpdateProject = z.infer<typeof updateProjectSchema>
export type ProjectFilter = z.infer<typeof projectFilterSchema>
export type CreateEvent = z.infer<typeof createEventSchema>
export type UpdateEvent = z.infer<typeof updateEventSchema>
export type EventFilter = z.infer<typeof eventFilterSchema>
export type CreateDocument = z.infer<typeof createDocumentSchema>
export type UpdateDocument = z.infer<typeof updateDocumentSchema>
export type DocumentFilter = z.infer<typeof documentFilterSchema>
export type CreateAntenna = z.infer<typeof createAntennaSchema>
export type UpdateAntenna = z.infer<typeof updateAntennaSchema>
export type SendNewsletter = z.infer<typeof sendNewsletterSchema>
