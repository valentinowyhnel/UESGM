const { PrismaClient } = require('@prisma/client');
const { hash } = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const email = 'president@uesgm.ma';
  const password = 'UESGM_President_2025_Secret!';
  
  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email }
  });
  
  if (existingUser) {
    console.log('User already exists:', existingUser.email);
    // Update password
    const hashedPassword = await hash(password, 10);
    await prisma.user.update({
      where: { email },
      data: { password: hashedPassword }
    });
    console.log('Password updated successfully');
  } else {
    // Create new user
    const hashedPassword = await hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        name: 'Président UESGM',
        password: hashedPassword,
        role: 'SUPER_ADMIN'
      }
    });
    console.log('User created:', user.email, 'Role:', user.role);
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
