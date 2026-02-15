import { getServerSession } from "next-auth"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import RealtimeStats from "@/components/admin/RealtimeStats"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Users,
    Calendar,
    FileText,
    LayoutDashboard,
    Settings,
    ShieldCheck,
    Database,
    Globe,
    PlusCircle,
    FileCode
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default async function SuperAdminDashboard() {
    const session = await getServerSession(authOptions)

    if (!session || (session.user as any).role !== "SUPER_ADMIN") {
        redirect("/login")
    }

    // Fetch real metrics
    const [userCount, eventCount, docCount, messageCount] = await Promise.all([
        prisma.user.count(),
        prisma.event.count(),
        prisma.document.count(),
        prisma.contactMessage.count({ where: { status: 'PENDING' } })
    ])

    return (
        <div className="space-y-8 max-w-7xl mx-auto p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-4xl font-bold font-montserrat text-slate-950 dark:text-white flex items-center gap-3">
                        <ShieldCheck className="w-10 h-10 text-gold" />
                        Console de Contrôle Suprême
                    </h1>
                    <p className="text-slate-500 mt-2">Bienvenue Monsieur le Président. Le système est sous votre contrôle total.</p>
                </div>
                <Badge variant="outline" className="text-gold border-gold px-4 py-2 font-bold bg-gold/5">
                    ACCÈS NIVEAU 5
                </Badge>
            </div>

            <RealtimeStats
                initialCensus={userCount}
                initialEvents={eventCount}
                initialDocs={docCount}
                initialMessages={messageCount}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Card className="lg:col-span-2 border-slate-200">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileCode className="w-5 h-5 text-primary" />
                            Actions Rapides de Maintenance
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <QuickAction icon={PlusCircle} label="Ajouter un Événement" href="/admin/evenements/new" />
                        <QuickAction icon={PlusCircle} label="Publier un Projet" href="/admin/projets/new" />
                        <QuickAction icon={PlusCircle} label="Uploader un Document" href="/admin/documents/new" />
                        <QuickAction icon={Settings} label="Paramètres du Site" href="/admin/settings" />
                    </CardContent>
                </Card>

                <Card className="border-gold/10 bg-gold/5">
                    <CardHeader>
                        <CardTitle className="text-gold-dark">Sécurité & Logs</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm">
                        <div className="flex justify-between items-center border-b border-gold/10 pb-2">
                            <span className="text-slate-600">Dernière sauvegarde</span>
                            <span className="font-bold">Il y a 2h</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-gold/10 pb-2">
                            <span className="text-slate-600">Tentatives de brute-force</span>
                            <Badge variant="secondary" className="bg-red-100 text-red-700">0</Badge>
                        </div>
                        <div className="flex justify-between items-center border-b border-gold/10 pb-2">
                            <span className="text-slate-600">Santé de la DB</span>
                            <span className="text-green-600 font-bold">Excellent</span>
                        </div>
                        <Button className="w-full bg-slate-900 text-white mt-4">
                            Consulter les Logs d'Audit
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

function ModalityCard({ title, count, icon: Icon, color, href }: any) {
    return (
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6">
                <div className="flex items-center gap-4">
                    <div className={`${color} p-3 rounded-xl text-white`}>
                        <Icon className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500">{title}</p>
                        <h3 className="text-2xl font-bold text-slate-900">{count}</h3>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

function QuickAction({ icon: Icon, label, href }: any) {
    return (
        <Button variant="outline" className="h-20 flex flex-col items-center justify-center gap-2 border-slate-200 hover:border-gold hover:text-gold-dark group" asChild>
            <a href={href}>
                <Icon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                {label}
            </a>
        </Button>
    )
}
