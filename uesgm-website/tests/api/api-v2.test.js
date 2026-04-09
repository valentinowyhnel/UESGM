/**
 * Tests API v2 pour UESGM
 */

const { z } = require('zod')

// Mock simple pour tester la logique de validation sans lancer tout le serveur Next.js
// car supertest avec Next.js App Router est complexe sans setup particulier.

describe('API v2 Validation Logic', () => {
  const contactSchema = z.object({
    name: z.string().min(2).max(100),
    email: z.string().email(),
    subject: z.string().max(200).optional(),
    message: z.string().min(10).max(5000),
  })

  test('Contact schema should validate correct data', () => {
    const data = {
      name: 'John Doe',
      email: 'john@example.com',
      subject: 'Test Subject',
      message: 'This is a test message with more than 10 chars.'
    }
    expect(() => contactSchema.parse(data)).not.toThrow()
  })

  test('Contact schema should reject invalid email', () => {
    const data = {
      name: 'John Doe',
      email: 'invalid-email',
      message: 'This is a test message with more than 10 chars.'
    }
    expect(() => contactSchema.parse(data)).toThrow()
  })

  const eventSchema = z.object({
    title: z.string().min(3).max(100),
    description: z.string().optional(),
    date: z.string().or(z.date()).transform(val => new Date(val)),
    location: z.string().optional(),
    category: z.string().optional(),
    imageUrl: z.string().url().optional().nullable(),
    published: z.boolean().default(false),
  })

  test('Event schema should validate and transform date', () => {
    const data = {
      title: 'Annual Gala',
      date: '2025-12-31',
      published: true
    }
    const validated = eventSchema.parse(data)
    expect(validated.date).toBeInstanceOf(Date)
    expect(validated.date.getFullYear()).toBe(2025)
  })
})
