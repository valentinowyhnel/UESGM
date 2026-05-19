/**
 * Script de seed pour la base de données UESGM
 * 
 * Usage: npx prisma db seed
 * ou: npx tsx prisma/seed.ts
 */

import { PrismaClient, Role, PartnerType, EventStatus, EventCategory, ProjectStatus, ProjectCategory, DocumentCategory, DocumentVisibility } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Début du seed de la base de données UESGM...')

  // ============================================
  // CRÉATION DES COMPTES ADMINISTRATEURS
  // ============================================
  
  // Compte Admin Principal
  const adminPassword = await bcrypt.hash('7d99755735371a9f891309e336bf8f71', 12)
  
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@uesgm.ma' },
    update: {},
    create: {
      email: 'admin@uesgm.ma',
      name: 'Administrateur Principal',
      password: adminPassword,
      role: Role.SUPER_ADMIN,
      emailVerified: new Date()
    }
  })
  console.log(`✅ Admin créé: ${adminUser.email}`)

  // Compte President
  const presidentPassword = await bcrypt.hash('UESGM_President_2025_Secret!', 12)
  
  const presidentUser = await prisma.user.upsert({
    where: { email: 'president@uesgm.ma' },
    update: {},
    create: {
      email: 'president@uesgm.ma',
      name: 'Président UESGM',
      password: presidentPassword,
      role: Role.ADMIN,
      emailVerified: new Date()
    }
  })
  console.log(`✅ President créé: ${presidentUser.email}`)

  // Compte Moderator
  const moderatorPassword = await bcrypt.hash('Moderator_2025!', 12)
  const moderatorUser = await prisma.user.upsert({
    where: { email: 'mod@uesgm.ma' },
    update: {},
    create: {
      email: 'mod@uesgm.ma',
      name: 'Modérateur',
      password: moderatorPassword,
      role: Role.MODERATOR,
      emailVerified: new Date()
    }
  })
  console.log(`✅ Moderator créé: ${moderatorUser.email}`)

  // ============================================
  // CRÉATION DES MEMBRES DU BUREAU EXÉCUTIF
  // ============================================
  
  const executiveMembers = [
    { name: 'Jean-Pierre MAVoungou', position: 'Président', order: 1, bio: 'Étudiant en Master à Rabat' },
    { name: 'Marie Louise OBAME', position: 'Vice-Présidente', order: 2, bio: 'Étudiante en Médecine à Casablanca' },
    { name: 'Serge NGOY', position: 'Secrétaire Général', order: 3, bio: 'Étudiant en Droit à Rabat' },
    { name: 'Patrick MPAGA', position: 'Trésorier', order: 4, bio: 'Étudiant en Économie à Rabat' },
    { name: 'Flore NZOLO', position: 'Responsale Communication', order: 5, bio: 'Étudiante en Communication à Casablanca' },
  ]

  for (const member of executiveMembers) {
    await prisma.executiveMember.upsert({
      where: { email: member.name.toLowerCase().replace(/ /g, '.') + '@uesgm.ma' },
      update: {
        photoUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.name}`
      },
      create: {
        name: member.name,
        position: member.position,
        email: member.name.toLowerCase().replace(/ /g, '.') + '@uesgm.ma',
        order: member.order,
        bio: member.bio,
        photoUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.name}`
      }
    })
  }
  console.log(`✅ ${executiveMembers.length} membres du bureau exécutif créés`)

  // ============================================
  // CRÉATION DES ANTENNES RÉGIONALES
  // ============================================
  
  const antennes = [
    { name: 'Antenne Rabat-Salé', city: 'Rabat', country: 'Maroc', memberCount: 45 },
    { name: 'Antenne Casablanca', city: 'Casablanca', country: 'Maroc', memberCount: 38 },
    { name: 'Antenne Marrakech', city: 'Marrakech', country: 'Maroc', memberCount: 22 },
    { name: 'Antenne Fès', city: 'Fès', country: 'Maroc', memberCount: 18 },
    { name: 'Antenne Tanger', city: 'Tanger', country: 'Maroc', memberCount: 15 },
    { name: 'Antenne Agadir', city: 'Agadir', country: 'Maroc', memberCount: 12 },
  ]

  for (const antenne of antennes) {
    await prisma.antenne.upsert({
      where: { city: antenne.city },
      update: {},
      create: antenne
    })
  }
  console.log(`✅ ${antennes.length} antennes régionales créées`)

  // ============================================
  // CRÉATION DES PARTENAIRES
  // ============================================
  
  const partners = [
    { name: 'Ambassade du Gabon au Maroc', type: PartnerType.INSTITUTIONAL, order: 1, logoUrl: 'https://placehold.co/200x200?text=Ambassade' },
    { name: 'Université Mohammed V', type: PartnerType.INSTITUTIONAL, order: 2, logoUrl: 'https://placehold.co/200x200?text=UM5' },
    { name: 'Université Hassan II', type: PartnerType.INSTITUTIONAL, order: 3, logoUrl: 'https://placehold.co/200x200?text=UH2' },
    { name: 'OCSID', type: PartnerType.ASSOCIATION, order: 4, logoUrl: 'https://placehold.co/200x200?text=OCSID' },
    { name: 'BGF', type: PartnerType.PRIVATE, order: 5, logoUrl: 'https://placehold.co/200x200?text=BGF' },
  ]

  for (const partner of partners) {
    await prisma.partner.upsert({
      where: { name: partner.name },
      update: {
        logoUrl: partner.logoUrl
      },
      create: partner
    })
  }
  console.log(`✅ ${partners.length} partenaires créés`)

  // ============================================
  // CRÉATION DES STATISTIQUES
  // ============================================
  
  await prisma.statistics.upsert({
    where: { key: 'global' },
    update: {
      value: JSON.stringify({
        totalMembers: 150,
        totalAntennes: antennes.length,
        totalEvents: 1,
        totalProjects: 1,
        totalDocuments: 1
      })
    },
    create: {
      key: 'global',
      value: JSON.stringify({
        totalMembers: 150,
        totalAntennes: antennes.length,
        totalEvents: 1,
        totalProjects: 1,
        totalDocuments: 1
      }),
      totalMembers: 150,
      totalAntennes: antennes.length,
      totalEvents: 1,
      totalProjects: 1,
      totalDocuments: 1
    }
  })
  console.log(`✅ Statistiques initiales créées`)

  // ============================================
  // CRÉATION D'UN ÉVÉNEMENT EXEMPLE
  // ============================================
  
  const event = await prisma.event.upsert({
    where: { slug: 'journee-integration-2024' },
    update: {
      published: true,
      isPast: false
    },
    create: {
      title: 'Journée d\'Intégration 2024',
      description: 'Journée d\'intégration des nouveaux étudiants gabonais au Maroc. Au programme: activités culturelles, rencontres et networking.',
      location: 'Rabat, Maroc',
      startDate: new Date('2024-10-15T14:00:00Z'),
      slug: 'journee-integration-2024',
      status: EventStatus.PUBLISHED,
      category: EventCategory.INTEGRATION,
      publishedAt: new Date(),
      published: true,
      isPast: false,
      maxAttendees: 100,
      createdById: adminUser.id
    }
  })
  console.log(`✅ Événement exemple créé: ${event.title}`)

  // ============================================
  // CRÉATION D'UN PROJET EXEMPLE
  // ============================================
  
  const project = await prisma.project.upsert({
    where: { slug: 'programme-soutien-scolaire' },
    update: {
      published: true,
      summary: 'Mentorat et soutien pour les étudiants gabonais'
    },
    create: {
      title: 'Programme de Soutien Scolaire',
      slug: 'programme-soutien-scolaire',
      description: 'Programme de mentorat et de soutien scolaire pour les étudiants gabonais au Maroc. Nous aidons les nouveaux étudiants à s\'adapter au système éducatif marocain.',
      shortDesc: 'Mentorat et soutien pour les étudiants',
      summary: 'Mentorat et soutien pour les étudiants gabonais',
      category: ProjectCategory.EDUCATION,
      status: ProjectStatus.IN_PROGRESS,
      progress: 35,
      published: true,
      isPublished: true,
      startDate: new Date('2024-09-01'),
      createdById: adminUser.id
    }
  })
  console.log(`✅ Projet exemple créé: ${project.title}`)

  // ============================================
  // CRÉATION D'UN DOCUMENT EXEMPLE
  // ============================================
  
  await prisma.document.upsert({
    where: { slug: 'guide-accueil-2024' },
    update: {
      published: true,
      fileType: 'application/pdf'
    },
    create: {
      title: 'Guide d\'Accueil 2024',
      slug: 'guide-accueil-2024',
      description: 'Guide complet pour les nouveaux étudiants gabonais au Maroc',
      category: DocumentCategory.GUIDE,
      visibility: DocumentVisibility.PUBLIC,
      fileUrl: 'https://example.com/guide.pdf',
      fileName: 'guide-accueil-2024.pdf',
      fileSize: 2500000,
      mimeType: 'application/pdf',
      fileType: 'application/pdf',
      published: true,
      isPublished: true,
      downloads: 0,
      createdById: adminUser.id
    }
  })
  console.log(`✅ Document exemple créé: Guide d'Accueil 2024`)

  console.log('\n🎉 Seed terminé avec succès!')
  console.log('\n📋 Comptes administrateur:')
  console.log('   - Admin: admin@uesgm.ma / 7d99755735371a9f891309e336bf8f71 (SUPER_ADMIN)')
  console.log('   - President: president@uesgm.ma / UESGM_President_2025_Secret! (ADMIN)')
  console.log('   - Moderator: mod@uesgm.ma / Moderator_2025! (MODERATOR)')
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
