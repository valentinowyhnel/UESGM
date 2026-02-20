/**
 * @file app/api/sse/documents/route.ts
 * 
 * SSE Endpoint for real-time document updates
 * Clients connect to this endpoint to receive live updates when admin modifies documents
 */

import { getDocumentEvents } from '@/lib/sse'
import { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  // Create a readable stream for SSE
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder()
      const emitter = getDocumentEvents()
      
      // Send initial connection message
      const initialMessage = `data: ${JSON.stringify({ 
        type: 'connected', 
        message: 'Connecté aux mises à jour en temps réel',
        timestamp: new Date().toISOString()
      })}\n\n`
      controller.enqueue(encoder.encode(initialMessage))
      
      // Event handlers
      const handleEvent = (data: any) => {
        try {
          const message = `data: ${JSON.stringify(data)}\n\n`
          controller.enqueue(encoder.encode(message))
        } catch (error) {
          console.error('Error sending SSE event:', error)
        }
      }
      
      // Listen to all document events
      emitter.on('document:any', handleEvent)
      
      // Also listen to specific events for more granular control
      emitter.on('document:created', handleEvent)
      emitter.on('document:updated', handleEvent)
      emitter.on('document:deleted', handleEvent)
      emitter.on('document:published', handleEvent)
      emitter.on('document:unpublished', handleEvent)
      
      // Heartbeat to keep connection alive (every 30 seconds)
      const heartbeatInterval = setInterval(() => {
        try {
          const heartbeat = `data: ${JSON.stringify({ 
            type: 'heartbeat', 
            timestamp: new Date().toISOString()
          })}\n\n`
          controller.enqueue(encoder.encode(heartbeat))
        } catch {
          // Connection closed
          clearInterval(heartbeatInterval)
        }
      }, 30000)
      
      // Cleanup on close
      request.signal.addEventListener('abort', () => {
        clearInterval(heartbeatInterval)
        emitter.off('document:any', handleEvent)
        emitter.off('document:created', handleEvent)
        emitter.off('document:updated', handleEvent)
        emitter.off('document:deleted', handleEvent)
        emitter.off('document:published', handleEvent)
        emitter.off('document:unpublished', handleEvent)
        
        try {
          controller.close()
        } catch {
          // Already closed
        }
        console.log('🔌 Client déconnecté du flux SSE')
      })
    }
  })
  
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',  // Disable nginx buffering
    },
  })
}
