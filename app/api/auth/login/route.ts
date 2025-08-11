import { supabaseAdmin } from '@/lib/supabaseServer'
import { getServerSession } from '@/lib/session'
import bcrypt from 'bcryptjs'

export async function POST(request: Request) {
  const { email, password } = await request.json()
  if (!email || !password) return Response.json({ message: 'Введите email и пароль' }, { status: 400 })

  const { data: user } = await supabaseAdmin
    .from('User')
    .select('*')
    .eq('email', email)
    .maybeSingle()
  if (!user) return Response.json({ message: 'Неверные учетные данные' }, { status: 401 })

  const ok = await bcrypt.compare(password, user.password)
  if (!ok) return Response.json({ message: 'Неверные учетные данные' }, { status: 401 })

  const session = await getServerSession()
  session.userId = user.id as number
  session.email = user.email as string
  await session.save()

  return Response.json({ ok: true })
}


