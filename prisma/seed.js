/* eslint-disable no-console */
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const passwordHash = await bcrypt.hash('admin1234', 10)

  await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      password: passwordHash,
      name: 'Admin'
    }
  })

  await prisma.authorProfile.upsert({
    where: { id: 1 },
    update: {},
    create: {
      fullName: 'Имя Фамилия',
      bioMarkdown: 'Профессиональный фотограф. Специализация: портрет, репортаж, предметная съемка.',
      contacts: JSON.stringify({
        email: 'contact@example.com',
        instagram: 'https://instagram.com/yourprofile'
      })
    }
  })

  await prisma.serviceOffering.upsert({
    where: { slug: 'portrait' },
    update: {},
    create: { title: 'Портретная съемка', slug: 'portrait', description: 'Студия/улица, 1.5 часа', price: 5000, currency: 'RUB' }
  })
  await prisma.serviceOffering.upsert({
    where: { slug: 'reportage' },
    update: {},
    create: { title: 'Репортаж', slug: 'reportage', description: 'События, концерты', price: 8000, currency: 'RUB' }
  })

  await prisma.educationOffering.upsert({
    where: { slug: 'workshop' },
    update: {},
    create: { kind: 'WORKSHOP', title: 'Мастер-класс', slug: 'workshop', description: 'Интенсив на 1 день', price: 3000, currency: 'RUB' }
  })
  await prisma.educationOffering.upsert({
    where: { slug: 'course-5' },
    update: {},
    create: { kind: 'COURSE', title: 'Курс из 5 лекций', slug: 'course-5', description: 'Основы фотографии', price: 12000, currency: 'RUB' }
  })
  await prisma.educationOffering.upsert({
    where: { slug: 'academic' },
    update: {},
    create: { kind: 'ACADEMIC', title: 'Академический курс', slug: 'academic', description: 'Для групп и вузов', price: 0, currency: 'RUB' }
  })

  console.log('Seed done')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })


