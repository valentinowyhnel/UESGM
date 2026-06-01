import { z } from 'zod'
import { Role, EventStatus, EventCategory, ProjectStatus, ProjectCategory, DocumentCategory, DocumentVisibility, PartnerType } from '@prisma/client'

// ============================================
// COMMON SCHEMAS
// ============================================

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().optional(),
})

export const slugSchema = z.string()
  .min(3)
  .max(100)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug invalide')

// ============================================
// EVENT SCHEMAS
// ============================================

export const createEventSchema = z.object({
  title: z.string().min(3).max(200),
  slug: slugSchema.optional(),
  description: z.string().min(5),
  location: z.string().min(2).max(200),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),
  category: z.nativeEnum(EventCategory),
  status: z.nativeEnum(EventStatus).default(EventStatus.DRAFT),
  imageUrl: z.string().url().optional().or(z.literal('')),
  maxAttendees: z.number().int().positive().optional(),
})

export const updateEventSchema = createEventSchema.partial()

// ============================================
// PROJECT SCHEMAS
// ============================================

export const createProjectSchema = z.object({
  title: z.string().min(3).max(200),
  slug: slugSchema.optional(),
  description: z.string().min(5),
  shortDesc: z.string().max(500),
  category: z.nativeEnum(ProjectCategory),
  status: z.nativeEnum(ProjectStatus).default(ProjectStatus.PLANNED),
  progress: z.number().int().min(0).max(100).default(0),
  imageUrl: z.string().url().optional().or(z.literal('')),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  isPublished: z.boolean().default(false)
})

export const updateProjectSchema = createProjectSchema.partial()

// ============================================
// DOCUMENT SCHEMAS
// ============================================

export const createDocumentSchema = z.object({
  title: z.string().min(3).max(200),
  slug: slugSchema.optional(),
  description: z.string().max(1000).optional(),
  category: z.nativeEnum(DocumentCategory),
  visibility: z.nativeEnum(DocumentVisibility).default(DocumentVisibility.PUBLIC),
  canDownload: z.boolean().default(true),
  fileUrl: z.string().url(),
  fileName: z.string(),
  fileSize: z.number().int().positive(),
  mimeType: z.string(),
  isPublished: z.boolean().default(false)
})

export const updateDocumentSchema = createDocumentSchema.partial()

// ============================================
// EXECUTIVE MEMBER SCHEMAS
// ============================================

export const createExecutiveMemberSchema = z.object({
  name: z.string().min(2).max(100),
  position: z.string().min(2).max(100),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  photo: z.string().url().optional().or(z.literal('')),
  bio: z.string().optional(),
  order: z.number().int().default(0),
  facebook: z.string().url().optional().or(z.literal('')),
  linkedin: z.string().url().optional().or(z.literal('')),
  isActive: z.boolean().default(true)
})

export const updateExecutiveMemberSchema = createExecutiveMemberSchema.partial()

// ============================================
// PARTNER SCHEMAS
// ============================================

export const createPartnerSchema = z.object({
  name: z.string().min(2).max(100),
  type: z.nativeEnum(PartnerType),
  logo: z.string().url().optional().or(z.literal('')),
  website: z.string().url().optional().or(z.literal('')),
  description: z.string().optional(),
  order: z.number().int().default(0),
  isActive: z.boolean().default(true)
})

export const updatePartnerSchema = createPartnerSchema.partial()

// ============================================
// CONTACT SCHEMAS
// ============================================

export const createContactMessageSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  subject: z.string().min(5).max(200).optional(),
  message: z.string().min(10).max(2000),
})
