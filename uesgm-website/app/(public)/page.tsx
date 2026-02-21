import { Hero } from "@/components/sections/Hero"
import { Statistics } from "@/components/sections/Statistics"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Hero />
      <Statistics />

      {/* Section CTA simplifiée */}
      <section className="py-20 bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[150px]"></div>
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-yellow-500/10 rounded-full blur-[120px]"></div>
        </div>

        <div className="container px-4 md:px-6 mx-auto relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 font-brush">
              Rejoignez la Communauté UESGM
            </h2>
            <p className="text-lg text-blue-100 mb-8">
              L'UESGM est votre porte-parole et votre réseau de proximité au Maroc.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                asChild 
                size="lg"
                className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-900 font-bold text-lg px-8 py-6 h-auto transition-all duration-300 shadow-lg hover:shadow-amber-500/30"
              >
                <Link href="/recensement">
                  Se recenser
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
              <Button 
                asChild 
                variant="outline" 
                size="lg"
                className="bg-black border-2 border-[#FFD700] text-[#FFD700] hover:bg-[#1a1a1a] hover:border-[#FFD700] font-bold text-lg px-8 py-6 h-auto transition-all duration-300 shadow-lg hover:shadow-[#FFD700]/20"
              >
                <Link href="/contact">
                  Nous contacter
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
