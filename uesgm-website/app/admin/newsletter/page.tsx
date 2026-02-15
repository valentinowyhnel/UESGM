"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
    Mail, Send, Users, Eye, Search, Filter, Plus, Trash2, 
    Calendar, Clock, TrendingUp, BarChart3, RefreshCw, Edit,
    CheckCircle, XCircle, AlertCircle, MailOpen
} from "lucide-react"
import { toast } from "sonner"

interface Newsletter {
    id: string
    subject: string
    preview: string
    sentAt: Date
    status: 'draft' | 'scheduled' | 'sent' | 'failed'
    recipients: number
    opens: number
    clicks: number
    openRate: number
    clickRate: number
}

interface Subscriber {
    id: string
    email: string
    name: string
    subscribedAt: Date
    status: 'active' | 'unsubscribed' | 'bounced'
    source: string
}

export default function AdminNewsletter() {
    const [newsletters, setNewsletters] = useState<Newsletter[]>([])
    const [subscribers, setSubscribers] = useState<Subscriber[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [selectedTab, setSelectedTab] = useState("campaigns")

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        try {
            setLoading(true)
            
            // Simuler des newsletters
            const mockNewsletters: Newsletter[] = [
                {
                    id: '1',
                    subject: 'Nouveau projet UESGM - Innovation 2024',
                    preview: 'Découvrez les derniers projets innovants de l\'UESGM...',
                    sentAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
                    status: 'sent',
                    recipients: 1250,
                    opens: 890,
                    clicks: 234,
                    openRate: 71.2,
                    clickRate: 26.3
                },
                {
                    id: '2',
                    subject: 'Assemblée Générale Annuelle',
                    preview: 'Convocation à l\'assemblée générale annuelle...',
                    sentAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14),
                    status: 'sent',
                    recipients: 1180,
                    opens: 945,
                    clicks: 156,
                    openRate: 80.1,
                    clickRate: 16.5
                },
                {
                    id: '3',
                    subject: 'Partenariat Stratégique',
                    preview: 'Nouveaux partenariats pour 2024...',
                    sentAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 21),
                    status: 'draft',
                    recipients: 0,
                    opens: 0,
                    clicks: 0,
                    openRate: 0,
                    clickRate: 0
                }
            ]

            // Simuler des abonnés
            const mockSubscribers: Subscriber[] = [
                {
                    id: '1',
                    email: 'jean.dupont@email.com',
                    name: 'Jean Dupont',
                    subscribedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30),
                    status: 'active',
                    source: 'Formulaire site'
                },
                {
                    id: '2',
                    email: 'marie.curie@email.com',
                    name: 'Marie Curie',
                    subscribedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15),
                    status: 'active',
                    source: 'Événement'
                },
                {
                    id: '3',
                    email: 'paul.martin@email.com',
                    name: 'Paul Martin',
                    subscribedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
                    status: 'unsubscribed',
                    source: 'Import CSV'
                }
            ]

            setNewsletters(mockNewsletters)
            setSubscribers(mockSubscribers)
        } catch (error) {
            toast.error("Erreur lors du chargement des données")
        } finally {
            setLoading(false)
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'sent': return 'bg-green-100 text-green-800'
            case 'scheduled': return 'bg-blue-100 text-blue-800'
            case 'draft': return 'bg-yellow-100 text-yellow-800'
            case 'failed': return 'bg-red-100 text-red-800'
            default: return 'bg-gray-100 text-gray-800'
        }
    }

    const getSubscriberStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'bg-green-100 text-green-800'
            case 'unsubscribed': return 'bg-gray-100 text-gray-800'
            case 'bounced': return 'bg-red-100 text-red-800'
            default: return 'bg-gray-100 text-gray-800'
        }
    }

    const filteredNewsletters = newsletters.filter(nl => 
        nl.subject.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const filteredSubscribers = subscribers.filter(sub => 
        sub.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sub.name.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const stats = {
        totalNewsletters: newsletters.length,
        sentNewsletters: newsletters.filter(n => n.status === 'sent').length,
        totalSubscribers: subscribers.length,
        activeSubscribers: subscribers.filter(s => s.status === 'active').length,
        avgOpenRate: newsletters.filter(n => n.status === 'sent').reduce((sum, n) => sum + n.openRate, 0) / newsletters.filter(n => n.status === 'sent').length || 0,
        totalRecipients: newsletters.reduce((sum, n) => sum + n.recipients, 0)
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold font-montserrat text-slate-900 dark:text-white">
                        Newsletter
                    </h1>
                    <p className="text-slate-500 mt-1">
                        Gestion des campagnes email et abonnés
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={loadData} disabled={loading}>
                        <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        Actualiser
                    </Button>
                    <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        Nouvelle campagne
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-500">Campagnes envoyées</p>
                                <p className="text-2xl font-bold">{stats.sentNewsletters}</p>
                            </div>
                            <Send className="w-8 h-8 text-blue-500" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-500">Abonnés actifs</p>
                                <p className="text-2xl font-bold">{stats.activeSubscribers}</p>
                            </div>
                            <Users className="w-8 h-8 text-green-500" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-500">Taux d'ouverture</p>
                                <p className="text-2xl font-bold">{stats.avgOpenRate.toFixed(1)}%</p>
                            </div>
                            <MailOpen className="w-8 h-8 text-purple-500" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-500">Total destinataires</p>
                                <p className="text-2xl font-bold">{stats.totalRecipients}</p>
                            </div>
                            <TrendingUp className="w-8 h-8 text-orange-500" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content */}
            <Tabs value={selectedTab} onValueChange={setSelectedTab}>
                <TabsList>
                    <TabsTrigger value="campaigns">Campagnes</TabsTrigger>
                    <TabsTrigger value="subscribers">Abonnés</TabsTrigger>
                    <TabsTrigger value="analytics">Analytiques</TabsTrigger>
                </TabsList>

                {/* Campaigns Tab */}
                <TabsContent value="campaigns" className="space-y-4">
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                        <Input
                                            placeholder="Rechercher une campagne..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="pl-10"
                                        />
                                    </div>
                                </div>
                                <Button variant="outline" size="sm">
                                    <Filter className="w-4 h-4 mr-2" />
                                    Filtrer
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="grid gap-4">
                        {filteredNewsletters.map((newsletter) => (
                            <Card key={newsletter.id} className="hover:shadow-md transition-shadow">
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="font-semibold text-slate-900">{newsletter.subject}</h3>
                                                <Badge className={getStatusColor(newsletter.status)}>
                                                    {newsletter.status === 'sent' ? 'Envoyée' :
                                                     newsletter.status === 'scheduled' ? 'Planifiée' :
                                                     newsletter.status === 'draft' ? 'Brouillon' : 'Échec'}
                                                </Badge>
                                            </div>
                                            <p className="text-sm text-slate-600 mb-3">{newsletter.preview}</p>
                                            <div className="flex items-center gap-6 text-sm text-slate-500">
                                                <div className="flex items-center gap-1">
                                                    <Users className="w-4 h-4" />
                                                    <span>{newsletter.recipients} destinataires</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <MailOpen className="w-4 h-4" />
                                                    <span>{newsletter.openRate}% ouvertures</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Eye className="w-4 h-4" />
                                                    <span>{newsletter.clickRate}% clics</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="w-4 h-4" />
                                                    <span>{newsletter.sentAt.toLocaleDateString('fr-FR')}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button variant="outline" size="sm">
                                                <Eye className="w-4 h-4" />
                                            </Button>
                                            <Button variant="outline" size="sm">
                                                <Edit className="w-4 h-4" />
                                            </Button>
                                            <Button variant="outline" size="sm">
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                {/* Subscribers Tab */}
                <TabsContent value="subscribers" className="space-y-4">
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                        <Input
                                            placeholder="Rechercher un abonné..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="pl-10"
                                        />
                                    </div>
                                </div>
                                <Button variant="outline" size="sm">
                                    <Plus className="w-4 h-4 mr-2" />
                                    Importer
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="grid gap-4">
                        {filteredSubscribers.map((subscriber) => (
                            <Card key={subscriber.id} className="hover:shadow-md transition-shadow">
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="font-semibold text-slate-900">{subscriber.name}</h3>
                                                <Badge className={getSubscriberStatusColor(subscriber.status)}>
                                                    {subscriber.status === 'active' ? 'Actif' :
                                                     subscriber.status === 'unsubscribed' ? 'Désinscrit' : 'Rejeté'}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center gap-6 text-sm text-slate-500">
                                                <span>{subscriber.email}</span>
                                                <span>•</span>
                                                <span>Source: {subscriber.source}</span>
                                                <span>•</span>
                                                <span>Inscrit le {subscriber.subscribedAt.toLocaleDateString('fr-FR')}</span>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button variant="outline" size="sm">
                                                <Edit className="w-4 h-4" />
                                            </Button>
                                            <Button variant="outline" size="sm">
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                {/* Analytics Tab */}
                <TabsContent value="analytics" className="space-y-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <BarChart3 className="w-5 h-5" />
                                    Évolution des campagnes
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
                                    <TrendingUp className="w-5 h-5" />
                                    Taux d'engagement
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="h-64 flex items-center justify-center text-slate-400">
                                    Graphique d'engagement (à implémenter)
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}
