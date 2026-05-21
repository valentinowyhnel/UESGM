import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  const hashedPassword = await bcrypt.hash("admin123", 10)

  // Seed Super Admin
  await prisma.user.upsert({
    where: { email: "admin@uesgm.ma" },
    update: {},
    create: {
      email: "admin@uesgm.ma",
      name: "Super Admin",
      password: hashedPassword,
      role: "SUPER_ADMIN",
    },
  })

  // Seed some statistics
  await prisma.statistics.upsert({
    where: { key: "total_members" },
    update: {},
    create: {
      key: "total_members",
      value: "1250",
    },
  })

  console.log("Seeding completed.")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
