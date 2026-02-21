import type { Metadata } from "next";
import { Inter, Montserrat, Lato, Anton } from "next/font/google";
import "./globals.css";

const anton = Anton({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-brush",
  display: "swap",
});
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-sans", // Utilisé comme police principale
  display: "swap",
});

const lato = Lato({
  weight: ["100", "300", "400", "700"],
  subsets: ["latin"],
  variable: "--font-serif", // Utilisé comme police secondaire
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXTAUTH_URL || "http://localhost:3000"),
  title: {
    default: "UESGM - Union des Étudiants et Stagiaires Gabonais au Maroc",
    template: "%s | UESGM",
  },
  description: "Site officiel de l'UESGM. Plateforme d'accompagnement, d'information et de représentation des étudiants gabonais au Maroc.",
  keywords: ["UESGM", "Gabon", "Maroc", "Étudiants", "Stagiaires", "Bourse", "Études", "Rabat"],
  authors: [{ name: "UESGM Bureau Exécutif" }],
  creator: "UESGM",
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: "https://uesgm.ma",
    title: "UESGM - L'Union fait la force",
    description: "La plateforme officielle pour accompagner, orienter et représenter la communauté estudiantine gabonaise au Royaume du Maroc.",
    siteName: "UESGM",
    images: [
      {
        url: "/images/og-image.jpg", // Prévoir une image par défaut
        width: 1200,
        height: 630,
        alt: "UESGM Accueil",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "UESGM - Union des Étudiants et Stagiaires Gabonais au Maroc",
    description: "Rejoignez la communauté estudiantine gabonaise au Maroc.",
    images: ["/images/og-image.jpg"],
    creator: "@uesgm_officiel",
  },
  icons: {
    icon: "/favicon.ico",
  },
};

import { KonamiEasterEgg } from '@/components/KonamiEasterEgg';

import { Toaster } from "@/components/ui/sonner";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html 
      lang="fr" 
      className={`${inter.variable} ${montserrat.variable} ${lato.variable} ${anton.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-background font-sans antialiased">
        <div className="relative flex min-h-screen flex-col">
          <div className="flex-1">
            {children}
          </div>
        </div>
        <Toaster position="top-right" richColors />
        <KonamiEasterEgg />
      </body>
    </html>
  );
}
