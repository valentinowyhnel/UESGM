"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { CheckCircle2, Loader2, AlertCircle } from "lucide-react"
import { toast } from "sonner"

export function ContactFormSimple() {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        subject: "",
        message: ""
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        
        // Validation simple
        if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
            toast.error("Veuillez remplir tous les champs obligatoires")
            return
        }
        
        if (!formData.email.includes('@') || !formData.email.includes('.')) {
            toast.error("Veuillez entrer une adresse email valide")
            return
        }
        
        if (formData.message.length < 10) {
            toast.error("Le message doit contenir au moins 10 caractères")
            return
        }
        
        if (isSubmitting) return
        
        setIsSubmitting(true)

        try {
            console.log("📤 Envoi du formulaire simple:", formData)
            
            // Utiliser JSON comme pour l'autre formulaire
            const response = await fetch("/api/contact-v2", {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            })
            
            const result = await response.json()
            
            console.log("📄 Réponse API:", result)
            
            if (response.ok) {
                toast.success("Message envoyé avec succès !")
                setFormData({ name: "", email: "", subject: "", message: "" })
            } else {
                toast.error(result.error || "Erreur lors de l'envoi")
            }
            
        } catch (error) {
            console.error("❌ Erreur formulaire:", error)
            toast.error("Une erreur est survenue")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                <label className="block text-sm font-medium mb-2">Nom complet</label>
                <Input
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Votre nom"
                    disabled={isSubmitting}
                    required
                />
            </div>
            
            <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="votre@email.com"
                    disabled={isSubmitting}
                    required
                />
            </div>
            
            <div>
                <label className="block text-sm font-medium mb-2">Sujet</label>
                <Input
                    value={formData.subject}
                    onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                    placeholder="Sujet de votre message"
                    disabled={isSubmitting}
                />
            </div>
            
            <div>
                <label className="block text-sm font-medium mb-2">Message</label>
                <Textarea
                    value={formData.message}
                    onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                    placeholder="Votre message..."
                    className="min-h-[150px] resize-none"
                    disabled={isSubmitting}
                    maxLength={2000}
                    required
                />
            </div>
            
            <Button 
                type="submit" 
                className="w-full bg-primary hover:bg-blue-700 text-white border-2 border-[#FFD700] font-bold h-12 transition-all duration-200 shadow-lg hover:shadow-[#FFD700]/30" 
                disabled={isSubmitting}
            >
                {isSubmitting ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Envoi en cours...
                    </>
                ) : (
                    "NOUS CONTACTER"
                )}
            </Button>
        </form>
    )
}
