/**
 * Script de seed pour la base de données UESGM
 * 
 * Usage: npx prisma db seed
 * ou: npx tsx prisma/seed.ts
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Début du seed de la base de données UESGM...')

  // ============================================
  // CRÉATION DES COMPTES ADMINISTRATEURS
  // ============================================
  
  // Compte Admin Principal
  const adminPassword = await bcrypt.hash('admin123', 12)
  
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@uesgm.ma' },
    update: {},
    create: {
      email: 'admin@uesgm.ma',
      name: 'Administrateur Principal',
      password: adminPassword,
      role: 'SUPER_ADMIN',
      emailVerified: new Date()
    }
  })
  console.log(`✅ Admin créé: ${adminUser.email}`)

  // Compte President
  const presidentPassword = await bcrypt.hash('president123', 12)
  
  const presidentUser = await prisma.user.upsert({
    where: { email: 'president@uesgm.ma' },
    update: {},
    create: {
      email: 'president@uesgm.ma',
      name: 'Président UESGM',
      password: presidentPassword,
      role: 'ADMIN',
      emailVerified: new Date()
    }
  })
  console.log(`✅ President créé: ${presidentUser.email}`)

  // ============================================
  // CRÉATION DES MEMBRES DU BUREAU EXÉCUTIF
  // ============================================
  
  const executiveMembers = [
    { name: 'Jean-Pierre MAVoungou', position: 'Président', order: 1, bio: 'Étudiant en Master à Rabat', email: 'president@uesgm.ma' },
    { name: 'Marie Louise OBAME', position: 'Vice-Présidente', order: 2, bio: 'Étudiante en Médecine à Casablanca', email: 'vp@uesgm.ma' },
    { name: 'Serge NGOY', position: 'Secrétaire Général', order: 3, bio: 'Étudiant en Droit à Rabat', email: 'sg@uesgm.ma' },
    { name: 'Patrick MPAGA', position: 'Trésorier', order: 4, bio: 'Étudiant en Économie à Rabat', email: 'tresorier@uesgm.ma' },
    { name: 'Flore NZOLO', position: 'Responsale Communication', order: 5, bio: 'Étudiante en Communication à Casablanca', email: 'com@uesgm.ma' },
  ]

  for (const member of executiveMembers) {
    await prisma.executiveMember.create({
      data: member
    })
  }
  console.log(`✅ ${executiveMembers.length} membres du bureau exécutif créés`)

  // ============================================
  // CRÉATION DES PARTENAIRES
  // ============================================
  
  const partners = [
    { name: 'Ambassade du Gabon au Maroc', type: 'INSTITUTIONAL', website: 'https://ambassadegabon.ma' },
    { name: 'Université Mohammed V', type: 'INSTITUTIONAL', website: 'https://um5.ac.ma' },
    { name: 'BGF Bank', type: 'PRIVATE', website: 'https://bgfbank.com' },
  ]

  for (const partner of partners) {
    await prisma.partner.create({
      data: partner
    })
  }
  console.log(`✅ ${partners.length} partenaires créés`)

  // ============================================
  // CRÉATION D'UN ÉVÉNEMENT EXEMPLE
  // ============================================
  
  const event = await prisma.event.create({
    data: {
      title: 'Journée d\'Intégration 2024',
      description: 'Journée d\'intégration des nouveaux étudiants gabonais au Maroc.',
      location: 'Rabat, Maroc',
      date: new Date('2024-10-15T14:00:00Z'),
      slug: 'journee-integration-2024',
      published: true,
      category: 'INTEGRATION',
    }
  })
  console.log(`✅ Événement exemple créé: ${event.title}`)

  // ============================================
  // CRÉATION D'UN PROJET EXEMPLE
  // ============================================
  
  const project = await prisma.project.create({
    data: {
      title: 'Programme de Soutien Scolaire',
      slug: 'programme-soutien-scolaire',
      summary: 'Programme de mentorat et de soutien scolaire pour les étudiants gabonais au Maroc.',
      category: 'EDUCATION',
      status: 'IN_PROGRESS',
      progress: 35,
    }
  })
  console.log(`✅ Projet exemple créé: ${project.title}`)

  // ============================================
  // CRÉATION D'UN DOCUMENT EXEMPLE
  // ============================================
  
  await prisma.document.create({
    data: {
      title: 'Guide d\'Accueil 2024',
      description: 'Guide complet pour les nouveaux étudiants gabonais au Maroc',
      category: 'GUIDE',
      fileUrl: 'https://example.com/guide.pdf',
      fileType: 'application/pdf',
      fileSize: 2500000,
      published: true,
    }
  })
  console.log(`✅ Document exemple créé: Guide d'Accueil 2024`)

  // ============================================
  // CRÉATION DES STATISTIQUES
  // ============================================

  const stats = [
    { key: 'total_members', value: '150' },
    { key: 'total_events', value: '1' },
    { key: 'total_projects', value: '1' },
    { key: 'total_documents', value: '1' },
  ]

  for (const stat of stats) {
    await prisma.statistics.create({
      data: stat
    })
  }
  console.log(`✅ Statistiques initiales créées`)

  console.log('\n🎉 Seed terminé avec succès!')
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
