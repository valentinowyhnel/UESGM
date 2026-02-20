/**
 * @file lib/sse.ts
 * 
 * Server-Sent Events (SSE) manager for real-time updates
 * Used for: When admin modifies documents/events, client pages auto-update
 */

import { EventEmitter } from 'events'

// Global event emitter for SSE - Documents
declare global {
  var documentEvents: EventEmitter | undefined
  var eventEvents: EventEmitter | undefined
}

// Get or create the global event emitter for documents
function getDocumentEvents(): EventEmitter {
  if (!global.documentEvents) {
    global.documentEvents = new EventEmitter()
    // Increase limit for many concurrent connections
    global.documentEvents.setMaxListeners(1000)
  }
  return global.documentEvents
}

// Get or create the global event emitter for events
function getEventEvents(): EventEmitter {
  if (!global.eventEvents) {
    global.eventEvents = new EventEmitter()
    global.eventEvents.setMaxListeners(1000)
  }
  return global.eventEvents
}

export { getDocumentEvents, getEventEvents }

// Event types for Documents
export type DocumentEventType = 
  | 'document:created' 
  | 'document:updated' 
  | 'document:deleted' 
  | 'document:published' 
  | 'document:unpublished'

// Event types for Events
export type AdminEventEventType = 
  | 'event:created' 
  | 'event:updated' 
  | 'event:deleted' 
  | 'event:published' 
  | 'event:unpublished'

// Document Event payload
export interface DocumentEventPayload {
  id: string
  title?: string
  slug?: string
  isPublished?: boolean
  category?: string
  updatedAt: string
}

// Admin Event payload
export interface AdminEventEventPayload {
  id: string
  title?: string
  slug?: string
  status?: string
  category?: string
  startDate?: string
  updatedAt: string
}

// Publish a document event to all connected clients
export function emitDocumentEvent(
  eventType: DocumentEventType, 
  payload: DocumentEventPayload
) {
  const emitter = getDocumentEvents()
  const eventData = {
    type: eventType,
    payload,
    timestamp: new Date().toISOString()
  }
  
  // Emit to all listeners
  emitter.emit(eventType, eventData)
  emitter.emit('document:any', eventData)
  
  console.log(`📡 SSE Event emitted: ${eventType}`, payload)
}

// Publish an admin event (event creation/update) to all connected clients
export function emitAdminEventEvent(
  eventType: AdminEventEventType, 
  payload: AdminEventEventPayload
) {
  const emitter = getEventEvents()
  const eventData = {
    type: eventType,
    payload,
    timestamp: new Date().toISOString()
  }
  
  // Emit to all listeners
  emitter.emit(eventType, eventData)
  emitter.emit('event:any', eventData)
  
  console.log(`📡 SSE Event emitted: ${eventType}`, payload)
}

// Utility function to create SSE response
export function createSSEResponse(
  controller: ReadableStreamDefaultController,
  eventType: string,
  data: object
) {
  const message = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`
  controller.enqueue(new TextEncoder().encode(message))
}
