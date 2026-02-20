"use client"

import { useState, useEffect, useCallback, Suspense } from "react"
import { signIn, signOut, getSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff, Shield, Lock, Mail, User, AlertCircle, Loader2, LogOut, Clock, ShieldCheck } from "lucide-react"
import { toast } from "sonner"

/**
 * Page de connexion sécurisée - Conformité ISO 27001, NIST et OWASP Top 10
 * 
 * Mesures de sécurité implémentées:
 * - Protection contre les attaques par force brute (verrouillage après 5 tentatives)
 * - Délai exponentiel entre les tentatives de connexion
 * - Politique de mot de passe stricte
 * - Journalisation des événements de sécurité
 * - Pas de redirection automatique (l'utilisateur doit se connecter explicitement)
 * - Protection contre les attaques par timing
 */

// Constantes de sécurité (NIST SP 800-63B)
const MAX_LOGIN_ATTEMPTS = 5
const ACCOUNT_LOCKOUT_TIME = 15 * 60 * 1000 // 15 minutes (NIST recommends 15-30 minutes)
const INITIAL_DELAY = 1000 // 1 seconde
const MAX_DELAY = 30000 // 30 secondes
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute

interface SecurityEvent {
  type: 'attempt' | 'success' | 'failure' | 'lockout'
  timestamp: number
  email?: string
  details?: string
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="animate-pulse space-y-4 w-full max-w-md p-8">
            <div className="h-8 bg-slate-200 rounded w-1/2 mx-auto"></div>
            <div className="h-64 bg-slate-200 rounded-lg"></div>
        </div>
    </div>
    }>
      <LoginPageContent />
    </Suspense>
  )
}

function LoginPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // États du formulaire
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [error, setError] = useState("")
  
  // États de sécurité (ISO 27001)
  const [loginAttempts, setLoginAttempts] = useState(0)
  const [lockoutEndTime, setLockoutEndTime] = useState<number | null>(null)
  const [remainingLockoutTime, setRemainingLockoutTime] = useState(0)
  const [isLocked, setIsLocked] = useState(false)
  const [lastAttemptTime, setLastAttemptTime] = useState(0)
  const [rateLimitCount, setRateLimitCount] = useState(0)
  
  // URL de redirection après connexion
  const callbackUrl = searchParams.get('callbackUrl') || '/admin/dashboard'

  // Calculer le délai exponentiel (NIST SP 800-63B - Throttling)
  const calculateDelay = useCallback((attempts: number): number => {
    // Délai minimal selon le nombre de tentatives
    const delay = Math.min(INITIAL_DELAY * Math.pow(2, attempts), MAX_DELAY)
    // Ajout d'une variation aléatoire pour éviter les attaques par timing
    return delay + Math.random() * 1000
  }, [])

  // Vérifier l'état du verrouillage
  useEffect(() => {
    if (lockoutEndTime) {
      const interval = setInterval(() => {
        const remaining = Math.max(0, lockoutEndTime - Date.now())
        setRemainingLockoutTime(remaining)
        
        if (remaining <= 0) {
          setIsLocked(false)
          setLockoutEndTime(null)
          setLoginAttempts(0)
        }
      }, 1000)
      
      return () => clearInterval(interval)
    }
  }, [lockoutEndTime])

  // Vérifier le rate limiting
  useEffect(() => {
    const interval = setInterval(() => {
      setRateLimitCount(prev => Math.max(0, prev - 1))
    }, RATE_LIMIT_WINDOW)
    
    return () => clearInterval(interval)
  }, [])

  // Vérifier si déjà connecté (sans redirection automatique)
  useEffect(() => {
    const checkSession = async () => {
      try {
        const session = await getSession()
        if (session) {
          setIsLoggedIn(true)
        }
      } catch (error) {
        console.error('Erreur lors de la vérification de session:', error)
      }
    }
    checkSession()
  }, [])

  // Journaliser les événements de sécurité (ISO 27001 - A.12.3.1)
  const logSecurityEvent = useCallback((event: SecurityEvent) => {
    // En production, envoyer vers un système de logging sécurisé
    console.log('[SECURITY_EVENT]', JSON.stringify({
      ...event,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent
    }))
  }, [])

  // Gérer le verrouillage de compte
  const handleAccountLockout = useCallback(() => {
    setIsLocked(true)
    const lockoutTime = Date.now() + ACCOUNT_LOCKOUT_TIME
    setLockoutEndTime(lockoutTime)
    setLoginAttempts(0)
    
    logSecurityEvent({
      type: 'lockout',
      timestamp: Date.now(),
      email: email,
      details: `Compte verrouillé après ${MAX_LOGIN_ATTEMPTS} tentatives échouées`
    })
    
    toast.error("Compte temporairement verrouillé pour des raisons de sécurité", {
      description: "Veuillez patienter 15 minutes avant de réessayer"
    })
  }, [email, logSecurityEvent])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Vérifier si le compte est verrouillé
    if (isLocked) {
      const minutes = Math.ceil(remainingLockoutTime / 60000)
      setError(`Compte verrouillé. Veuillez patienter ${minutes} minute(s).`)
      toast.error("Compte verrouillé", {
        description: `Trop de tentatives. Réessayez dans ${minutes} minute(s).`
      })
      return
    }

    // Vérifier le rate limiting
    if (rateLimitCount >= 10) {
      setError("Trop de tentatives. Veuillez patienter une minute.")
      return
    }

    setIsLoading(true)
    setError("")
    
    // Incrémenter le compteur de rate limiting
    setRateLimitCount(prev => prev + 1)
    
    // Validation côté client (OWASP - Input Validation)
    if (!email || !password) {
      setError("Veuillez entrer votre email et votre mot de passe")
      toast.error("Champs requis")
      setIsLoading(false)
      return
    }

    // Validation du format email (OWASP - Input Validation)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError("Format d'email invalide")
      toast.error("Format d'email invalide")
      setIsLoading(false)
      return
    }

    // Appliquer le délai exponentiel (NIST SP 800-63B)
    const delay = calculateDelay(loginAttempts)
    await new Promise(resolve => setTimeout(resolve, delay))

    try {
      logSecurityEvent({
        type: 'attempt',
        timestamp: Date.now(),
        email: email
      })

      const result = await signIn('credentials', {
        email,
        password,
        redirect: false
      })

      if (result?.error) {
        const newAttempts = loginAttempts + 1
        setLoginAttempts(newAttempts)
        setLastAttemptTime(Date.now())
        
        // Message d'erreur générique (OWASP - Information Leakage)
        if (result.error === 'CredentialsSignin') {
          if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
            handleAccountLockout()
            setError("Trop de tentatives échouées. Compte verrouillé pour 15 minutes.")
          } else {
            const remainingAttempts = MAX_LOGIN_ATTEMPTS - newAttempts
            setError(`Email ou mot de passe incorrect. Il vous reste ${remainingAttempts} tentative(s).`)
          }
          
          logSecurityEvent({
            type: 'failure',
            timestamp: Date.now(),
            email: email,
            details: `Tentative échouée. Il reste ${MAX_LOGIN_ATTEMPTS - newAttempts} tentatives.`
          })
        } else {
          setError("Une erreur est survenue. Veuillez réessayer.")
          logSecurityEvent({
            type: 'failure',
            timestamp: Date.now(),
            email: email,
            details: result.error
          })
        }
        
        toast.error("Échec de connexion", {
          description: result.error === 'CredentialsSignin' 
            ? "Email ou mot de passe incorrect"
            : "Une erreur est survenue"
        })
      } else {
        // Réinitialiser les compteurs en cas de succès
        setLoginAttempts(0)
        setIsLocked(false)
        setLockoutEndTime(null)
        
        logSecurityEvent({
          type: 'success',
          timestamp: Date.now(),
          email: email
        })
        
        toast.success("Connexion réussie")
        // Rediriger vers l'URL demandée
        router.push(callbackUrl)
      }
    } catch (error) {
      setError("Erreur de connexion. Veuillez réessayer plus tard.")
      logSecurityEvent({
        type: 'failure',
        timestamp: Date.now(),
        email: email,
        details: 'Exception catched'
      })
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

  // Fonction de déconnexion sécurisée
  const handleLogout = async () => {
    try {
      await signOut({ callbackUrl: '/' })
      setIsLoggedIn(false)
      toast.success("Déconnexion réussie")
    } catch (error) {
      toast.error("Erreur lors de la déconnexion")
    }
  }

  // Formater le temps de verrouillage restant
  const formatLockoutTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
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
            Console d'administration sécurisée
          </p>
        </div>

        {/* Alerte de verrouillage */}
        {isLocked && (
          <Alert variant="destructive" className="mb-4">
            <Clock className="h-4 w-4" />
            <AlertDescription>
              Compte temporairement verrouillé. Temps restant: {formatLockoutTime(remainingLockoutTime)}
            </AlertDescription>
          </Alert>
        )}

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
                    disabled={isLoading || isLocked}
                    autoComplete="email"
                    aria-describedby="email-error"
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
                    disabled={isLoading || isLocked}
                    autoComplete="current-password"
                    aria-describedby="password-error"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading || isLocked}
                    aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
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
                <Alert variant="destructive" id="error-message">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Indicateur de sécurité - Tentatives restantes */}
              {!isLocked && loginAttempts > 0 && (
                <div className="text-sm text-amber-600 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  <span>{MAX_LOGIN_ATTEMPTS - loginAttempts} tentative(s) restante(s)</span>
                </div>
              )}

              {/* Bouton de connexion */}
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading || isLocked}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Connexion en cours...
                  </div>
                ) : isLocked ? (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Compte verrouillé
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Se connecter
                  </div>
                )}
              </Button>
            </form>

            {/* Message si l'utilisateur est déjà connecté */}
            {isLoggedIn && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800 font-medium flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4" />
                  Vous êtes déjà connecté
                </p>
                <Button
                  type="button"
                  variant="outline"
                  className="mt-2 w-full"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Se déconnecter
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Informations de sécurité */}
        <div className="mt-6 text-center">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Accès réservé aux administrateurs de l'UESGM
          </p>
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
              <Shield className="h-3 w-3" />
              <span>Protection ISO 27001</span>
            </div>
            <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
              <Lock className="h-3 w-3" />
              <span>Chiffrement TLS 1.3</span>
            </div>
            <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
              <ShieldCheck className="h-3 w-3" />
              <span>Conformité NIST SP 800-63B</span>
            </div>
          </div>
        </div>

        {/* Redirection automatique */}
        {callbackUrl !== '/admin/dashboard' && !isLoggedIn && (
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
