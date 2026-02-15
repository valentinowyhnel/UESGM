import { Hero } from "@/components/sections/Hero"
import { Statistics } from "@/components/sections/Statistics"

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <Hero />
      <Statistics />

      {/* Short News/Events Section Placeholder used until full implementation */}
      <section className="py-20 bg-white">
        <div className="container px-4 mx-auto text-center">
          <h2 className="text-3xl font-bold font-montserrat text-primary-dark mb-12">Actualités Récentes</h2>
          <div className="flex justify-center">
            <p className="text-muted-foreground">Les actualités seront bientôt disponibles.</p>
          </div>
        </div>
      </section>
    </div>
  )
}
