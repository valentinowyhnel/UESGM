import { PrismaClient, Role, EventStatus, EventCategory, ProjectStatus, ProjectCategory, DocumentCategory, DocumentVisibility, PartnerType } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const hashedPassword = await bcrypt.hash('admin123', 10)

  // Seed Admin User
  const admin = await prisma.user.upsert({
    where: { email: 'admin@uesgm.ma' },
    update: {},
    create: {
      email: 'admin@uesgm.ma',
      name: 'Admin UESGM',
      password: hashedPassword,
      role: Role.SUPER_ADMIN,
      emailVerified: new Date(),
    },
  })

  // Seed Executive Member
  await prisma.executiveMember.create({
    data: {
      name: 'MINTSA NDONG Emery Désiré',
      position: 'Président',
      email: 'president@uesgm.ma',
      order: 0,
      bio: 'Président de l\'UESGM',
    },
  })

  // Seed Event
  await prisma.event.create({
    data: {
      title: 'Journée d\'Intégration 2026',
      description: 'Bienvenue aux nouveaux étudiants gabonais au Maroc.',
      location: 'Rabat',
      startDate: new Date('2026-09-15T10:00:00Z'),
      category: EventCategory.INTEGRATION,
      status: EventStatus.PUBLISHED,
      published: true,
      slug: 'journee-integration-2026',
      createdById: admin.id,
    },
  })

  // Seed Project
  await prisma.project.create({
    data: {
      title: 'Guide de l\'Étudiant 2026',
      description: 'Un guide complet pour les étudiants gabonais au Maroc.',
      shortDesc: 'Guide complet pour les étudiants.',
      category: ProjectCategory.EDUCATION,
      status: ProjectStatus.IN_PROGRESS,
      progress: 50,
      slug: 'guide-etudiant-2026',
      published: true,
      createdById: admin.id,
    },
  })

  // Seed Statistics
  await prisma.statistics.upsert({
    where: { key: 'total_members' },
    update: {},
    create: { key: 'total_members', value: '1500' },
  })

  console.log('✅ Seed completed')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
