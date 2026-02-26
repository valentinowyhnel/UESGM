import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Début du seed de la base de données UESGM...')

  // 1. ADMIN USERS
  const adminPassword = await bcrypt.hash('admin123', 12)
  
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@uesgm.ma' },
    update: {},
    create: {
      email: 'admin@uesgm.ma',
      name: 'Super Admin',
      password: adminPassword,
      role: 'SUPER_ADMIN',
    }
  })
  console.log(`✅ Admin créé: ${adminUser.email}`)

  // 2. EXECUTIVE MEMBERS
  const members = [
    { name: 'Jean Mvoulana', position: 'Président', email: 'jean@uesgm.ma', order: 1, bio: 'Étudiant en master' },
    { name: 'Alice Obame', position: 'Secrétaire', email: 'alice@uesgm.ma', order: 2, bio: 'Étudiante en licence' },
  ]

  for (const member of members) {
    await prisma.executiveMember.create({
      data: member
    })
  }
  console.log(`✅ ${members.length} membres créés`)

  // 3. EVENTS
  await prisma.event.create({
    data: {
      title: 'Journée d\'Intégration 2025',
      slug: 'integration-2025',
      description: 'Bienvenue aux nouveaux arrivants !',
      date: new Date('2025-10-15'),
      location: 'Rabat',
      category: 'Social',
      published: true,
    }
  })
  console.log('✅ Événement créé')

  // 4. PARTNERS
  await prisma.partner.create({
    data: {
      name: 'Ambassade du Gabon',
      type: 'Institutionnel',
      website: 'https://ambassade-gabon.ma',
    }
  })
  console.log('✅ Partenaire créé')

  // 5. PROJECTS
  await prisma.project.create({
    data: {
      title: 'Bibliothèque Numérique',
      slug: 'biblio-numerique',
      status: 'En cours',
      progress: 45,
      summary: 'Accès aux ressources académiques en ligne.',
    }
  })
  console.log('✅ Projet créé')

  // 6. STATISTICS
  await prisma.statistics.upsert({
    where: { key: 'total_members' },
    update: {},
    create: {
      key: 'total_members',
      value: '1500',
    }
  })
  console.log('✅ Statistique créée')

  console.log('🎉 Seed terminé !')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
