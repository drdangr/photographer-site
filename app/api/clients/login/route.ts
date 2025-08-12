import { supabaseAdmin } from '@/lib/supabaseServer'
import bcrypt from 'bcryptjs'
import { getServerSession } from '@/lib/session'

export async function POST(request: Request) {
  const { email, password } = await request.json()
  if (!email || !password) return Response.json({ message: 'Введите email и пароль' }, { status: 400 })

  const { data: user } = await supabaseAdmin.from('ClientUser').select('*').eq('email', email).maybeSingle()
  if (!user) return Response.json({ message: 'Неверные учетные данные' }, { status: 401 })
  const ok = await bcrypt.compare(password, user.password as string)
  if (!ok) return Response.json({ message: 'Неверные учетные данные' }, { status: 401 })

  const session = await getServerSession()
  ;(session as any).clientUserId = user.id
  await session.save()
  return Response.json({ ok: true })
}


