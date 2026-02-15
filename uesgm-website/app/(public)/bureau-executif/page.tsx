"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Mail, Phone, MapPin, Shield, Users, Award, Briefcase } from "lucide-react"
import Image from "next/image"

// Structure du bureau exécutif
const bureauStructure = {
    president: {
        name: "MINTSA NDONG Emery Désiré",
        role: "Président",
        location: "Casablanca",
        email: "president@uesgm.ma",
        phone: "+212 774-975947",
        image: "/images/president.jpg"
    },
    secretariatGeneral: {
        titulaire: {
            name: "NDEMBI BOUCKA Amy-Sarahi",
            role: "Secrétaire Générale",
            location: "Rabat",
            email: "sg@uesgm.ma",
            phone: "+212 669-936086",
            image: "/images/Secrétaire Générale du Bureau.jpg"
        },
        adjointe: {
            name: "OTSAGHE MENZALE Christabelle",
            role: "Secrétaire Générale Adjointe",
            location: "Casablanca",
            email: "sg-adjointe@uesgm.ma",
            phone: "+212 6 XX XX XX XX",
            image: "/images/Secrétaire Générale Adjointe.jpg"
        }
    },
    tresorerie: {
        titulaire: {
            name: "OSSIMA Maixent Daniel Ike",
            role: "Trésorier Général",
            location: "Agadir",
            email: "tresorerie@uesgm.ma",
            phone: "+212 6 XX XX XX XX",
            image: "/images/Trésorier Général.jpg"
        },
        adjoint: {
            name: "LEBOUNDANGOYE MPIGA Carl Marley",
            role: "Trésorier Général Adjoint",
            location: "Casablanca",
            email: "tresorerie-adjoint@uesgm.ma",
            phone: "+212 6 XX XX XX XX",
            image: "/images/Trésorier Général Adjoint.jpg"
        }
    },
    delegues: [
        {
            name: "MATSANGA BA Juliana Dina",
            role: "Déléguée aux Affaires Académiques",
            location: "Tanger",
            email: "academique@uesgm.ma",
            phone: "+212 6 XX XX XX XX",
            image: "/images/Délégué aux Affaires Académiques.jpg"
        },
        {
            name: "MIMBOUI MENDOU Juliette Gisnelle",
            role: "Déléguée aux Affaires Culturelles",
            location: "Casablanca",
            email: "culture@uesgm.ma",
            phone: "+212 775-922785",
            image: "/images/Déléguée aux Affaires Culturelles.jpg"
        },
        {
            name: "BOUT MEDZO Alane Klein",
            role: "Délégué à la Communication",
            location: "Casablanca",
            email: "communication@uesgm.ma",
            phone: "+212 6 75 84 92 13"
        },
        {
            name: "EKOMESSE MVE ELZA",
            role: "Déléguée aux Affaires Sociales",
            location: "Settat",
            email: "social@uesgm.ma",
            phone: "+212 6 12 34 56 78",
            specialStyle: true
        },
        {
            name: "NGANGORI YAN-DOMINIQUE",
            role: "Délégué aux Affaires Sportives",
            location: "Casablanca",
            email: "sport@uesgm.ma",
            phone: "+212 6 98 76 54 32",
            image: "/images/Delegué aux Affaires Sportives.jpg"
        }
    ]
}

interface Member {
    name: string
    role: string
    location?: string
    email: string
    phone: string
    image?: string
    specialStyle?: boolean
}

