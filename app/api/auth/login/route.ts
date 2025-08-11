import { prisma } from '@/lib/prisma'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { sessionOptions } from '@/lib/session'
import bcrypt from 'bcryptjs'

export async function POST(request: Request) {
  const { email, password } = await request.json()
  if (!email || !password) return Response.json({ message: 'Введите email и пароль' }, { status: 400 })

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) return Response.json({ message: 'Неверные учетные данные' }, { status: 401 })

  const ok = await bcrypt.compare(password, user.password)
  if (!ok) return Response.json({ message: 'Неверные учетные данные' }, { status: 401 })

  const session = await getIronSession(cookies(), sessionOptions)
  session.userId = user.id
  session.email = user.email
  await session.save()

  return Response.json({ ok: true })
}


