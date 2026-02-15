import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, Shield, ArrowLeft, Home } from "lucide-react"

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-100 dark:from-slate-900 dark:to-slate-800 px-4">
      <div className="w-full max-w-md">
        {/* Icône d'avertissement */}
        <div className="text-center mb-8">
          <div className="mx-auto h-16 w-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
          <h1 className="text-2xl font-bold font-montserrat text-slate-900 dark:text-white mb-2">
            Accès Non Autorisé
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Vous n&apos;avez pas les permissions nécessaires pour accéder à cette page.
          </p>
        </div>

        {/* Carte d'information */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-red-600" />
              Restrictions d'Accès
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <h3 className="font-semibold text-slate-900 dark:text-white">
                Pourquoi cet accès est bloqué ?
              </h3>
              <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 flex-shrink-0"></span>
                  <span>Vous n&apos;êtes pas connecté avec un compte administrateur</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 flex-shrink-0"></span>
                  <span>Votre compte n&apos;a pas les permissions requises</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 flex-shrink-0"></span>
                  <span>La session a expiré</span>
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-slate-900 dark:text-white">
                Que faire ?
              </h3>
              <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0"></span>
                  <span>Connectez-vous avec un compte administrateur valide</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0"></span>
                  <span>Contactez votre supérieur hiérarchique si besoin d'accès</span>
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 mt-6">
          <Button asChild variant="outline" className="flex-1">
            <Link href="/login" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Retour à la connexion
            </Link>
          </Button>
          <Button asChild className="flex-1">
            <Link href="/" className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              Page d'accueil
            </Link>
          </Button>
        </div>

        {/* Informations de sécurité */}
        <div className="mt-6 text-center">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Cette tentative d'accès non autorisé a été enregistrée pour des raisons de sécurité.
          </p>
          <div className="flex items-center justify-center gap-2 mt-2 text-xs text-slate-500">
            <Shield className="h-3 w-3" />
            <span>Système de sécurité UESGM</span>
          </div>
        </div>
      </div>
    </div>
  )
}
