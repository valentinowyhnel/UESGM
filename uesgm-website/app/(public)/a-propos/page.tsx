import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Shield, Target, Users, Globe } from "lucide-react"

export default function AboutPage() {
    return (
        <div className="container mx-auto px-4 py-12 md:py-20">
            <div className="max-w-4xl mx-auto space-y-12">
                {/* Header Section */}
                <div className="text-center space-y-4">
                    <h1 className="text-4xl font-bold font-montserrat text-primary-dark">À Propos de l'UESGM</h1>
                    <p className="text-xl text-muted-foreground font-lato">
                        L'Union qui rassemble, accompagne et représente la communauté estudiantine gabonaise au Maroc.
                    </p>
                </div>

                <Separator className="bg-gold/30" />

                {/* Introduction / History */}
                <section className="space-y-6">
                    <h2 className="text-2xl font-bold text-primary font-montserrat flex items-center gap-2">
                        <Globe className="w-6 h-6 text-gold" />
                        Notre Histoire
                    </h2>
                    <div className="prose prose-lg text-slate-700 dark:text-slate-300 font-lato">
                        <p>
                            Fondée pour répondre aux besoins croissants de la communauté étudiante gabonaise au Royaume du Maroc,
                            l'UESGM s'est imposée au fil des années comme l'interlocuteur privilégié auprès des institutions diplomatiques
                            et académiques.
                        </p>
                        <p>
                            Notre organisation est née de la volonté de créer un cadre de solidarité, d'entraide et d'excellence
                            pour tous les étudiants et stagiaires gabonais poursuivant leur cursus sur le territoire marocain.
                        </p>
                    </div>
                </section>

                {/* Mission, Vision, Values Grid */}
                <div className="grid md:grid-cols-3 gap-6">
                    <Card className="border-primary/10 shadow-md">
                        <CardContent className="pt-6 space-y-4 text-center">
                            <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mx-auto">
                                <Target className="w-6 h-6 text-primary" />
                            </div>
                            <h3 className="font-bold text-lg text-primary-dark">Notre Mission</h3>
                            <p className="text-sm text-muted-foreground">
                                Accompagner l'étudiant gabonais dans son parcours académique et social, de son arrivée jusqu'à son insertion professionnelle.
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-primary/10 shadow-md">
                        <CardContent className="pt-6 space-y-4 text-center">
                            <div className="bg-gold/10 w-12 h-12 rounded-full flex items-center justify-center mx-auto">
                                <Shield className="w-6 h-6 text-gold-dark" />
                            </div>
                            <h3 className="font-bold text-lg text-primary-dark">Notre Vision</h3>
                            <p className="text-sm text-muted-foreground">
                                Faire de la diaspora étudiante gabonaise au Maroc une communauté d'élite, solidaire et dynamique.
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-primary/10 shadow-md">
                        <CardContent className="pt-6 space-y-4 text-center">
                            <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mx-auto">
                                <Users className="w-6 h-6 text-primary" />
                            </div>
                            <h3 className="font-bold text-lg text-primary-dark">Nos Valeurs</h3>
                            <p className="text-sm text-muted-foreground">
                                Solidarité • Excellence • Responsabilité • Patriotisme
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Presentation Institutionnelle */}
                <section className="bg-slate-50 dark:bg-slate-800 p-8 rounded-2xl space-y-6">
                    <h2 className="text-2xl font-bold text-primary dark:text-gold font-montserrat">
                        Organisation Institutionnelle
                    </h2>
                    <p className="text-slate-700 dark:text-slate-300 font-lato">
                        L'UESGM est structurée autour d'un Bureau Exécutif Central basé à Rabat, et d'Antennes régionales réparties dans les principales villes universitaires du Royaume. Cette organisation permet une proximité réelle avec chaque étudiant, où qu'il soit.
                    </p>
                    <ul className="list-disc list-inside space-y-2 text-slate-700 dark:text-slate-300 ml-4">
                        <li>Une présence dans 9 villes universitaires clés</li>
                        <li>Plus de 8 000 membres et étudiants accompagnés</li>
                        <li>Des représentants élus démocratiquement (Secrétaires Généraux)</li>
                        <li>Un lien direct avec l'Ambassade du Gabon au Maroc</li>
                        <li>Des partenariats stratégiques avec des institutions marocaines et gabonaises</li>
                    </ul>
                </section>

                {/* Réalisations et Services */}
                <section className="space-y-6">
                    <h2 className="text-2xl font-bold text-primary font-montserrat flex items-center gap-2">
                        <Target className="w-6 h-6 text-gold" />
                        Nos Réalisations et Services
                    </h2>
                    <div className="grid md:grid-cols-2 gap-6">
                        <Card className="border-primary/10 shadow-md">
                            <CardContent className="pt-6 space-y-4">
                                <h3 className="font-bold text-lg text-primary-dark">Accompagnement Étudiant</h3>
                                <ul className="text-sm text-muted-foreground space-y-2">
                                    <li>• Accueil et intégration des nouveaux étudiants</li>
                                    <li>• Soutien administratif et logistique</li>
                                    <li>• Orientation académique et professionnelle</li>
                                    <li>• Aide à la recherche de logement</li>
                                </ul>
                            </CardContent>
                        </Card>

                        <Card className="border-primary/10 shadow-md">
                            <CardContent className="pt-6 space-y-4">
                                <h3 className="font-bold text-lg text-primary-dark">Vie Associative</h3>
                                <ul className="text-sm text-muted-foreground space-y-2">
                                    <li>• Organisation d'événements culturels et sportifs</li>
                                    <li>• Journées d'intégration annuelles</li>
                                    <li>• Conférences et ateliers thématiques</li>
                                    <li>• Réseautage avec les alumni</li>
                                </ul>
                            </CardContent>
                        </Card>

                        <Card className="border-primary/10 shadow-md">
                            <CardContent className="pt-6 space-y-4">
                                <h3 className="font-bold text-lg text-primary-dark">Partenariats Stratégiques</h3>
                                <ul className="text-sm text-muted-foreground space-y-2">
                                    <li>• Collaboration avec l'Ambassade du Gabon</li>
                                    <li>• Partenariat avec l'AMCI</li>
                                    <li>• Accords avec des institutions académiques</li>
                                    <li>• Soutien des entreprises gabonaises et marocaines</li>
                                </ul>
                            </CardContent>
                        </Card>

                        <Card className="border-primary/10 shadow-md">
                            <CardContent className="pt-6 space-y-4">
                                <h3 className="font-bold text-lg text-primary-dark">Services Numériques</h3>
                                <ul className="text-sm text-muted-foreground space-y-2">
                                    <li>• Plateforme de communication et d'information</li>
                                    <li>• Base de données des étudiants</li>
                                    <li>• Services en ligne pour les démarches administratives</li>
                                    <li>• Espace de partage de ressources</li>
                                </ul>
                            </CardContent>
                        </Card>
                    </div>
                </section>
            </div>
        </div>
    )
}
