"use client"

import { useState, Suspense } from "react"
import { signIn } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { Shield, Lock, Mail, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"

function LoginForm() {
    const [isLoading, setIsLoading] = useState(false)
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const router = useRouter()
    const searchParams = useSearchParams()
    const callbackUrl = searchParams.get("callbackUrl") || "/admin/bibliotheque"

    async function handleLogin(e: React.FormEvent) {
        e.preventDefault()
        setIsLoading(true)
        
        console.log("🚀 Tentative de connexion avec:", { email, password: password ? "***" : "vide" })

        try {
            console.log("📤 Envoi des credentials à NextAuth...")
            const result = await signIn("credentials", {
                email,
                password,
                redirect: false,
            })
            
            console.log("📥 Résultat signIn:", result)

            if (result?.error) {
                console.error("❌ Erreur auth:", result.error)
                toast.error("Accès non autorisé.")
                return
            }

            console.log("✅ Connexion réussie, redirection vers:", callbackUrl)
            toast.success("Système déverrouillé.")
            router.push(callbackUrl)
        } catch (error) {
            console.error("❌ Exception lors du login:", error)
            toast.error("Erreur de connexion.")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">Identifiant</label>
                <div className="relative">
                    <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <Input
                        id="email"
                        name="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="admin@uesgm.ma"
                        className="pl-10"
                        required
                    />
                </div>
            </div>
            <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium">Mot de passe</label>
                <div className="relative">
                    <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <Input
                        id="password"
                        name="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="pl-10"
                        required
                    />
                </div>
            </div>
            <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary-dark font-bold py-6"
                disabled={isLoading}
            >
                {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                ) : (
                    <span className="flex items-center gap-2">
                        <Shield className="w-5 h-5" />
                        Authentification
                    </span>
                )}
            </Button>
        </form>
    )
}

export default function PortalPage() {
    return (
        <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
            <Card className="w-full max-w-sm border-2 border-primary/10 shadow-2xl">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl font-bold font-montserrat">Portail Système</CardTitle>
                    <CardDescription>Accès réservé aux administrateurs certifiés.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Suspense fallback={<div className="text-center py-4">Chargement...</div>}>
                        <LoginForm />
                    </Suspense>
                </CardContent>
            </Card>
        </div>
    )
}
