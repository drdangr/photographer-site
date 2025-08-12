'use client'
import { useEffect, useState } from 'react'
import { getSupabaseBrowser } from '@/lib/supabaseBrowser'
import { createClient } from '@supabase/supabase-js'

export default function ClientLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem('client_login_email')
    if (stored) setEmail(stored)
  }, [])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    // persistSession по умолчанию true. Если выключено "Запомнить меня", делаем временный клиент без сохранения сессии
    let err: any = null
    if (remember) {
      const supabase = getSupabaseBrowser()
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      err = error
    } else {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || (process.env.SUPABASE_URL as string),
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || (process.env.SUPABASE_ANON_KEY as string),
        { auth: { persistSession: false } }
      )
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      err = error
    }
    if (!err && remember) localStorage.setItem('client_login_email', email)
    if (err) return setError(err.message)
    window.location.href = '/clients/galleries'
  }

  return (
    <form onSubmit={onSubmit} className="max-w-sm space-y-4">
      <h2 className="text-xl font-semibold">Вход клиента</h2>
      {error && <div className="text-red-600 text-sm">{error}</div>}
      <div>
        <label className="block text-sm mb-1">Email</label>
        <input className="border rounded w-full p-2" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div>
        <label className="block text-sm mb-1">Пароль</label>
        <input type="password" className="border rounded w-full p-2" value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} /> Запомнить меня</label>
      <button className="bg-slate-900 text-white px-4 py-2 rounded">Войти</button>
      <div className="text-sm text-slate-600">Нет аккаунта? <a href="/clients/signup" className="underline">Зарегистрироваться</a></div>
    </form>
  )
}


