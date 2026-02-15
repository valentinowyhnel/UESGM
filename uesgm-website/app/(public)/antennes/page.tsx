"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { MapPin, Search, User, Mail, GraduationCap, Building2, Users, Phone } from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"

// Données statiques pour l'affichage initial
const initialAntennes = [
    { 
        city: "Fès – Ifrane", 
        responsable: "M. BOUTOUKOU Axel (SG)", 
        phone: "+212 612 474 457",
        email: "uesgmfesifrane@gmail.com" 
    },
    { 
        city: "Agadir", 
        responsable: "M. NGOMO ASSOUMOU Ely Dylane (SG)", 
        phone: "+212 675 564 119",
        email: "agadir@uesgm.ma" 
    },
    { 
        city: "Mohammedia", 
        responsable: "M. Chryst MOUDOUYI (SG)", 
        phone: "+212 774 975 944",
        email: "mohammedia@uesgm.ma" 
    },
    { 
        city: "Rabat – Salé – Témara – Kénitra", 
        responsable: "M. OKOUROU Désiré Phanuel (SG)", 
        phone: "+212 645 070 013",
        email: "rabat@uesgm.ma" 
    },
    { 
        city: "Casablanca – El Jadida", 
        responsable: "M. AKOUBOUA NGOKELELE Gédéon (SG)", 
        phone: "+212 614 940 684",
        email: "uesgmcasablanca@gmail.com" 
    },
    { 
        city: "Meknès", 
        responsable: "Mme Lyda Winnie ASSENGONE ZUE (SG)", 
        phone: "+212 774 129 380",
        email: "uesgmmekneskhenifra@gmail.com" 
    },
    { 
        city: "Settat", 
        responsable: "M. NDONG ETOUGHE YEBE Labhyze Verdaly (SG)", 
        phone: "+212 625 689 406",
        email: "settat@uesgm.ma" 
    },
    { 
        city: "Tanger – Tétouan", 
        responsable: "Mme MOUGOLA Manu OYANE Doraine (SG)", 
        phone: "+212 775 001 133",
        email: "tanger@uesgm.ma" 
    },
    { 
        city: "Marrakech", 
        responsable: "M. BANA (SG)", 
        phone: "+212 778 672 739",
        email: "marrakech@uesgm.ma" 
    },
]

