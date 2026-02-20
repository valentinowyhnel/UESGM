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
    <section className="relative w-full py-24 md:py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-white via-amber-50/30 to-white"></div>
      
      <div className="container px-4 md:px-6 mx-auto relative z-10">
        {/* Section Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <span className="inline-block px-5 py-2 mb-6 text-base font-semibold text-amber-700 bg-amber-100 rounded-full">
            Notre Impact
          </span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 mb-6 font-sans">
            Notre Communauté en Chiffres
          </h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
            Une communauté dynamique qui grandit chaque jour davantage au Maroc.
          </p>
          <div className="w-32 h-2 bg-gradient-to-r from-amber-400 to-yellow-500 mx-auto mt-8 rounded-full"></div>
        </motion.div>

        {/* Main Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-10 mb-16">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ 
                duration: 0.5, 
                delay: index * 0.1,
                ease: [0.16, 1, 0.3, 1]
              }}
              viewport={{ once: true, margin: "-50px" }}
              className="group"
            >
              <div className="h-full p-8 md:p-10 bg-white rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 border-2 border-slate-100 hover:border-amber-200 hover:-translate-y-2">
                <div className="flex flex-col items-center text-center h-full">
                  <div className="p-5 mb-6 rounded-2xl bg-gradient-to-br from-amber-50 to-yellow-50 group-hover:from-amber-100 group-hover:to-yellow-100 transition-colors duration-300">
                    <stat.icon className="w-12 h-12 text-amber-600 transition-transform duration-300 group-hover:scale-110" />
                  </div>
                  
                  <h3 className="text-5xl md:text-6xl font-bold text-slate-900 mb-3 font-sans">
                    {stat.value}
                  </h3>
                  
                  <h4 className="text-xl font-bold text-amber-600 mb-3 font-sans">
                    {stat.label}
                  </h4>
                  
                  <p className="text-lg text-slate-500 mt-3 max-w-[220px] leading-relaxed">
                    {stat.description}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom Message */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true }}
          className="text-center mt-20 pt-10 border-t border-slate-200"
        >
          <p className="text-xl text-slate-600 max-w-4xl mx-auto leading-relaxed">
            Rejoignez notre communauté grandissante d'étudiants et de professionnels gabonais au Maroc. 
            <span className="text-amber-600 font-semibold"> Ensemble, nous sommes plus forts.</span>
          </p>
        </motion.div>
      </div>
    </section>
  )
}
