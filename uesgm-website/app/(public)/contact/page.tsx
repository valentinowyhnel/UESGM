import { ContactFormSimple } from "@/components/forms/ContactFormSimple"
import { Mail, MapPin, Phone, Facebook, Twitter, Instagram, Linkedin, Music, Youtube } from "lucide-react"
import { Toaster } from "sonner"

export default function ContactPage() {
    return (
        <>
            <div className="container mx-auto px-4 py-12 md:py-20 max-w-7xl">
            <div className="text-center space-y-4 mb-16">
                <h1 className="text-4xl font-bold font-montserrat text-primary-dark">Contactez-nous</h1>
                <p className="text-xl text-muted-foreground font-lato">
                    Une question ? Une suggestion ? N'hésitez pas à nous écrire.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
                {/* Informations de contact */}
                <div className="space-y-8">
                    <div className="bg-primary text-white p-8 rounded-2xl shadow-xl space-y-8">
                        <h2 className="text-2xl font-bold mb-6 font-montserrat">Nos Coordonnées</h2>

                        <div className="flex items-start space-x-4">
                            <MapPin className="w-6 h-6 text-gold flex-shrink-0 mt-1" />
                            <div>
                                <h3 className="font-bold text-lg">Adresse</h3>
                                <p className="text-gray-200">72, Avenue Mehdi Ben Barka,<br />Souissi, Rabat, Maroc</p>
                            </div>
                        </div>

                        <div className="flex items-start space-x-4">
                            <Mail className="w-6 h-6 text-gold flex-shrink-0 mt-1" />
                            <div>
                                <h3 className="font-bold text-lg">Email</h3>
                                <p className="text-gray-200">contact@uesgm.ma</p>
                                <p className="text-gray-200">support@uesgm.ma</p>
                            </div>
                        </div>

                        <div className="flex items-start space-x-4">
                            <Phone className="w-6 h-6 text-gold flex-shrink-0 mt-1" />
                            <div>
                                <h3 className="font-bold text-lg">Téléphone</h3>
                                <p className="text-gray-200">+212 774-975947</p>
                                <p className="text-gray-200 text-sm">Président - Contact officiel de l'association</p>
                            </div>
                        </div>

                        <div className="pt-8 border-t border-white/20">
                            <h3 className="font-bold text-lg mb-4">Suivez-nous</h3>
                            <div className="flex space-x-4">
                                <a href="https://www.tiktok.com/@uesgmmaroc?_r=1&_t=ZS-93oy9gEqdHR" target="_blank" rel="noopener noreferrer" className="bg-white/10 p-2 rounded-full hover:bg-gold hover:text-primary-dark transition-all" title="TikTok UESGM Maroc">
                                    <Music className="w-5 h-5" />
                                </a>
                                <a href="https://m.youtube.com/@UESGM/videos" target="_blank" rel="noopener noreferrer" className="bg-white/10 p-2 rounded-full hover:bg-gold hover:text-primary-dark transition-all" title="YouTube UESGM">
                                    <Youtube className="w-5 h-5" />
                                </a>
                                <a href="#" className="bg-white/10 p-2 rounded-full hover:bg-gold hover:text-primary-dark transition-all" title="Facebook UESGM">
                                    <Facebook className="w-5 h-5" />
                                </a>
                                <a href="#" className="bg-white/10 p-2 rounded-full hover:bg-gold hover:text-primary-dark transition-all" title="Instagram UESGM">
                                    <Instagram className="w-5 h-5" />
                                </a>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl overflow-hidden shadow-lg h-[400px] border border-gray-200 relative">
                        {/* Google Maps Embed with fallback */}
                        <div className="w-full h-full relative">
                            <iframe
                                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3308.2018899815414!2d-6.8378363!3d33.9510107!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xd9f8bb161109315%3A0x7d6d9348e89f666b!2sAmbassade%20du%20Gabon!5e0!3m2!1sfr!2sma!4v1715424000000!5m2!1sfr!2sma"
                                width="100%"
                                height="100%"
                                style={{ border: 0 }}
                                allowFullScreen={true}
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                                className="w-full h-full hover:shadow-inner transition-all duration-500 absolute inset-0"
                                title="Carte de l'Ambassade du Gabon à Rabat - Siège de l'UESGM"
                            ></iframe>
                            
                            {/* Fallback link when iframe fails */}
                            <noscript>
                                <a 
                                    href="https://www.google.com/maps/dir/?api=1&destination=Ambassade+du+Gabon+Rabat+Maroc"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="absolute inset-0 flex items-center justify-center bg-slate-100 text-primary-dark font-medium"
                                >
                                    <div className="text-center p-4">
                                        <MapPin className="w-8 h-8 mx-auto mb-2 text-gold" />
                                        <p>Cliquez pour ouvrir Google Maps</p>
                                        <p className="text-sm text-muted-foreground">72, Avenue Mehdi Ben Barka, Souissi, Rabat, Maroc</p>
                                    </div>
                                </a>
                            </noscript>
                            
                            {/* Overlay link for full screen */}
                            <a 
                                href="https://www.google.com/maps/dir/?api=1&destination=Ambassade+du+Gabon+Rabat+Maroc"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="absolute bottom-4 right-4 bg-white/90 hover:bg-white text-primary-dark px-4 py-2 rounded-lg shadow-lg text-sm font-medium transition-all hover:scale-105 flex items-center gap-2"
                                title="Ouvrir dans Google Maps"
                            >
                                <MapPin className="w-4 h-4" />
                                Ouvrir dans Google Maps
                            </a>
                        </div>
                    </div>
                </div>

                {/* Formulaire */}
                <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
                    <ContactFormSimple />
                </div>
            </div>
        </div>
        <Toaster 
            position="top-right"
            richColors
            closeButton
            expand={false}
            duration={4000}
        />
        </>
    )
}