export default function AntennesPage() {
    const [search, setSearch] = useState("")
    const [searchResults, setSearchResults] = useState<any[]>([])
    const [selectedCity, setSelectedCity] = useState<string | null>(null)
    const [stats, setStats] = useState<any>(null)
    const [loading, setLoading] = useState(false)
    const [isSearching, setIsSearching] = useState(false)

    const filteredAntennes = initialAntennes.filter(a =>
        a.city.toLowerCase().includes(search.toLowerCase())
    )

    // Debounced search for members/antennas
    useEffect(() => {
        const timer = setTimeout(() => {
            if (search.length >= 2) {
                setIsSearching(true)
                fetch(`/data-service/antennes/search?q=${search}`)
                    .then(res => res.json())
                    .then(data => {
                        setSearchResults(data.results || [])
                        setIsSearching(false)
                    })
                    .catch(() => setIsSearching(false))
            } else {
                setSearchResults([])
            }
        }, 300)
        return () => clearTimeout(timer)
    }, [search])

    useEffect(() => {
        if (selectedCity) {
            setLoading(true)
            fetch(`/data-service/antennes/${selectedCity}/stats`)
                .then(async res => {
                    if (!res.ok) throw new Error("Erreur serveur")
                    const contentType = res.headers.get("content-type")
                    if (!contentType || !contentType.includes("application/json")) {
                        throw new Error("Réponse non-JSON")
                    }
                    return res.json()
                })
                .then(data => {
                    setStats(data)
                    setLoading(false)
                })
                .catch(err => {
                    console.error("Fetch error:", err)
                    setStats({ stats: [], error: true })
                    setLoading(false)
                })
        } else {
            setStats(null)
        }
    }, [selectedCity])

    const selectedAntenneData = initialAntennes.find(a => a.city === selectedCity)

    return (
        <div className="container mx-auto px-4 py-12 md:py-20 lg:max-w-7xl">
            <div className="text-center space-y-6 mb-12">
                <h1 className="text-4xl font-bold font-montserrat text-primary-dark">Nos Antennes</h1>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto font-lato">
                    L'UESGM est présente dans tout le Royaume. Cliquez sur une ville pour voir les statistiques d'étudiants par école.
                </p>
            </div>

            <div className="max-w-md mx-auto mb-12 relative z-10">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                    placeholder="Rechercher une ville ou un membre..."
                    className="pl-10 border-primary/20 focus:border-gold h-12"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />

                {/* Suggestions Dropdown */}
                {searchResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 border rounded-xl shadow-xl overflow-hidden z-50">
                        <ScrollArea className="max-h-[300px]">
                            <div className="p-2 space-y-1">
                                {searchResults.map((result, i) => (
                                    <button
                                        key={i}
                                        className="w-full flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors text-left group"
                                        onClick={() => {
                                            setSelectedCity(result.city)
                                            setSearch("")
                                            setSearchResults([])
                                        }}
                                    >
                                        <div className="flex items-center gap-3">
                                            {result.type === 'antenne' ? (
                                                <MapPin className="h-4 w-4 text-gold-dark" />
                                            ) : (
                                                <User className="h-4 w-4 text-primary" />
                                            )}
                                            <div>
                                                <p className="font-bold text-sm">{result.name}</p>
                                                {result.type === 'membre' && (
                                                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                        <MapPin className="h-3 w-3" /> Antenne de {result.city}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <Search className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
                                    </button>
                                ))}
                            </div>
                        </ScrollArea>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredAntennes.map((antenne, index) => (
                    <Card
                        key={index}
                        className="hover:shadow-lg transition-all hover:border-primary/50 cursor-pointer group border-2 border-transparent"
                        onClick={() => setSelectedCity(antenne.city)}
                    >
                        <CardHeader className="pb-2">
                            <div className="flex items-center space-x-3 mb-2">
                                <div className="bg-gold/10 p-2 rounded-full group-hover:bg-gold group-hover:text-primary-dark transition-colors">
                                    <MapPin className="h-5 w-5 text-gold-dark group-hover:text-primary-dark" />
                                </div>
                                <CardTitle className="text-xl font-bold font-montserrat">{antenne.city}</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-sm text-muted-foreground space-y-2">
                                <div className="flex items-center gap-2">
                                    <User className="h-4 w-4 text-primary/60" />
                                    <span className="truncate">{antenne.responsable}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Phone className="h-4 w-4 text-primary/60" />
                                    <span className="text-primary truncate">{antenne.phone}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Mail className="h-4 w-4 text-primary/60" />
                                    <span className="text-primary truncate">{antenne.email}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Dialog Détails Antenne */}
            <Dialog open={!!selectedCity} onOpenChange={(open) => !open && setSelectedCity(null)}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-3xl font-bold font-montserrat flex items-center gap-3">
                            <MapPin className="h-8 w-8 text-gold-dark" />
                            Antenne de {selectedCity}
                        </DialogTitle>
                        <DialogDescription className="text-lg">
                            Informations détaillées et statistiques de recensement.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid md:grid-cols-2 gap-8 py-4">
                        {/* Responsable Info */}
                        <div className="space-y-6">
                            <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-2xl border border-primary/5">
                                <h3 className="font-bold text-primary flex items-center gap-2 mb-4">
                                    <User className="h-5 w-5" /> Responsable
                                </h3>
                                <div className="space-y-3">
                                    <p className="font-bold text-lg">{selectedAntenneData?.responsable}</p>
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Phone className="h-4 w-4" />
                                        <span className="text-sm">{selectedAntenneData?.phone}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Mail className="h-4 w-4" />
                                        <span className="text-sm">{selectedAntenneData?.email}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-2xl border border-primary/5">
                                <h3 className="font-bold text-primary flex items-center gap-2 mb-4">
                                    <Building2 className="h-5 w-5" /> Caractéristiques
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    {stats?.antenne?.address || "L'antenne assure le suivi administratif et l'accompagnement social des étudiants de la région."}
                                </p>
                            </div>
                        </div>

                        {/* Stats Info */}
                        <div className="space-y-4">
                            <h3 className="font-bold text-primary flex items-center gap-2">
                                <GraduationCap className="h-5 w-5" /> Étudiants par établissement
                            </h3>

                            <ScrollArea className="h-[300px] rounded-md border p-4 bg-white dark:bg-slate-900">
                                {loading ? (
                                    <div className="flex flex-col items-center justify-center h-full space-y-2 py-10 opacity-50">
                                        <Users className="h-8 w-8 animate-pulse" />
                                        <p className="text-sm">Chargement...</p>
                                    </div>
                                ) : stats?.stats?.length > 0 ? (
                                    <div className="space-y-4">
                                        {stats.stats.map((item: any, i: number) => (
                                            <div key={i} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                                                <span className="text-sm font-medium truncate max-w-[180px]">{item.establishment}</span>
                                                <Badge variant="secondary" className="bg-gold/20 text-primary-dark font-bold">
                                                    {item.count} étudiant{item.count > 1 ? 's' : ''}
                                                </Badge>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center h-full text-muted-foreground text-sm italic py-20">
                                        Aucune donnée de recensement disponible pour cette ville.
                                    </div>
                                )}
                            </ScrollArea>
                            {!loading && stats?.stats?.length > 0 && (
                                <p className="text-xs text-muted-foreground italic text-right">
                                    * Données actualisées en temps réel selon les recensements.
                                </p>
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
