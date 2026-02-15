// Système de synchronisation en temps réel entre client et admin
import React from 'react'
import { Document } from './mock-data'

// Événements de synchronisation
export type SyncEvent = 
  | { type: 'DOCUMENT_CREATED', data: Document }
  | { type: 'DOCUMENT_UPDATED', data: Document }
  | { type: 'DOCUMENT_DELETED', data: { id: string } }
  | { type: 'DOCUMENTS_REFRESHED', data: Document[] }

// Écouteurs d'événements
type SyncListener = (event: SyncEvent) => void

class RealtimeSync {
  private listeners: SyncListener[] = []
  private static instance: RealtimeSync

  private constructor() {}

  public static getInstance(): RealtimeSync {
    if (!RealtimeSync.instance) {
      RealtimeSync.instance = new RealtimeSync()
    }
    return RealtimeSync.instance
  }

  // Ajouter un écouteur d'événements
  public addListener(listener: SyncListener) {
    this.listeners.push(listener)
  }

  // Retirer un écouteur d'événements
  public removeListener(listener: SyncListener) {
    const index = this.listeners.indexOf(listener)
    if (index > -1) {
      this.listeners.splice(index, 1)
    }
  }

  // Émettre un événement à tous les écouteurs
  public emit(event: SyncEvent) {
    console.log('🔄 Événement de synchronisation:', event.type, event.data)
    
    this.listeners.forEach(listener => {
      try {
        listener(event)
      } catch (error) {
        console.error('❌ Erreur dans l écouteur de synchronisation:', error)
      }
    })

    // Émettre un événement DOM pour les composants React
    window.dispatchEvent(new CustomEvent('document-sync', { 
      detail: event 
    }))
  }

  // Synchroniser la création d'un document
  public documentCreated(document: Document) {
    this.emit({ type: 'DOCUMENT_CREATED', data: document })
  }

  // Synchroniser la mise à jour d'un document
  public documentUpdated(document: Document) {
    this.emit({ type: 'DOCUMENT_UPDATED', data: document })
  }

  // Synchroniser la suppression d'un document
  public documentDeleted(documentId: string) {
    this.emit({ type: 'DOCUMENT_DELETED', data: { id: documentId } })
  }

  // Synchroniser le rafraîchissement de tous les documents
  public documentsRefreshed(documents: Document[]) {
    this.emit({ type: 'DOCUMENTS_REFRESHED', data: documents })
  }
}

export const realtimeSync = RealtimeSync.getInstance()

// Hook React pour utiliser la synchronisation en temps réel
export function useRealtimeSync(callback: (event: SyncEvent) => void) {
  React.useEffect(() => {
    // Ajouter l'écouteur
    realtimeSync.addListener(callback)

    // Nettoyer lors du démontage
    return () => {
      realtimeSync.removeListener(callback)
    }
  }, [callback])
}
