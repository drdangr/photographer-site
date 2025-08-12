import { getServerSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabaseServer'
import bcrypt from 'bcryptjs'

export default async function AccountPage() {
  const session = await getServerSession()
  if (!session.userId) {
    return <div className="text-sm text-slate-600">Нужно войти</div>
  }
  return (
    <section className="max-w-md">
      <h1 className="text-xl font-semibold mb-4">Смена пароля</h1>
      <form action={changePassword} className="space-y-3">
        <div>
          <label className="block text-sm mb-1">Текущий пароль</label>
          <input name="currentPassword" type="password" required className="border rounded p-2 w-full" />
        </div>
        <div>
          <label className="block text-sm mb-1">Новый пароль</label>
          <input name="newPassword" type="password" required minLength={8} className="border rounded p-2 w-full" />
        </div>
        <button className="bg-slate-900 text-white px-4 py-2 rounded">Сохранить</button>
      </form>
    </section>
  )
}

async function changePassword(formData: FormData) {
  'use server'
  const currentPassword = String(formData.get('currentPassword') || '')
  const newPassword = String(formData.get('newPassword') || '')
  if (!currentPassword || !newPassword) throw new Error('Укажите пароли')

  const session = await getServerSession()
  if (!session.userId) throw new Error('Нужно войти')

  const { data: user, error: readErr } = await supabaseAdmin
    .from('User')
    .select('*')
    .eq('id', session.userId)
    .maybeSingle()
  if (readErr) throw new Error(readErr.message)
  if (!user) throw new Error('Пользователь не найден')

  const ok = await bcrypt.compare(currentPassword, user.password as string)
  if (!ok) throw new Error('Неверный текущий пароль')

  const newHash = await bcrypt.hash(newPassword, 10)
  const { error: updErr } = await supabaseAdmin
    .from('User')
    .update({ password: newHash })
    .eq('id', user.id)
    .limit(1)
  if (updErr) throw new Error(updErr.message)

  redirect('/admin')
}


