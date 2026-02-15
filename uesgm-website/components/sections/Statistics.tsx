"use client"
import { motion } from "framer-motion"
import { Users, MapPin, Calendar, BookOpen } from "lucide-react"

const stats = [
    { 
        icon: Users, 
        value: "8 000+", 
        label: "Membres",
        description: "Étudiants et stagiaires gabonais au Maroc"
    },
    { 
        icon: MapPin, 
        value: "9", 
        label: "Villes & Antennes",
        description: "Villes marocaines où nous sommes présents"
    },
    { 
        icon: Calendar, 
        value: "50+", 
        label: "Événements",
        description: "Activités organisées chaque année"
    },
    { 
        icon: BookOpen, 
        value: "100+", 
        label: "Ressources",
        description: "Documents et guides à votre disposition"
    },
]

export function Statistics() {
    return (
        <section className="w-full py-16 md:py-24 bg-gradient-to-b from-primary/95 via-white to-primary/95">
            <div className="container px-4 md:px-6 mx-auto max-w-7xl">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4 font-montserrat">
                        Notre Communauté en Chiffres
                    </h2>
                    <div className="w-24 h-1 bg-gradient-to-r from-gold to-gold-dark mx-auto rounded-full"></div>
                </motion.div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {stats.map((stat, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ 
                                duration: 0.5, 
                                delay: index * 0.1,
                                ease: [0.16, 1, 0.3, 1]
                            }}
                            viewport={{ once: true, margin: "-100px" }}
                            className="group"
                        >
                            <div className="h-full p-6 bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg transition-all duration-300 border border-white/20 hover:shadow-xl hover:border-gold/30 hover:translate-y-[-5px]">
                                <div className="flex flex-col items-center text-center h-full">
                                    <div className="p-4 mb-5 rounded-2xl bg-gradient-to-br from-gold/10 to-gold/5 group-hover:from-gold/15 group-hover:to-gold/5 transition-colors duration-300">
                                        <stat.icon className="w-10 h-10 text-gold-dark transition-transform duration-300 group-hover:scale-110" />
                                    </div>
                                    
                                    <h3 className="text-4xl md:text-5xl font-bold text-gold-dark mb-2 font-montserrat">
                                        {stat.value}
                                    </h3>
                                    
                                    <h4 className="text-xl font-semibold text-primary-foreground mb-2 font-montserrat">
                                        {stat.label}
                                    </h4>
                                    
                                    <p className="text-muted-foreground text-sm mt-2 max-w-[200px] mx-auto">
                                        {stat.description}
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    viewport={{ once: true }}
                    className="text-center mt-16"
                >
                    <p className="text-primary-foreground/80 max-w-3xl mx-auto text-lg">
                        Rejoignez notre communauté grandissante d'étudiants et de professionnels gabonais au Maroc.
                    </p>
                </motion.div>
            </div>
        </section>
    )
}
