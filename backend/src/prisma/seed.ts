import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create a demo user
  const hashedPassword = await bcrypt.hash('demo123', 12)
  
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@fashionagent.com' },
    update: {},
    create: {
      email: 'demo@fashionagent.com',
      passwordHash: hashedPassword,
      profile: {
        create: {
          skinTone: 'medium',
          build: 'athletic',
          faceStructure: 'oval',
          hairType: 'wavy',
          height: 175,
          weight: 70,
        }
      }
    },
    include: {
      profile: true
    }
  })

  console.log('✅ Demo user created:', { 
    email: demoUser.email, 
    id: demoUser.id 
  })

  console.log('🎉 Database seeded successfully!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Seeding failed:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
