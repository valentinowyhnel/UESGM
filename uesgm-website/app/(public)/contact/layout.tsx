import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Contactez-nous - UESGM",
  description: "Contactez l'Union des Étudiants Gabonais au Maroc pour toute question, suggestion ou information. Notre équipe est à votre écoute.",
  metadataBase: new URL(process.env.NEXTAUTH_URL || "http://localhost:3000"),
  openGraph: {
    title: "Contactez-nous - UESGM",
    description: "Contactez l'Union des Étudiants Gabonais au Maroc pour toute question, suggestion ou information.",
    url: "/contact",
    type: "website",
    images: [
      {
        url: "/images/uesgm-logo.png",
        width: 1200,
        height: 630,
        alt: "UESGM - Contact",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Contactez-nous - UESGM",
    description: "Contactez l'Union des Étudiants Gabonais au Maroc pour toute question, suggestion ou information.",
    images: ["/images/uesgm-logo.png"],
  },
}

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
