import { PartnerCard } from "@/components/cards/PartnerCard"
import { Building2, Landmark, Briefcase } from "lucide-react"
import Image from "next/image"

// Composant pour les lignes de connexion hiérarchique
function ConnectionLine({ from, to, className = "" }: { from: string; to: string; className?: string }) {
    return (
        <div className={`relative ${className}`}>
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-full h-0.5 bg-gold"></div>
            </div>
            <div className="text-center text-xs text-gold font-semibold mt-1">
                {from} → {to}
            </div>
        </div>
    )
}

export default function PartnersPage() {
    return (
        <div className="container mx-auto px-4 py-12 md:py-20">
            <div className="text-center space-y-6 mb-16">
                <h1 className="text-4xl font-bold font-montserrat text-primary-dark">Nos Partenaires</h1>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto font-lato">
                    Ils nous accompagnent dans notre mission au service des étudiants et des stagiaires gabonais au Maroc.
                </p>
            </div>

            <div className="space-y-20">
                {/* Institutionnels */}
                <section>
                    <div className="flex items-center gap-4 mb-8">
                        <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                            <Landmark className="w-5 h-5 text-primary" />
                        </div>
                        <h2 className="text-3xl font-bold font-montserrat text-primary-dark">Partenaires Institutionnels</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <PartnerCard 
                            name="Conseil des Gabonais au Maroc (CGM)" 
                            description="Représentation officielle"
                            website="#"
                            image="/images/Conseil des Gabonais au Maroc (CGM).jpeg"
                        />
                        <PartnerCard 
                            name="Agence Marocaine de Coopération Internationale (AMCI)" 
                            description="Coopération bilatérale"
                            website="https://www.amci.ma"
                            image="/images/Agence Marocaine de Coopération Internationale (AMCI).jpeg"
                        />
                        <PartnerCard 
                            name="Association Culturelle Gabonaise du Maroc (ACGM)" 
                            description="Partenariat culturel"
                            website="#"
                            image="/images/Association Culturelle Gabonaise du Maroc (ACGM).jpg"
                        />
                        <PartnerCard 
                            name="CESAM" 
                            description="Centre d'Études Supérieures Africaines"
                            website="#"
                            image="/images/CESAM.jpeg"
                        />
                        <PartnerCard 
                            name="Fédération des entrepreneurs Gabonais au Maroc" 
                            description="Organisation professionnelle des entrepreneurs gabonais"
                            website="https://web.facebook.com/profile.php?id=615746826372885"
                            image="/images/Fédération des entrepreneurs Gabonais au Maroc.jpg"
                        />
                        <PartnerCard 
                            name="Ambassade de la République Gabonaise au Maroc" 
                            description="Représentation diplomatique officielle"
                            website="https://amba-maroc.demo2.nic.ga"
                            image="/images/Ambassade de la République Gabonaise au Maroc.jpeg"
                        />
                    </div>
                </section>

                {/* Privés */}
                <section>
                    <div className="flex items-center gap-4 mb-8">
                        <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                            <Briefcase className="w-5 h-5 text-primary" />
                        </div>
                        <h2 className="text-3xl font-bold font-montserrat text-primary-dark">Partenaires Privés</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <PartnerCard 
                            name="Smart Africa" 
                            description="Innovation et technologie éducative"
                            website="https://smartstudent.africa"
                            image="/images/SMART AFRICA.jpg"
                        />
                    </div>
                </section>
            </div>
        </div>
    )
}
