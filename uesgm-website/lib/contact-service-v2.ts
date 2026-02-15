import { z } from "zod"
import { prisma } from './prisma'
import { ContactRateLimiter } from "./rate-limit"

// Schéma de validation Zod pour la production
export const ContactSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères").max(100),
  email: z.string().email("Email invalide"),
  subject: z.string().max(200).optional(),
  message: z.string().min(10, "Le message doit contenir au moins 10 caractères").max(2000),
  company: z.string().optional() // Honeypot field
})

export type ContactData = z.infer<typeof ContactSchema>

export class SpamDetector {
  static calculateSpamScore(data: ContactData): number {
    let score = 0

    // Détection de mots suspects
    const spamKeywords = [
      'viagra', 'cialis', 'lottery', 'winner', 'congratulations',
      'free money', 'click here', 'limited offer', 'act now',
      'guaranteed', 'risk free', 'special promotion', 'urgent'
    ]

    const text = `${data.subject || ''} ${data.message}`.toLowerCase()
    spamKeywords.forEach(keyword => {
      if (text.includes(keyword)) score += 10
    })

    // Détection de liens excessifs
    const linkCount = (text.match(/https?:\/\//g) || []).length
    score += Math.min(linkCount * 5, 20)

    // Détection de majuscules excessives
    const uppercaseRatio = (data.message.match(/[A-Z]/g) || []).length / data.message.length
    if (uppercaseRatio > 0.5) score += 15

    // Détection de caractères répétitifs
    if (/(.)\1{4,}/.test(data.message)) score += 10

    // Détection email suspect
    if (data.email.includes('+') || data.email.match(/\d{3,}/)) score += 5

    return Math.min(score, 100)
  }

  static isSpam(score: number): boolean {
    return score > 30 // Seuil de spam
  }
}

export const EmailService = {
  async sendNotification(contact: {
    id: string
    name: string
    email: string
    subject?: string
    message: string
  }): Promise<{ success: boolean; error?: string }> {
    try {
      // Simuler l'envoi d'email (à remplacer par un vrai service)
      console.log("📧 Envoi d'email de notification:", {
        to: "contact@uesgm.ma",
        subject: contact.subject || `Nouveau message de ${contact.name}`,
        from: contact.email,
        messageId: contact.id
      })

      // Simulation d'un délai d'envoi
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Simuler un taux d'échec de 10%
      if (Math.random() < 0.1) {
        throw new Error("SMTP timeout")
      }

      return { success: true }
    } catch (error) {
      console.error("❌ Erreur envoi email:", error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Erreur inconnue" 
      }
    }
  }
}

export class ContactServiceV2 {
  static async submitMessage(data: ContactData, metadata: {
    ip: string
    userAgent: string
    country?: string
  }): Promise<{
    success: boolean;
    id: string;
    spamScore: number;
    isSpam: boolean;
    message: string;
  }> {
    const startTime = Date.now()

    try {
      // 1. Calculer score spam
      const spamScore = SpamDetector.calculateSpamScore(data)
      const isSpam = SpamDetector.isSpam(spamScore)

      console.info("🔍 Analyse spam:", {
        email: data.email,
        spamScore,
        isSpam
      })

      // 2. Sauvegarder en base de données (TOUJOURS en premier!)
      const contact = await prisma.contactMessage.create({
        data: {
          name: data.name.trim(),
          email: data.email.toLowerCase().trim(),
          subject: data.subject?.trim() || undefined,
          message: data.message.trim(),
          status: isSpam ? 'SPAM' : 'PENDING',
          spamScore: spamScore,
          ip: metadata.ip,
          userAgent: metadata.userAgent,
          country: metadata.country
        }
      })

      console.info("✅ Message sauvegardé en DB", {
        id: contact.id,
        email: contact.email,
        spamScore,
        isSpam,
        processingTime: Date.now() - startTime
      })

      // 3. Envoyer notification seulement si non-spam
      if (!isSpam) {
        // Préparer les données pour l'email
        const emailData = {
          name: contact.name,
          email: contact.email,
          message: contact.message,
          ...(contact.subject && { subject: contact.subject }) // Inclure le sujet seulement s'il est défini
        };

        // Envoi d'email asynchrone (non bloquant)
        this.sendEmailNotification(contact.id, emailData)
          .catch(error => {
            console.error("❌ Erreur envoi email asynchrone:", error);
          });
      } else {
        console.warn("🚫 Message marqué comme spam, pas d'envoi d'email", {
          id: contact.id,
          spamScore
        })
      }

      return {
        success: true,
        id: contact.id,
        spamScore,
        isSpam,
        message: isSpam 
          ? "Message reçu mais marqué comme spam"
          : "Message reçu avec succès"
      }

    } catch (error) {
      console.error("❌ Erreur traitement message:", {
        error: error instanceof Error ? error.message : error,
        processingTime: Date.now() - startTime,
        data: { email: data.email, name: data.name }
      })

      // En production, envoyer à Sentry
      // Sentry.captureException(error)

      throw new Error("Erreur lors du traitement du message")
    }
  }

  private static async sendEmailNotification(contactId: string, contactData: {
    name: string
    email: string
    subject?: string
    message: string
  }) {
    try {
      console.info("📧 Début envoi email asynchrone:", { contactId })

      const emailResult = await EmailService.sendNotification({
        id: contactId,
        ...contactData
      })

      console.info(`📧 Email ${emailResult.success ? 'envoyé' : 'échoué'}`, {
        contactId,
        email: contactData.email,
        error: emailResult.error
      })

      // Mettre à jour le statut en DB après envoi d'email
      await prisma.contactMessage.update({
        where: { id: contactId },
        data: { 
          status: emailResult.success ? 'SENT' : 'FAILED',
          processedAt: new Date()
        }
      })

    } catch (error) {
      console.error("❌ Erreur envoi email notification:", error)
    }
  }

  static async getMessages(filters?: {
    limit?: number
    offset?: number
  }) {
    return await prisma.contactMessage.findMany({
      orderBy: { createdAt: 'desc' },
      take: filters?.limit || 50,
      skip: filters?.offset || 0
    })
  }

  static async getMessageStats() {
    const total = await prisma.contactMessage.count()
    
    return { 
      total,
      // TODO: Ajouter les stats par statut quand le schéma sera mis à jour
      pending: 0,
      sent: 0,
      failed: 0,
      spam: 0
    }
  }
}
