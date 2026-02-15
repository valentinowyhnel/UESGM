"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useState, useCallback } from "react"
import { CheckCircle2, Loader2, AlertCircle } from "lucide-react"
import { toast } from "sonner"

const formSchema = z.object({
    name: z.string()
        .min(2, "Le nom doit contenir au moins 2 caractères.")
        .max(100, "Le nom ne peut pas dépasser 100 caractères.")
        .regex(/^[a-zA-Z\s\-\'À-ÿ]+$/, "Le nom ne peut contenir que des lettres, espaces, tirets et apostrophes."),
    email: z.string()
        .email("Adresse email invalide.")
        .max(255, "L'email ne peut pas dépasser 255 caractères."),
    subject: z.string()
        .min(5, "Le sujet doit contenir au moins 5 caractères.")
        .max(200, "Le sujet ne peut pas dépasser 200 caractères."),
    message: z.string()
        .min(10, "Le message doit contenir au moins 10 caractères.")
        .max(2000, "Le message ne peut pas dépasser 2000 caractères.")
        .trim()
})

export function ContactForm() {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false)
    const [submitCount, setSubmitCount] = useState(0)

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            email: "",
            subject: "",
            message: "",
        },
    })

    const onSubmit = useCallback(async function onSubmit(values: z.infer<typeof formSchema>) {
        // Protection contre les soumissions multiples
        if (isSubmitting) return
        
        // Limite de tentatives (anti-spam)
        if (submitCount >= 5) {
            toast.error("Trop de tentatives. Veuillez réessayer plus tard.")
            return
        }
        
        setIsSubmitting(true)
        setSubmitCount(prev => prev + 1)

        try {
            console.log("📤 Envoi des données:", values)
            
            // Utiliser JSON pour l'envoi - plus simple et plus fiable
            const response = await fetch("/api/contact-v2", {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(values)
            })
            
            console.log("📤 Requête POST envoyée avec JSON")
            
            // Vérification de la réponse
            if (!response.ok) {
                const errorText = await response.text()
                console.error("❌ Erreur HTTP:", response.status, errorText)
                throw new Error(`Erreur ${response.status}: ${errorText}`)
            }
            
            const result = await response.json()
            console.log("✅ Réponse du serveur:", result)

            if (!result.success) {
                throw new Error(result.error || "Erreur lors de l'envoi")
            }

            // Succès
            toast.success("Message envoyé avec succès !")
            setIsSuccess(true)
            form.reset()
            setSubmitCount(0) // Réinitialiser le compteur
            
            // Auto-masquage du message de succès après 8 secondes
            setTimeout(() => {
                setIsSuccess(false)
            }, 8000)
            
        } catch (error: any) {
            console.error("❌ Erreur lors de l'envoi du formulaire:", error)
            
            // Gestion des différents types d'erreurs
            if (error.name === 'AbortError') {
                toast.error("Délai d'attente dépassé. Veuillez réessayer.")
            } else if (error.message?.includes('Failed to fetch')) {
                toast.error("Erreur de connexion. Vérifiez votre internet.")
            } else {
                toast.error(error.message || "Une erreur est survenue. Veuillez réessayer.")
            }
        } finally {
            setIsSubmitting(false)
        }
    }, [isSubmitting, submitCount, form])

    // Pas besoin de handleSubmit personnalisé, React Hook Form gère déjà preventDefault
    // onSubmit={form.handleSubmit(onSubmit)} est suffisant

    if (isSuccess) {
        return (
            <div className="h-full flex flex-col items-center justify-center space-y-4 p-8 bg-green-50 rounded-lg border border-green-200 animate-in fade-in zoom-in duration-300">
                <CheckCircle2 className="w-16 h-16 text-green-600" />
                <h3 className="text-2xl font-bold text-green-800">Message envoyé !</h3>
                <p className="text-center text-green-700 max-w-md">
                    Nous avons bien reçu votre message et nous vous répondrons dans les plus brefs délais.
                </p>
                <Button 
                    onClick={() => {
                        setIsSuccess(false)
                        setSubmitCount(0)
                    }} 
                    variant="outline" 
                    className="mt-4 border-green-600 text-green-700 hover:bg-green-100"
                >
                    Envoyer un autre message
                </Button>
            </div>
        )
    }

    return (
        <Form {...form}>
            <form 
                onSubmit={form.handleSubmit(onSubmit)} 
                className="space-y-6" 
                noValidate
                autoComplete="on"
            >
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Nom complet</FormLabel>
                            <FormControl>
                                <Input 
                                    placeholder="Votre nom" 
                                    {...field} 
                                    autoComplete="name"
                                    disabled={isSubmitting}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                                <Input 
                                    placeholder="votre@email.com" 
                                    type="email"
                                    {...field} 
                                    autoComplete="email"
                                    disabled={isSubmitting}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="subject"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Sujet</FormLabel>
                            <FormControl>
                                <Input 
                                    placeholder="Sujet de votre message" 
                                    {...field} 
                                    autoComplete="off"
                                    disabled={isSubmitting}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="message"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Message</FormLabel>
                            <FormControl>
                                <Textarea 
                                    placeholder="Votre message..." 
                                    className="min-h-[150px] resize-none" 
                                    {...field} 
                                    disabled={isSubmitting}
                                    maxLength={2000}
                                />
                            </FormControl>
                            <div className="text-xs text-gray-500 mt-1">
                                {field.value?.length || 0}/2000 caractères
                            </div>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                {/* Honeypot field - anti-bot */}
                <input
                    name="company"
                    type="text"
                    className="honeypot"
                    tabIndex={-1}
                    autoComplete="off"
                    aria-hidden="true"
                />
                <Button 
                    type="submit" 
                    className="w-full bg-primary hover:bg-primary-light text-white font-bold h-12 transition-all duration-200" 
                    disabled={isSubmitting || submitCount >= 5}
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Envoi en cours...
                        </>
                    ) : submitCount >= 5 ? (
                        <>
                            <AlertCircle className="mr-2 h-4 w-4" />
                            Limite atteinte
                        </>
                    ) : (
                        "Envoyer le message"
                    )}
                </Button>
                
                {submitCount > 0 && submitCount < 5 && (
                    <p className="text-xs text-gray-500 text-center">
                        Tentatives restantes: {5 - submitCount}/5
                    </p>
                )}
            </form>
        </Form>
    )
}
