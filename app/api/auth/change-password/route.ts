import { supabaseAdmin } from '@/lib/supabaseServer'
import bcrypt from 'bcryptjs'
import { getServerSession } from '@/lib/session'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  const session = await getServerSession()
  if (!session.userId) return Response.json({ message: 'Необходима авторизация' }, { status: 401 })

  const body = await request.json().catch(() => null) as { currentPassword?: string; newPassword?: string } | null
  if (!body?.currentPassword || !body?.newPassword) {
    return Response.json({ message: 'Укажите текущий и новый пароль' }, { status: 400 })
  }

  const { data: user } = await supabaseAdmin.from('User').select('*').eq('id', session.userId).maybeSingle()
  if (!user) return Response.json({ message: 'Пользователь не найден' }, { status: 404 })

  const ok = await bcrypt.compare(body.currentPassword, user.password)
  if (!ok) return Response.json({ message: 'Неверный текущий пароль' }, { status: 400 })

  const newHash = await bcrypt.hash(body.newPassword, 10)
  const { error } = await supabaseAdmin.from('User').update({ password: newHash }).eq('id', user.id).limit(1)
  if (error) return Response.json({ message: error.message }, { status: 500 })

  return Response.json({ ok: true })
}


