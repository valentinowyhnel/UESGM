'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase-client'

export function useRealtime(table: string, callback: (payload: any) => void) {
    useEffect(() => {
        // 1. Subscribe to changes
        const channel = supabase
            .channel(`realtime:${table}`)
            .on(
                'postgres_changes',
                {
                    event: '*', // Listen to INSERT, UPDATE, DELETE
                    schema: 'public',
                    table: table,
                },
                (payload) => {
                    console.log(`Realtime update on ${table}:`, payload)
                    callback(payload)
                }
            )
            .subscribe()

        // 2. Cleanup on unmount
        return () => {
            supabase.removeChannel(channel)
        }
    }, [table, callback])
}
