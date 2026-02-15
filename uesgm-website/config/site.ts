import type { Metadata } from "next"

export const siteConfig = {
  name: "UESGM - Union des Étudiants Gabonais au Maroc",
  description: "L'Union des Étudiants Gabonais au Maroc (UESGM) est une association étudiante qui œuvre pour le bien-être et l'épanouissement des étudiants gabonais au Maroc.",
  url: process.env.NEXTAUTH_URL || "http://localhost:3000",
  ogImage: "/images/uesgm-logo.png",
  links: {
    twitter: "https://twitter.com/UESGM_Maroc",
    github: "https://github.com/uesgm",
  },
}

export const metadataBase = new URL(siteConfig.url)

export type SiteConfig = typeof siteConfig
