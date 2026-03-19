import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // 1. Create Admins
  const adminPassword = await bcrypt.hash('7d99755735371a9f891309e336bf8f71', 12)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@uesgm.ma' },
    update: {},
    create: {
      email: 'admin@uesgm.ma',
      name: 'Super Admin',
      password: adminPassword,
      role: 'SUPER_ADMIN',
      emailVerified: new Date(),
    },
  })
  console.log(`✅ Created admin: ${admin.email}`)

  // 2. Create Executive Members
  const members = [
    { name: 'John Doe', position: 'Président', order: 1, bio: 'Étudiant en Master' },
    { name: 'Jane Smith', position: 'Secrétaire Générale', order: 2, bio: 'Étudiante en Droit' },
  ]
  for (const m of members) {
    await prisma.executiveMember.upsert({
      where: { email: m.name.toLowerCase().replace(/ /g, '.') + '@uesgm.ma' },
      update: {},
      create: { ...m, email: m.name.toLowerCase().replace(/ /g, '.') + '@uesgm.ma' }
    })
  }
  console.log('✅ Created executive members')

  // 3. Create Partners
  const partners = [
    { name: 'Ambassade du Gabon', type: 'INSTITUTIONAL', order: 1 },
    { name: 'University X', type: 'INSTITUTIONAL', order: 2 },
  ]
  for (const p of partners) {
    await prisma.partner.upsert({
      where: { name: p.name },
      update: {},
      create: p as any
    })
  }
  console.log('✅ Created partners')

  // 4. Create an Event
  await prisma.event.upsert({
    where: { slug: 'welcome-day-2025' },
    update: {},
    create: {
      title: 'Welcome Day 2025',
      slug: 'welcome-day-2025',
      description: 'Journée d’accueil des nouveaux étudiants.',
      location: 'Rabat',
      startDate: new Date('2025-09-01'),
      category: 'INTEGRATION',
      status: 'PUBLISHED',
      published: true,
      createdById: admin.id,
    }
  })
  console.log('✅ Created initial event')

  console.log('🚀 Seed complete!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
