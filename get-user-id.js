const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function getUserId() {
  try {
    const user = await prisma.user.findFirst({
      where: { email: 'admin@example.com' }
    });
    console.log('Admin User ID:', user?.id);
    
    const regularUser = await prisma.user.findFirst({
      where: { email: 'user@example.com' }
    });
    console.log('Regular User ID:', regularUser?.id);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

getUserId();