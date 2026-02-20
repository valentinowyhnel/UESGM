import { NextRequest } from 'next/server'
import { getEventEvents } from '@/lib/sse'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    start(controller) {
      const emitter = getEventEvents()

      // Send initial connection message
      controller.enqueue(encoder.encode(': Connected to events SSE\n\n'))

      // Handle incoming events
      const handleEvent = (eventData: any) => {
        try {
          const message = `event: ${eventData.type}\ndata: ${JSON.stringify(eventData)}\n\n`
          controller.enqueue(encoder.encode(message))
        } catch (error) {
          console.error('Error sending event:', error)
        }
      }

      // Subscribe to all event types
      emitter.on('event:created', handleEvent)
      emitter.on('event:updated', handleEvent)
      emitter.on('event:deleted', handleEvent)
      emitter.on('event:published', handleEvent)
      emitter.on('event:unpublished', handleEvent)
      emitter.on('event:any', handleEvent)

      // Keep connection alive with heartbeat
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': heartbeat\n\n'))
        } catch {
          clearInterval(heartbeat)
        }
      }, 30000)

      // Cleanup on close
      req.signal.addEventListener('abort', () => {
        clearInterval(heartbeat)
        emitter.off('event:created', handleEvent)
        emitter.off('event:updated', handleEvent)
        emitter.off('event:deleted', handleEvent)
        emitter.off('event:published', handleEvent)
        emitter.off('event:unpublished', handleEvent)
        emitter.off('event:any', handleEvent)
        controller.close()
      })
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  })
}
