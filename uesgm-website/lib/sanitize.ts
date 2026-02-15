import createDOMPurify from 'dompurify'
import { JSDOM } from 'jsdom'

const window = new JSDOM('').window
const DOMPurify = createDOMPurify(window)

/**
 * Sanitize a string to prevent XSS attacks
 */
export function sanitizeHtml(html: string): string {
    return DOMPurify.sanitize(html, {
        ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li'],
        ALLOWED_ATTR: ['href', 'target', 'rel']
    })
}

/**
 * Strips all HTML tags from a string
 */
export function stripHtml(text: string): string {
    return DOMPurify.sanitize(text, { ALLOWED_TAGS: [] })
}

/**
 * Recursively sanitize an object's string properties
 */
export function sanitizeObject<T>(obj: T): T {
    if (typeof obj !== 'object' || obj === null) return obj

    const result = { ...obj } as any

    for (const key in result) {
        if (typeof result[key] === 'string') {
            result[key] = stripHtml(result[key])
        } else if (typeof result[key] === 'object') {
            result[key] = sanitizeObject(result[key])
        }
    }

    return result
}
