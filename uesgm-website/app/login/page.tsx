"use client"

import { useState, useEffect } from "react"
import { signIn, getSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff, Shield, Lock, Mail, User, AlertCircle, Loader2 } from "lucide-react"
import { toast } from "sonner"

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")

  // Récupérer l'URL de redirection depuis les paramètres
  const callbackUrl = searchParams.get('callbackUrl') || '/admin/dashboard'

  useEffect(() => {
    // Vérifier si déjà connecté
    const checkSession = async () => {
      const session = await getSession()
      if (session) {
        router.push(callbackUrl)
      }
    }
    checkSession()
  }, [router, callbackUrl])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false
      })

      if (result?.error) {
        setError("Identifiants incorrects")
        toast.error("Identifiants incorrects")
      } else {
        toast.success("Connexion réussie")
        // Rediriger vers l'URL demandée ou vers le dashboard
        router.push(callbackUrl)
      }
    } catch (error) {
      setError("Erreur de connexion")
      toast.error("Erreur de connexion")
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    if (field === 'email') {
      setEmail(value)
    } else if (field === 'password') {
      setPassword(value)
    }
    // Effacer l'erreur quand l'utilisateur tape
    if (error) {
      setError("")
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800 px-4">
      <div className="w-full max-w-md">
        {/* Logo et titre */}
        <div className="text-center mb-8">
          <div className="mx-auto h-12 w-12 bg-primary rounded-full flex items-center justify-center mb-4">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold font-montserrat text-slate-900 dark:text-white">
            UESGM Admin
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
            Console d&apos;administration sécurisée
          </p>
        </div>

        {/* Formulaire de connexion */}
        <Card className="shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-center">
              Connexion Administrateur
            </CardTitle>
            <CardDescription className="text-center">
              Accès réservé au personnel autorisé
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Champ Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email administrateur</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@uesgm.org"
                    value={email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="pl-10"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Champ Mot de passe */}
              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="•••••••••"
                    value={password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className="pl-10 pr-10"
                    required
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-slate-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-slate-400" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Message d'erreur */}
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Bouton de connexion */}
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Connexion en cours...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Se connecter
                  </div>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Informations additionnelles */}
        <div className="mt-6 text-center">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Accès réservé aux administrateurs de l'UESGM
          </p>
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
              <Shield className="h-3 w-3" />
              <span>Connexion sécurisée</span>
            </div>
            <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
              <Lock className="h-3 w-3" />
              <span>Chiffrement SSL/TLS</span>
            </div>
          </div>
        </div>

        {/* Redirection automatique */}
        {callbackUrl !== '/admin/dashboard' && (
          <Alert className="mt-4">
            <AlertDescription>
              Vous serez redirigé vers: <code className="bg-slate-100 px-1 rounded">{callbackUrl}</code>
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  )
}