// Composant carte membre moderne
function MemberCard({ member, isClickable = false, onClick }: { member: Member; isClickable?: boolean; onClick?: () => void }) {
    return (
        <div 
            className={`group relative bg-gradient-to-br from-white to-blue-50/30 rounded-2xl p-8 border border-blue-100 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 ${isClickable ? "cursor-pointer" : ""}`}
            onClick={isClickable ? onClick : undefined}
        >
            {/* Badge décoratif */}
            <div className="absolute top-6 right-6 w-3 h-3 bg-gradient-to-r from-blue-500 to-gold rounded-full opacity-60 group-hover:opacity-100 transition-opacity"></div>
            
            <div className="flex flex-col items-center text-center space-y-8">
                {/* Photo carrée avec cadre doré */}
                <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-gold rounded-lg opacity-20 blur-xl group-hover:opacity-30 transition-opacity"></div>
                    <div className="relative w-24 h-24 overflow-hidden">
                        {member.image ? (
                            <Image
                                src={member.image}
                                alt={member.name}
                                width={96}
                                height={96}
                                className={`${member.specialStyle ? 'rounded-t-lg' : 'rounded-b-lg'} object-cover border-4 border-white shadow-lg`}
                            />
                        ) : (
                            <div className={`w-24 h-24 ${member.specialStyle ? 'rounded-t-lg' : 'rounded-b-lg'} border-4 border-white shadow-lg bg-gradient-to-br from-blue-500 to-gold flex items-center justify-center`}>
                                <span className="text-white text-xl font-bold">
                                    {member.name.substring(0, 2).toUpperCase()}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Espace de séparation */}
                <div className="h-6"></div>

                {/* Informations */}
                <div className="space-y-4 w-full text-center">
                    <h3 className="text-xl font-bold text-gray-900 leading-tight">{member.name}</h3>
                    <div className="inline-block">
                        <span className="text-sm font-semibold bg-gradient-to-r from-blue-100 to-gold/20 text-blue-700 px-3 py-2 rounded-full">
                            {member.role}
                        </span>
                    </div>
                    {member.location && (
                        <div className="flex items-center justify-center text-sm text-gray-600">
                            <MapPin className="w-4 h-4 mr-2 text-blue-500" />
                            {member.location}
                        </div>
                    )}
                </div>

                {/* Contact */}
                <div className="w-full space-y-2 pt-4 border-t border-blue-100/50">
                    <div className="flex items-center justify-center text-sm text-gray-700">
                        <Mail className="w-4 h-4 mr-2 text-blue-500" />
                        <span className="truncate">{member.email}</span>
                    </div>
                    <div className="flex items-center justify-center text-sm text-gray-700">
                        <Phone className="w-4 h-4 mr-2 text-gold" />
                        <span>{member.phone}</span>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default function BureauPage() {
    const [clickCount, setClickCount] = useState(0)
    const router = useRouter()

    const handlePresidentClick = () => {
        const newCount = clickCount + 1
        if (newCount >= 3) {
            router.push("/portal")
            setClickCount(0)
        } else {
            setClickCount(newCount)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gold/10">
            {/* Hero Section */}
            <div className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-transparent to-gold/10"></div>
                <div className="relative container mx-auto px-4 py-16 md:py-24">
                    <div className="text-center space-y-6">
                        <div className="inline-flex items-center space-x-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                                <Shield className="w-6 h-6 text-white" />
                            </div>
                            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-900 to-gold bg-clip-text text-transparent">
                                Bureau Exécutif
                            </h1>
                            <div className="w-12 h-12 bg-gradient-to-br from-gold to-yellow-600 rounded-xl flex items-center justify-center shadow-lg">
                                <Award className="w-6 h-6 text-white" />
                            </div>
                        </div>
                        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                            Union des Étudiants Gabonais au Maroc • Mandat 2025-2026
                        </p>
                        <div className="flex justify-center space-x-8 pt-4">
                            <div className="flex items-center text-sm text-gray-500">
                                <Users className="w-4 h-4 mr-2 text-blue-500" />
                                <span>11 Membres</span>
                            </div>
                            <div className="flex items-center text-sm text-gray-500">
                                <Briefcase className="w-4 h-4 mr-2 text-gold" />
                                <span>4 Départements</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="container mx-auto px-4 py-12">
                {/* Président Section */}
                <div className="mb-20">
                    <div className="text-center mb-10">
                        <div className="inline-flex items-center space-x-2 mb-4">
                            <div className="w-8 h-1 bg-gradient-to-r from-blue-500 to-gold rounded"></div>
                            <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Présidence</span>
                            <div className="w-8 h-1 bg-gradient-to-r from-blue-500 to-gold rounded"></div>
                        </div>
                    </div>
                    <div className="flex justify-center">
                        <div className="relative group">
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-gold rounded-3xl opacity-20 blur-xl group-hover:opacity-30 transition-opacity"></div>
                            <div className="relative bg-gradient-to-br from-white to-blue-50/50 rounded-3xl p-8 border border-blue-100 shadow-xl">
                                <MemberCard 
                                    member={bureauStructure.president} 
                                    isClickable={true} 
                                    onClick={handlePresidentClick} 
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Secrétariat Général Section */}
                <div className="mb-20">
                    <div className="text-center mb-10">
                        <div className="inline-flex items-center space-x-2 mb-4">
                            <div className="w-8 h-1 bg-gradient-to-r from-blue-500 to-gold rounded"></div>
                            <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Secrétariat Général</span>
                            <div className="w-8 h-1 bg-gradient-to-r from-blue-500 to-gold rounded"></div>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-5xl mx-auto">
                        <MemberCard member={bureauStructure.secretariatGeneral.titulaire} />
                        <MemberCard member={bureauStructure.secretariatGeneral.adjointe} />
                    </div>
                </div>

                {/* Trésorerie Section */}
                <div className="mb-20">
                    <div className="text-center mb-10">
                        <div className="inline-flex items-center space-x-2 mb-4">
                            <div className="w-8 h-1 bg-gradient-to-r from-blue-500 to-gold rounded"></div>
                            <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Trésorerie</span>
                            <div className="w-8 h-1 bg-gradient-to-r from-blue-500 to-gold rounded"></div>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-5xl mx-auto">
                        <MemberCard member={bureauStructure.tresorerie.titulaire} />
                        <MemberCard member={bureauStructure.tresorerie.adjoint} />
                    </div>
                </div>

                {/* Délégués Section */}
                <div className="mb-20">
                    <div className="text-center mb-10">
                        <div className="inline-flex items-center space-x-2 mb-4">
                            <div className="w-8 h-1 bg-gradient-to-r from-blue-500 to-gold rounded"></div>
                            <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Délégués Spécialisés</span>
                            <div className="w-8 h-1 bg-gradient-to-r from-blue-500 to-gold rounded"></div>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-16 max-w-4xl mx-auto">
                        {bureauStructure.delegues.map((delegue, index) => (
                            <MemberCard key={index} member={delegue} />
                        ))}
                    </div>
                </div>

                {/* Contact Section */}
                <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-gold/10 rounded-3xl"></div>
                    <div className="relative bg-white/80 backdrop-blur-sm rounded-3xl p-8 text-center border border-blue-100/50">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">
                            Contactez le Bureau Exécutif
                        </h3>
                        <p className="text-gray-600 mb-6">
                            Pour toute question ou information, n'hésitez pas à nous contacter
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl px-6 py-3 border border-blue-200">
                                <Mail className="w-5 h-5 text-blue-600 inline mr-2" />
                                <span className="text-blue-700 font-semibold">contact@uesgm.ma</span>
                            </div>
                            <div className="bg-gradient-to-r from-gold/20 to-gold/30 rounded-xl px-6 py-3 border border-gold/30">
                                <Phone className="w-5 h-5 text-gold inline mr-2" />
                                <span className="text-gold font-semibold">+212 774-975947</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
