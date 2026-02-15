"use client"
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import styles from "./Hero.module.css"

export function Hero() {
    return (
        <section className={styles.heroSection}>
            <div className={styles.container}>
                <div className={styles.flexContainer}>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                        className="max-w-4xl"
                    >
                        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl/none text-primary-foreground font-montserrat">
                            <span className="block mb-4">Union des Étudiants et Stagiaires</span>
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-gold-dark via-gold to-gold-light">
                                Gabonais au Maroc
                            </span>
                        </h1>
                    </motion.div>
                    
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                        className="max-w-2xl"
                    >
                        <p className="text-lg md:text-xl text-primary-foreground/90 font-lato leading-relaxed">
                            Unir, Servir et Exceller. La plateforme officielle pour accompagner, orienter et représenter la communauté estudiantine gabonaise au Royaume du Maroc.
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                        className="flex flex-col sm:flex-row gap-6 pt-6"
                    >
                        <Button 
                            asChild 
                            size="lg" 
                            className="relative overflow-hidden group bg-gradient-to-r from-gold to-gold-dark text-primary-foreground hover:from-gold-dark hover:to-gold-darker font-bold text-lg px-8 py-6 h-auto transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-[1.02]"
                        >
                            <Link href="/recensement" className="relative z-10">
                                <span className="relative z-10">Se recenser maintenant</span>
                                <span className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                            </Link>
                        </Button>
                        
                        <Button 
                            asChild 
                            variant="outline" 
                            size="lg" 
                            className="relative overflow-hidden group border-2 border-gold-dark text-gold-dark hover:text-gold-darker hover:bg-gold/10 font-bold text-lg px-8 py-6 h-auto transition-all duration-300 hover:scale-[1.02]"
                        >
                            <Link href="/a-propos" className="relative z-10">
                                <span className="relative z-10">Découvrir l&apos;UESGM</span>
                                <span className="absolute inset-0 bg-gold/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                            </Link>
                        </Button>
                    </motion.div>
                </div>
            </div>

            {/* Éléments de fond améliorés */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                {/* Effets de lumière dorée */}
                <div className={styles.goldLightEffect1}></div>
                <div className={styles.goldLightEffect2}></div>
                
                {/* Motif de fond subtil */}
                <div className={styles.heroBackgroundPattern}></div>
                
                {/* Effet de flou doux */}
                <div className={styles.blurEffect}></div>
            </div>
        </section>
    )
}
