'use client'
import { useState } from 'react'
import { getSupabaseBrowser } from '@/lib/supabaseBrowser'

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setMessage(null)
    try {
      const supabase = getSupabaseBrowser()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return setError('Ссылка недействительна или устарела')
      const { error } = await supabase.auth.updateUser({ password })
      if (error) return setError(error.message)
      setMessage('Пароль обновлён. Теперь можно войти.')
    } catch (e: any) {
      setError(e?.message || 'Не удалось обновить пароль')
    }
  }

  return (
    <form onSubmit={onSubmit} className="max-w-sm space-y-4">
      <h2 className="text-xl font-semibold">Новый пароль</h2>
      {message && <div className="text-green-600 text-sm">{message}</div>}
      {error && <div className="text-red-600 text-sm">{error}</div>}
      <div>
        <label className="block text-sm mb-1">Пароль</label>
        <input type="password" className="border rounded w-full p-2" value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      <button className="bg-slate-900 text-white px-4 py-2 rounded">Сохранить</button>
    </form>
  )
}


