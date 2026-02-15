'use client'

import { useState, useCallback, useEffect } from "react"
import { useRealtime } from "@/hooks/use-realtime"
import { Users, Calendar, FileText, Bell } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface StatsProps {
    initialCensus: number
    initialEvents: number
    initialDocs: number
    initialMessages: number
}

/**
 * Component that updates counts in real-time when DB changes
 */
export default function RealtimeStats({
    initialCensus,
    initialEvents,
    initialDocs,
    initialMessages
}: StatsProps) {
    const router = useRouter()
    const [stats, setStats] = useState({
        census: initialCensus,
        events: initialEvents,
        docs: initialDocs,
        messages: initialMessages
    })

    // Listen for Census changes
    useRealtime('Census', (payload: any) => {
        if (payload.eventType === 'INSERT') {
            setStats(prev => ({ ...prev, census: prev.census + 1 }))
            toast.success(`Nouveau recensement ! ${payload.new.fullName}`)
        } else if (payload.eventType === 'DELETE') {
            setStats(prev => ({ ...prev, census: prev.census - 1 }))
        }
    })

    // Listen for Event changes
    useRealtime('Event', () => {
        // Refresh page to sync complex data
        router.refresh()
    })

    // Listen for new messages
    useRealtime('ContactMessage', (payload: any) => {
        if (payload.eventType === 'INSERT') {
            setStats(prev => ({ ...prev, messages: prev.messages + 1 }))
            toast.info(`Nouveau message reçu de ${payload.new.name}`)
        }
    })

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatItem
                title="Recensement Étudiant"
                count={stats.census}
                icon={Users}
                color="bg-blue-500"
            />
            <StatItem
                title="Événements Nationaux"
                count={stats.events}
                icon={Calendar}
                color="bg-green-500"
            />
            <StatItem
                title="Bibliothèque"
                count={stats.docs}
                icon={FileText}
                color="bg-purple-500"
            />
            <StatItem
                title="Nouveaux Messages"
                count={stats.messages}
                icon={Bell}
                color="bg-gold-dark"
                badge={stats.messages > 0 ? stats.messages : undefined}
            />
        </div>
    )
}

function StatItem({ title, count, icon: Icon, color, badge }: any) {
    return (
        <Card className="hover:shadow-md transition-shadow cursor-default border-slate-200">
            <CardContent className="p-6">
                <div className="flex items-center gap-4">
                    <div className={`${color} p-3 rounded-xl text-white relative`}>
                        <Icon className="w-6 h-6" />
                        {badge && (
                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center border-2 border-white animate-pulse">
                                {badge}
                            </span>
                        )}
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500">{title}</p>
                        <h3 className="text-2xl font-bold text-slate-900">{count.toLocaleString()}</h3>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
