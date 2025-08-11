'use client'
import { useState } from 'react'

export default function LoginPage() {
  const [email, setEmail] = useState('admin@example.com')
  const [password, setPassword] = useState('admin1234')
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })
    if (res.ok) {
      window.location.href = '/admin'
    } else {
      const data = await res.json().catch(() => ({}))
      setError(data?.message || 'Ошибка входа')
    }
  }

  return (
    <form onSubmit={onSubmit} className="max-w-sm space-y-4">
      <h1 className="text-2xl font-semibold">Вход администратора</h1>
      {error && <div className="text-red-600 text-sm">{error}</div>}
      <div>
        <label className="block text-sm mb-1">Email</label>
        <input className="border rounded w-full p-2" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div>
        <label className="block text-sm mb-1">Пароль</label>
        <input type="password" className="border rounded w-full p-2" value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      <button type="submit" className="bg-slate-900 text-white px-4 py-2 rounded">Войти</button>
    </form>
  )
}


