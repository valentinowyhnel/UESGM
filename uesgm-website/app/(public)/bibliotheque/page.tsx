"use client"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, FileText, Download, Book, Filter } from "lucide-react"
import { useState, useEffect } from "react"

interface Document {
    id: string
    title: string
    category: string
    size: string
    date: string
    type: string
    fileUrl?: string
}

// Types de documents
const categories = ["Tous", "Statuts", "Rapports", "Guides", "Académique", "Juridique"]

// Données fictives
const mockDocuments: Document[] = [
    { id: "1", title: "Statuts de l'UESGM", category: "Statuts", size: "2.4 MB", date: "2024", type: "PDF" },
    { id: "2", title: "Rapport Moral 2024-2025", category: "Rapports", size: "5.1 MB", date: "2025", type: "PDF" },
    { id: "3", title: "Guide du Nouvel Arrivant", category: "Guides", size: "12 MB", date: "2025", type: "PDF" },
    { id: "4", title: "Liste des Universités Reconnues", category: "Académique", size: "1.2 MB", date: "2026", type: "XLSX" },
    { id: "5", title: "Convention de Logement", category: "Juridique", size: "0.5 MB", date: "2023", type: "PDF" },
]

export default function LibraryPage() {
    const [activeCategory, setActiveCategory] = useState("Tous")
    const [searchQuery, setSearchQuery] = useState("")
    const [documents, setDocuments] = useState<Document[]>(mockDocuments)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchDocuments() {
            try {
                const params = new URLSearchParams({
                    category: activeCategory === "Tous" ? "" : activeCategory,
                    search: searchQuery,
                }).toString()

                const response = await fetch(`/api/documents/list?${params}`)
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`)
                }
                
                const data = await response.json()
                
                // L'API retourne { success: true, data: documents, pagination: {...} }
                if (data.success && Array.isArray(data.data)) {
                    setDocuments(data.data)
                } else {
                    console.warn("Format de réponse inattendu, utilisation des données mockées:", data)
                    setDocuments(mockDocuments)
                }
            } catch (error) {
                console.error("Erreur fetch documents, utilisation des données mockées:", error)
                setDocuments(mockDocuments)
            } finally {
                setLoading(false)
            }
        }
        fetchDocuments()
    }, [activeCategory, searchQuery])

    const filteredDocs = Array.isArray(documents) ? documents.filter((doc) => {
        const matchesCategory = activeCategory === "Tous" || doc.category === activeCategory
        const matchesSearch = doc.title?.toLowerCase().includes(searchQuery.toLowerCase())
        return matchesCategory && matchesSearch
    }) : []

    return (
        <div className="container mx-auto px-4 py-12 md:py-20 lg:max-w-7xl">
            <div className="text-center space-y-6 mb-12">
                <h1 className="text-4xl font-bold font-montserrat text-primary-dark">Bibliothèque Numérique</h1>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto font-lato">
                    Accédez à toutes les ressources documentaires de l'UESGM : statuts, rapports, guides pratiques et plus encore.
                </p>
            </div>

            <div className="flex flex-col md:flex-row gap-8 items-start">
                {/* Sidebar Filtres */}
                <aside className="w-full md:w-64 space-y-6 flex-shrink-0">
                    <div className="bg-slate-50 dark:bg-slate-900 p-6 rounded-xl border">
                        <h3 className="font-bold flex items-center gap-2 mb-4 font-montserrat">
                            <Filter className="w-4 h-4" /> Catégories
                        </h3>
                        <div className="space-y-2">
                            {categories.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setActiveCategory(cat)}
                                    className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${activeCategory === cat
                                            ? "bg-primary text-white font-medium"
                                            : "hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
                                        }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>
                </aside>

                {/* Main Content */}
                <div className="flex-1 space-y-6 w-full">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                        <Input
                            placeholder="Rechercher un document..."
                            className="pl-10 h-12 text-lg"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="grid gap-4">
                        {filteredDocs.length > 0 ? (
                            filteredDocs.map((doc) => (
                                <Card key={doc.id} className="hover:shadow-md transition-shadow">
                                    <CardContent className="p-4 flex items-center gap-4">
                                        <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <FileText className="w-6 h-6 text-red-600" />
                                        </div>
                                        <div className="flex-grow min-w-0">
                                            <h4 className="font-bold font-montserrat truncate">{doc.title}</h4>
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                                <Badge variant="outline" className="text-xs">{doc.category}</Badge>
                                                <span>•</span>
                                                <span>{doc.size}</span>
                                                <span>•</span>
                                                <span>{doc.date}</span>
                                            </div>
                                        </div>
                                        <Button size="icon" variant="ghost" className="h-10 w-10 text-primary hover:text-primary-dark hover:bg-primary/10">
                                            <Download className="w-5 h-5" />
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))
                        ) : (
                            <div className="text-center py-12 text-muted-foreground bg-slate-50 rounded-xl border border-dashed">
                                <Book className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                <p>Aucun document trouvé.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
