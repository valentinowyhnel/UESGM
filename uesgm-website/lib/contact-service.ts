import { z } from "zod"
import { prisma } from "./prisma"
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

    const text = `${data.subject} ${data.message}`.toLowerCase()
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

export class EmailService {
  static async sendNotification(contact: {
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
        subject: `Nouveau message de ${contact.name}`,
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

export class ContactService {
  static async submitMessage(data: ContactData, metadata: {
    ip: string
    userAgent: string
    country?: string
  }) {
    const startTime = Date.now()

    try {
      // 1. Calculer score spam
      const spamScore = SpamDetector.calculateSpamScore(data)
      const isSpam = SpamDetector.isSpam(spamScore)

      // 2. Déterminer le statut initial
      const status: 'PENDING' | 'SPAM' = isSpam ? 'SPAM' : 'PENDING'

      // 3. Sauvegarder en base de données (TOUJOURS en premier!)
      const contact = await prisma.contactMessage.create({
        data: {
          name: data.name.trim(),
          email: data.email.toLowerCase().trim(),
          subject: data.subject?.trim() || "",
          message: data.message.trim(),
          // ip: metadata.ip, // Commenté car n'existe pas encore
          // userAgent: metadata.userAgent, // Commenté car n'existe pas encore
          // country: metadata.country, // Commenté car n'existe pas encore
          // spamScore, // Commenté car n'existe pas encore
          // status, // Commenté car n'existe pas encore
        }
      })

      console.info("✅ Message sauvegardé en DB", {
        id: contact.id,
        email: contact.email,
        spamScore,
        status,
        processingTime: Date.now() - startTime
      })

      // 4. Envoyer notification seulement si non-spam
      if (!isSpam) {
        // Async email sending (non bloquant)
        this.sendEmailNotification(contact.id).catch(error => {
          console.error("❌ Erreur envoi email asynchrone:", error)
        })
      } else {
        console.warn("🚫 Message marqué comme spam, pas d'envoi d'email", {
          id: contact.id,
          spamScore
        })
      }

      return {
        success: true,
        id: contact.id,
        status,
        spamScore,
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

  private static async sendEmailNotification(contactId: string) {
    try {
      const contact = await prisma.contactMessage.findUnique({
        where: { id: contactId }
      })

      if (!contact) {
        throw new Error("Contact non trouvé")
      }

      // Mettre à jour le statut à ENVOI_EN_COURS
      await prisma.contactMessage.update({
        where: { id: contactId },
        data: { status: 'PENDING' } // Garder PENDING pendant l'envoi
      })

      // Envoyer l'email
      const emailResult = await EmailService.sendNotification({
        id: contact.id,
        name: contact.name,
        email: contact.email,
        subject: contact.subject || undefined,
        message: contact.message
      })

      // Mettre à jour le statut final
      const finalStatus = emailResult.success ? 'SENT' : 'FAILED'
      await prisma.contactMessage.update({
        where: { id: contactId },
        data: { 
          status: finalStatus,
          processedAt: new Date()
        }
      })

      console.info(`📧 Email ${finalStatus.toLowerCase()}`, {
        contactId,
        email: contact.email,
        error: emailResult.error
      })

    } catch (error) {
      console.error("❌ Erreur envoi email notification:", error)
      
      // Marquer comme FAILED
      await prisma.contactMessage.update({
        where: { id: contactId },
        data: { 
          status: 'FAILED',
          processedAt: new Date()
        }
      })
    }
  }

  static async getMessages(filters?: {
    status?: 'PENDING' | 'SENT' | 'FAILED' | 'SPAM'
    limit?: number
    offset?: number
  }) {
    return await prisma.contactMessage.findMany({
      where: filters?.status ? { status: filters.status } : undefined,
      orderBy: { createdAt: 'desc' },
      take: filters?.limit || 50,
      skip: filters?.offset || 0
    })
  }

  static async getMessageStats() {
    const [total, pending, sent, failed, spam] = await Promise.all([
      prisma.contactMessage.count(),
      prisma.contactMessage.count({ where: { status: 'PENDING' } }),
      prisma.contactMessage.count({ where: { status: 'SENT' } }),
      prisma.contactMessage.count({ where: { status: 'FAILED' } }),
      prisma.contactMessage.count({ where: { status: 'SPAM' } })
    ])

    return { total, pending, sent, failed, spam }
  }
}
