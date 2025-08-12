'use client'
import { useState } from 'react'
import { getSupabaseBrowser } from '@/lib/supabaseBrowser'

export default function ClientSignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setMessage(null)
    const supabase = getSupabaseBrowser()
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) return setError(error.message)
    setMessage('Проверьте почту для подтверждения регистрации')
  }

  return (
    <form onSubmit={onSubmit} className="max-w-sm space-y-4">
      <h2 className="text-xl font-semibold">Регистрация клиента</h2>
      {message && <div className="text-green-600 text-sm">{message}</div>}
      {error && <div className="text-red-600 text-sm">{error}</div>}
      <div>
        <label className="block text-sm mb-1">Email</label>
        <input className="border rounded w-full p-2" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div>
        <label className="block text-sm mb-1">Пароль</label>
        <input type="password" className="border rounded w-full p-2" value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      <button className="bg-slate-900 text-white px-4 py-2 rounded">Создать аккаунт</button>
      <div className="text-sm text-slate-600">Уже есть аккаунт? <a href="/clients/login" className="underline">Войти</a></div>
    </form>
  )
}


