"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import GabonMapFixed from "@/components/maps/GabonMapFixed"
import { 
    Users, MapPin, CheckCircle, Star, Shield, Heart, 
    Globe, Flag, Award, HandHeart, Building, TreePine
} from "lucide-react"

export default function RecensementPage() {
    const [isHovered, setIsHovered] = useState(false)

    const handleMapClick = () => {
        window.open('https://r-ambassade-gabon-ma.lafias.com/', '_blank')
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-yellow-50 to-blue-50">
            {/* Header avec drapeau gabonais */}
            <div className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-green-600 via-yellow-400 to-blue-600 opacity-90"></div>
                <div className="relative container mx-auto px-4 py-8">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            {/* Drapeau gabonais - Trois bandes horizontales égales */}
                            <div className="w-12 h-8 rounded relative overflow-hidden">
                                <div className="absolute inset-x-0 top-0 h-1/3 bg-green-600"></div>
                                <div className="absolute inset-x-0 top-1/3 h-1/3 bg-yellow-400"></div>
                                <div className="absolute inset-x-0 bottom-0 h-1/3 bg-blue-600"></div>
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-white">Recensement National</h1>
                                <p className="text-green-100">Gabon 2026</p>
                            </div>
                        </div>
                        <Badge className="bg-yellow-400 text-green-900 border-2 border-yellow-300 font-bold">
                            Service Public
                        </Badge>
                    </div>
                </div>
            </div>

            {/* Carte du Gabon interactive */}
            <div className="container mx-auto px-4 py-12">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    {/* Carte SVG du Gabon améliorée */}
                    <div className="relative">
                        <Card className="shadow-2xl border-4 border-yellow-400 bg-white/90 backdrop-blur">
                            <CardContent className="p-8">
                                <div className="relative">
                                    {/* Carte du Gabon avec données précises et corrigées */}
                                    <GabonMapFixed
                                        width={400}
                                        height={500}
                                        className="w-full h-auto"
                                        interactive={true}
                                        onClick={handleMapClick}
                                    />
                                    
                                    {/* Légende */}
                                    <div className="mt-6 flex justify-center gap-4 text-sm">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                                            <span className="text-gray-600">Forêt Équatoriale</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
                                            <span className="text-gray-600">Équateur/Soleil</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                                            <span className="text-gray-600">Océan Atlantique</span>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Message et informations */}
                    <div className="space-y-6">
                        {/* Carte principale */}
                        <Card className="shadow-xl border-l-4 border-yellow-400 bg-gradient-to-r from-green-50 to-blue-50">
                            <CardContent className="p-8">
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center flex-shrink-0">
                                        <Users className="w-6 h-6 text-green-800" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-green-800 mb-3">
                                            Pourquoi se recenser ?
                                        </h2>
                                        <div className="space-y-4 text-gray-700">
                                            <p className="leading-relaxed">
                                                Le recensement est un <span className="font-bold text-green-600">acte citoyen fondamental</span> 
                                                qui permet à l&apos;État de connaître sa population pour mieux vous servir.
                                            </p>
                                            <p className="leading-relaxed">
                                                Vos données garantissent une <span className="font-bold text-yellow-600">répartition juste des ressources</span>, 
                                                une planification efficace des services publics et un développement équilibré de toutes nos régions.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Carte d'appel à l'action */}
                        <Card className="shadow-xl bg-gradient-to-r from-yellow-400 to-blue-500 text-white">
                            <CardContent className="p-8">
                                <div className="text-center space-y-4">
                                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto">
                                        <Heart className="w-8 h-8" />
                                    </div>
                                    <h3 className="text-2xl font-bold">
                                        Faites votre devoir de citoyen
                                    </h3>
                                    <p className="text-white/90 leading-relaxed">
                                        Chaque Gabonais compte. Votre participation est essentielle 
                                        pour construire ensemble le Gabon de demain.
                                    </p>
                                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                        <Button 
                                            size="lg"
                                            className="bg-white text-green-700 hover:bg-green-50 font-bold px-8"
                                            onClick={handleMapClick}
                                        >
                                            <MapPin className="w-5 h-5 mr-2" />
                                            Je me recense
                                        </Button>
                                        <Button 
                                            variant="outline" 
                                            size="lg"
                                            className="border-2 border-white text-white hover:bg-white/20 font-bold"
                                        >
                                            <Shield className="w-5 h-5 mr-2" />
                                            En savoir plus
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Avantages du recensement */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <Card className="border-l-4 border-green-500 bg-white">
                                <CardContent className="p-4 text-center">
                                    <Building className="w-8 h-8 text-green-600 mx-auto mb-2" />
                                    <h4 className="font-bold text-green-800 mb-1">Infrastructures</h4>
                                    <p className="text-sm text-gray-600">Écoles, hôpitaux, routes adaptés à vos besoins</p>
                                </CardContent>
                            </Card>
                            <Card className="border-l-4 border-yellow-500 bg-white">
                                <CardContent className="p-4 text-center">
                                    <Award className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                                    <h4 className="font-bold text-green-800 mb-1">Services</h4>
                                    <p className="text-sm text-gray-600">Meilleure planification des services publics</p>
                                </CardContent>
                            </Card>
                            <Card className="border-l-4 border-blue-500 bg-white">
                                <CardContent className="p-4 text-center">
                                    <TreePine className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                                    <h4 className="font-bold text-green-800 mb-1">Environnement</h4>
                                    <p className="text-sm text-gray-600">Protection durable de nos ressources naturelles</p>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>

                {/* Section informations supplémentaires */}
                <div className="mt-16 grid lg:grid-cols-3 gap-8">
                    <Card className="shadow-lg border-t-4 border-green-600">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <CheckCircle className="w-6 h-6 text-green-600" />
                                <h3 className="font-bold text-green-800">Confidentialité</h3>
                            </div>
                            <p className="text-gray-600 text-sm leading-relaxed">
                                Vos informations personnelles sont protégées par la loi et utilisées 
                                uniquement à des fins statistiques et de planification.
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="shadow-lg border-t-4 border-yellow-500">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <Star className="w-6 h-6 text-yellow-600" />
                                <h3 className="font-bold text-green-800">Gratuit</h3>
                            </div>
                            <p className="text-gray-600 text-sm leading-relaxed">
                                Le recensement est un service public entièrement gratuit. 
                                Ne payez jamais pour vous recenser.
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="shadow-lg border-t-4 border-blue-600">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <HandHeart className="w-6 h-6 text-blue-600" />
                                <h3 className="font-bold text-green-800">Civisme</h3>
                            </div>
                            <p className="text-gray-600 text-sm leading-relaxed">
                                Se recenser, c'est contribuer activement au développement 
                                de notre cher pays et à l'avenir de nos enfants.
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Footer avec message final */}
                <div className="mt-16 text-center">
                    <div className="bg-gradient-to-b from-green-600 via-yellow-400 to-blue-600 rounded-2xl p-8 text-white">
                        <div className="flex items-center justify-center gap-3 mb-4">
                            <Flag className="w-8 h-8" />
                            <h2 className="text-3xl font-bold">Ensemble pour le Gabon</h2>
                            <Flag className="w-8 h-8" />
                        </div>
                        <p className="text-xl mb-6 text-white/90">
                            Votre participation est un investissement dans l'avenir de notre nation
                        </p>
                        <Button 
                            size="lg"
                            className="bg-white text-green-700 hover:bg-green-50 font-bold px-12 text-lg"
                            onClick={handleMapClick}
                        >
                            <Globe className="w-6 h-6 mr-3" />
                            Accéder au portail de recensement
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
