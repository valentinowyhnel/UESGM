import Link from "next/link"
import { AdminAccessFooter, AdminAccessCopyright } from "@/components/AdminAccess"

export function Footer() {
    return (
        <footer className="w-full border-t bg-primary-dark text-white pt-10 pb-6">
            <div className="container px-4 md:px-6 mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div className="space-y-4 relative">
                        <AdminAccessFooter>
                            <h3 className="text-xl font-bold font-montserrat text-gold cursor-pointer hover:text-gold/80 transition-colors">
                                UESGM
                            </h3>
                        </AdminAccessFooter>
                        <p className="text-sm text-gray-300">
                            Union des Étudiants et Stagiaires Gabonais au Maroc.
                            L'union fait la force, la digitalisation fait l'avenir.
                        </p>
                    </div>
                    <div className="space-y-4">
                        <h4 className="font-bold text-lg">Liens Rapides</h4>
                        <ul className="space-y-2 text-sm">
                            <li><Link href="/a-propos" className="hover:text-gold transition-colors">À propos</Link></li>
                            <li><Link href="/bureau-executif" className="hover:text-gold transition-colors">Bureau Exécutif</Link></li>
                            <li><Link href="/evenements" className="hover:text-gold transition-colors">Événements</Link></li>
                            <li><Link href="/bibliotheque" className="hover:text-gold transition-colors">Bibliothèque</Link></li>
                        </ul>
                    </div>
                    <div className="space-y-4">
                        <h4 className="font-bold text-lg">Contact</h4>
                        <ul className="space-y-2 text-sm text-gray-300">
                            <li>72, Avenue Mehdi Ben Barka</li>
                            <li>Souissi, Rabat, Maroc</li>
                            <li>contact@uesgm.ma</li>
                            <li>+212 6 61 23 45 67</li>
                        </ul>
                    </div>
                    <div className="space-y-4">
                        <h4 className="font-bold text-lg">Newsletter</h4>
                        <p className="text-sm text-gray-300">Restez informé de nos activités.</p>
                        <div className="flex gap-2">
                            <input
                                type="email"
                                placeholder="Votre email"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background text-black placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            />
                            <button className="bg-gold text-primary-dark font-bold px-4 py-2 rounded-md text-sm hover:bg-gold-light">
                                OK
                            </button>
                        </div>
                    </div>
                </div>
                <div className="mt-10 border-t border-white/10 pt-6 text-center text-sm text-gray-400 relative">
                    <p className="cursor-pointer hover:text-gray-300 transition-colors select-none">
                        © {new Date().getFullYear()} UESGM. Tous droits réservés.
                    </p>
                    {/* Zone invisible pour code secret (5 clics) */}
                    <AdminAccessCopyright />
                </div>
            </div>
        </footer>
    )
}
