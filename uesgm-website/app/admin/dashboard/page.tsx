"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
    Users, Calendar, Download, TrendingUp, Mail, MessageSquare, 
    Activity, AlertTriangle, CheckCircle, Clock, BarChart3, 
    PieChart, UserPlus, Eye, Settings, Bell, Filter, Search,
    RefreshCw, Trash2, Archive, Star, Flag
} from "lucide-react"
import { toast } from 'sonner';

// Types pour les données
interface DashboardStats {
    totalMembers: number
    totalEvents: number
    totalMessages: number
    totalDownloads: number
    activeUsers: number
    systemHealth: 'healthy' | 'warning' | 'error'
}

interface RecentActivity {
    id: string
    type: 'user' | 'message' | 'event' | 'system'
    title: string
    description: string
    timestamp: Date
    status: 'success' | 'warning' | 'error'
}

interface ContactMessage {
    id: string
    name: string
    email: string
    subject: string
    message: string
    isRead: boolean
    createdAt: Date
    status: 'PENDING' | 'SENT' | 'FAILED' | 'SPAM'
}

export default function AdminDashboard() {
    const [stats, setStats] = useState<DashboardStats>({
        totalMembers: 0,
        totalEvents: 0,
        totalMessages: 0,
        totalDownloads: 0,
        activeUsers: 0,
        systemHealth: 'healthy'
    })
    
    const [recentMessages, setRecentMessages] = useState<ContactMessage[]>([])
    const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedTab, setSelectedTab] = useState("overview")

    // Charger les données du dashboard
    useEffect(() => {
        loadDashboardData()
        const interval = setInterval(loadDashboardData, 30000) // Rafraîchir toutes les 30s
        return () => clearInterval(interval)
    }, [])

    const loadDashboardData = async () => {
        try {
            setLoading(true)
            
            // Simuler les données (remplacer par des vrais appels API)
            const mockStats: DashboardStats = {
                totalMembers: 1247,
                totalEvents: 89,
                totalMessages: 456,
                totalDownloads: 1829,
                activeUsers: 234,
                systemHealth: 'healthy'
            }

            const mockMessages: ContactMessage[] = [
                {
                    id: '1',
                    name: 'Jean Dupont',
                    email: 'jean.dupont@email.com',
                    subject: 'Demande d\'information',
                    message: 'Bonjour, je souhaiterais obtenir plus d\'informations sur les adhésions...',
                    isRead: false,
                    createdAt: new Date(Date.now() - 1000 * 60 * 5), // 5 min ago
                    status: 'PENDING'
                },
                {
                    id: '2',
                    name: 'Marie Curie',
                    email: 'marie.curie@email.com',
                    subject: 'Proposition de partenariat',
                    message: 'Nous sommes une entreprise intéressée par un partenariat...',
                    isRead: true,
                    createdAt: new Date(Date.now() - 1000 * 60 * 15), // 15 min ago
                    status: 'SENT'
                },
                {
                    id: '3',
                    name: 'Paul Martin',
                    email: 'paul.martin@email.com',
                    subject: 'Question sur les événements',
                    message: 'Quels sont les prochains événements prévus ?',
                    isRead: false,
                    createdAt: new Date(Date.now() - 1000 * 60 * 60), // 1h ago
                    status: 'SPAM'
                }
            ]

            const mockActivity: RecentActivity[] = [
                {
                    id: '1',
                    type: 'message',
                    title: 'Nouveau message reçu',
                    description: 'Jean Dupont - Demande d\'information',
                    timestamp: new Date(Date.now() - 1000 * 60 * 5),
                    status: 'success'
                },
                {
                    id: '2',
                    type: 'user',
                    title: 'Nouveau membre inscrit',
                    description: 'Marie Curie a rejoint l\'UESGM',
                    timestamp: new Date(Date.now() - 1000 * 60 * 15),
                    status: 'success'
                },
                {
                    id: '3',
                    type: 'system',
                    title: 'Système mis à jour',
                    description: 'Version 2.1.0 déployée avec succès',
                    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
                    status: 'success'
                }
            ]

            setStats(mockStats)
            setRecentMessages(mockMessages)
            setRecentActivity(mockActivity)
        } catch (error) {
            toast.error("Erreur lors du chargement des données")
            console.error("Dashboard error:", error)
        } finally {
            setLoading(false)
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'success': return 'bg-green-100 text-green-800'
            case 'warning': return 'bg-yellow-100 text-yellow-800'
            case 'error': return 'bg-red-100 text-red-800'
            default: return 'bg-gray-100 text-gray-800'
        }
    }

    const getSystemHealthColor = (health: string) => {
        switch (health) {
            case 'healthy': return 'text-green-600 bg-green-100'
            case 'warning': return 'text-yellow-600 bg-yellow-100'
            case 'error': return 'text-red-600 bg-red-100'
            default: return 'text-gray-600 bg-gray-100'
        }
    }

    const markMessageAsRead = async (messageId: string) => {
        try {
            // Appeler l'API pour marquer comme lu
            setRecentMessages(prev => 
                prev.map(msg => 
                    msg.id === messageId ? { ...msg, isRead: true } : msg
                )
            )
            toast.success("Message marqué comme lu")
        } catch (error) {
            toast.error("Erreur lors de la mise à jour")
        }
    }

    const deleteMessage = async (messageId: string) => {
        try {
            // Appeler l'API pour supprimer
            setRecentMessages(prev => prev.filter(msg => msg.id !== messageId))
            toast.success("Message supprimé")
        } catch (error) {
            toast.error("Erreur lors de la suppression")
        }
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold font-montserrat text-slate-900 dark:text-white">
                        Console de Gestion
                    </h1>
                    <p className="text-slate-500 mt-1">
                        Panneau d'administration UESGM - Gestion en temps réel
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => loadDashboardData()}
                        disabled={loading}
                    >
                        <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        Actualiser
                    </Button>
                    <Button variant="outline" size="sm">
                        <Settings className="w-4 h-4 mr-2" />
                        Paramètres
                    </Button>
                </div>
            </div>

            <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="overview">Aperçu</TabsTrigger>
                    <TabsTrigger value="messages">Messages</TabsTrigger>
                    <TabsTrigger value="analytics">Analytiques</TabsTrigger>
                    <TabsTrigger value="system">Système</TabsTrigger>
                </TabsList>

                {/* Tab Aperçu */}
                <TabsContent value="overview" className="space-y-6">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <StatCard 
                            title="Membres Total" 
                            value={stats.totalMembers.toLocaleString()} 
                            icon={Users} 
                            trend="+12%" 
                            subtitle="Nouveaux ce mois"
                        />
                        <StatCard 
                            title="Événements" 
                            value={stats.totalEvents.toString()} 
                            icon={Calendar} 
                            trend="+2" 
                            subtitle="Prochains événements"
                        />
                        <StatCard 
                            title="Messages" 
                            value={stats.totalMessages.toString()} 
                            icon={Mail} 
                            trend="+25%" 
                            subtitle="Non lus: 3"
                        />
                        <StatCard 
                            title="Téléchargements" 
                            value={stats.totalDownloads.toLocaleString()} 
                            icon={Download} 
                            trend="+18%" 
                            subtitle="Cette semaine"
                        />
                    </div>

                    {/* Activity and System Status */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Activités Récentes */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle>Activités Récentes</CardTitle>
                                <Activity className="w-5 h-5 text-slate-400" />
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {recentActivity.slice(0, 5).map((activity) => (
                                        <div key={activity.id} className="flex items-start gap-3 pb-3 border-b last:border-0">
                                            <div className={`w-2 h-2 rounded-full mt-2 ${
                                                activity.status === 'success' ? 'bg-green-500' :
                                                activity.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                                            }`} />
                                            <div className="flex-1">
                                                <p className="font-medium text-sm">{activity.title}</p>
                                                <p className="text-xs text-slate-500">{activity.description}</p>
                                                <p className="text-xs text-slate-400 mt-1">
                                                    {activity.timestamp.toLocaleString('fr-FR')}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* État du Système */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle>État du Système</CardTitle>
                                <div className={`px-2 py-1 rounded-full text-xs font-medium ${getSystemHealthColor(stats.systemHealth)}`}>
                                    {stats.systemHealth === 'healthy' ? 'Opérationnel' :
                                     stats.systemHealth === 'warning' ? 'Attention' : 'Critique'}
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm">Base de données</span>
                                        <span className="text-green-600 font-bold text-sm bg-green-100 px-2 py-1 rounded">
                                            Opérationnel
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm">API Server</span>
                                        <span className="text-green-600 font-bold text-sm bg-green-100 px-2 py-1 rounded">
                                            Opérationnel
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm">Stockage (S3)</span>
                                        <span className="text-green-600 font-bold text-sm bg-green-100 px-2 py-1 rounded">
                                            78% utilisé
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm">Emails (Resend)</span>
                                        <span className="text-green-600 font-bold text-sm bg-green-100 px-2 py-1 rounded">
                                            Opérationnel
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm">API Contact</span>
                                        <span className="text-green-600 font-bold text-sm bg-green-100 px-2 py-1 rounded">
                                            Production-ready
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* Tab Messages */}
                <TabsContent value="messages" className="space-y-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                                <MessageSquare className="w-5 h-5" />
                                Messages Contact
                            </CardTitle>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm">
                                    <Filter className="w-4 h-4 mr-2" />
                                    Filtrer
                                </Button>
                                <Button variant="outline" size="sm">
                                    <Search className="w-4 h-4 mr-2" />
                                    Rechercher
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {recentMessages.map((message) => (
                                    <div key={message.id} className="border rounded-lg p-4 space-y-3">
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <h3 className="font-semibold">{message.name}</h3>
                                                    <Badge variant={message.isRead ? "secondary" : "default"}>
                                                        {message.isRead ? 'Lu' : 'Non lu'}
                                                    </Badge>
                                                    <Badge 
                                                        variant={message.status === 'PENDING' ? 'secondary' : 
                                                                 message.status === 'SENT' ? 'default' :
                                                                 message.status === 'SPAM' ? 'destructive' : 'secondary'}
                                                    >
                                                        {message.status}
                                                    </Badge>
                                                </div>
                                                <p className="text-sm text-slate-600 mb-1">{message.email}</p>
                                                <p className="font-medium mb-2">{message.subject}</p>
                                                <p className="text-sm text-slate-700 line-clamp-2">{message.message}</p>
                                                <p className="text-xs text-slate-400 mt-2">
                                                    {message.createdAt.toLocaleString('fr-FR')}
                                                </p>
                                            </div>
                                            <div className="flex gap-1 ml-4">
                                                {!message.isRead && (
                                                    <Button 
                                                        variant="outline" 
                                                        size="sm"
                                                        onClick={() => markMessageAsRead(message.id)}
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </Button>
                                                )}
                                                <Button variant="outline" size="sm">
                                                    <Archive className="w-4 h-4" />
                                                </Button>
                                                <Button 
                                                    variant="outline" 
                                                    size="sm"
                                                    onClick={() => deleteMessage(message.id)}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Tab Analytics */}
                <TabsContent value="analytics" className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <BarChart3 className="w-5 h-5" />
                                    Évolution des Messages
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="h-64 flex items-center justify-center text-slate-400">
                                    Graphique d'évolution (à implémenter)
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <PieChart className="w-5 h-5" />
                                    Répartition par Catégorie
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="h-64 flex items-center justify-center text-slate-400">
                                    Graphique circulaire (à implémenter)
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* Tab System */}
                <TabsContent value="system" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Informations Système</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <h3 className="font-semibold">Performance</h3>
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-sm">Temps de réponse API</span>
                                            <span className="text-sm font-medium">45ms</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm">Utilisation CPU</span>
                                            <span className="text-sm font-medium">23%</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm">Mémoire utilisée</span>
                                            <span className="text-sm font-medium">1.2GB / 4GB</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <h3 className="font-semibold">Services</h3>
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-sm">Base de données</span>
                                            <span className="text-green-600 text-sm">✓ Connectée</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm">Email service</span>
                                            <span className="text-green-600 text-sm">✓ Opérationnel</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm">Stockage</span>
                                            <span className="text-green-600 text-sm">✓ Disponible</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}

function StatCard({ 
    title, 
    value, 
    icon: Icon, 
    trend, 
    subtitle 
}: { 
    title: string, 
    value: string, 
    icon: any, 
    trend: string, 
    subtitle?: string 
}) {
    return (
        <Card>
            <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                        <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-xs text-green-600 font-medium bg-green-50 px-2 py-1 rounded-full">
                        {trend} vs mois dernier
                    </span>
                </div>
                <div>
                    <p className="text-sm font-medium text-slate-500">{title}</p>
                    <h3 className="text-2xl font-bold mt-1 text-slate-900">{value}</h3>
                    {subtitle && (
                        <p className="text-xs text-slate-400 mt-1">{subtitle}</p>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
