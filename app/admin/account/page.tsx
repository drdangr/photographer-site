import { getServerSession } from '@/lib/session'

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
  const res = await fetch('/api/auth/change-password', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ currentPassword, newPassword }),
  })
  if (!res.ok) {
    throw new Error('Не удалось сменить пароль')
  }
}


