/**
 * @file lib/auth.ts
 * 
 * Ce fichier exporte les options d'authentification NextAuth de manière sécurisée.
 * NE PAS modifier ce fichier pour ajouter des providers - utiliser lib/auth/auth-options.ts
 */

import NextAuth from "next-auth"
import { authOptions } from "./auth/auth-options"
import { getServerSession } from "next-auth"

// Créer le handler NextAuth avec les options
const handler = NextAuth(authOptions)

// Exporter les fonctions GET et POST pour le route handler
export const { GET, POST } = handler

// Fonction auth pour les Server Components (NextAuth v4)
export async function auth() {
  const session = await getServerSession(authOptions)
  return session
}

// Pour utiliser getServerSession dans les API routes et Server Components
export { handler as default, authOptions }
