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
                    <h2 className="text-2xl font-bold text-primary font-montserrat flex items-center justify-center gap-2 text-center">
                        <Globe className="w-6 h-6 text-gold flex-shrink-0" />
                        Notre Histoire
                    </h2>
                    <div className="prose prose-lg text-slate-700 dark:text-slate-300 font-lato max-w-3xl mx-auto text-center">
                        <p>
                            L'Union des Étudiants et Stagiaires Gabonais au Maroc (UESGM) est née de la volonté de rassembler, structurer et représenter la communauté estudiantine gabonaise présente sur le territoire marocain.
                        </p>
                        <p>
                            Face aux défis académiques, administratifs et sociaux rencontrés par les étudiants et stagiaires à l'étranger, l'UESGM s'est imposée comme un cadre organisé d'entraide, de solidarité et de représentation officielle.
                        </p>
                        <p>
                            Sa dynamique témoigne d'une volonté de se positionner comme un acteur central de la vie des étudiants et stagiaires Gabonais au Maroc, en collaboration avec les institutions diplomatiques et partenaires sociaux.
                        </p>
                    </div>
                </section>

                {/* Mission, Devise Grid */}
                <div className="grid md:grid-cols-2 gap-6">
                    <Card className="border-primary/10 shadow-md h-full">
                        <CardContent className="pt-6 pb-6 space-y-4 text-center flex flex-col h-full">
                            <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mx-auto">
                                <Target className="w-6 h-6 text-primary" />
                            </div>
                            <h3 className="font-bold text-lg text-primary-dark">Notre Mission</h3>
                            <p className="text-sm text-muted-foreground mt-auto">
                                Notre mission est d'accompagner, représenter et valoriser les étudiants et stagiaires gabonais au Maroc. Nous oeuvrons pour défendre leurs intérêts, faciliter leur intégration, encourager l'excellence académique et promouvoir l'innovation, la discipline et l'engagement communautaire.
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-primary/10 shadow-md h-full">
                        <CardContent className="pt-6 pb-6 space-y-4 text-center flex flex-col h-full">
                            <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mx-auto">
                                <Users className="w-6 h-6 text-primary" />
                            </div>
                            <h3 className="font-bold text-lg text-primary-dark">Notre Devise</h3>
                            <p className="text-sm text-muted-foreground mt-auto">
                                Unité – Excellence – Réussite
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Presentation Institutionnelle */}
                <section className="bg-slate-50 dark:bg-slate-800 p-6 md:p-8 rounded-2xl space-y-6">
                    <h2 className="text-2xl font-bold text-primary dark:text-gold font-montserrat text-center">
                        Organisation Institutionnelle
                    </h2>
                    <p className="text-slate-700 dark:text-slate-300 font-lato text-center max-w-2xl mx-auto">
                        L'UESGM est structurée autour d'un Bureau Exécutif Central basé à Rabat, et d'Antennes régionales réparties dans les principales villes universitaires du Royaume. Cette organisation permet une proximité réelle avec chaque étudiant, où qu'il soit.
                    </p>
                    <ul className="grid md:grid-cols-2 gap-3 text-slate-700 dark:text-slate-300 max-w-2xl mx-auto">
                        <li className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-gold flex-shrink-0"></span>
                            Une présence dans plus de 9 villes
                        </li>
                        <li className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-gold flex-shrink-0"></span>
                            Plus de 8 000 membres
                        </li>
                        <li className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-gold flex-shrink-0"></span>
                            Des représentants élus démocratiquement (Secrétaires Généraux)
                        </li>
                        <li className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-gold flex-shrink-0"></span>
                            Un lien direct avec les Institutions gabonaises et marocaines
                        </li>
                        <li className="flex items-center gap-2 md:col-span-2">
                            <span className="w-2 h-2 rounded-full bg-gold flex-shrink-0"></span>
                            Des partenariats stratégiques avec des institutions marocaines et gabonaises
                        </li>
                    </ul>
                </section>

            </div>
        </div>
    )
}
