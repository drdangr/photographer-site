'use client'
import { useRef, useState } from 'react'

type Props = {
  onUploaded: (url: string) => void
}

export default function UploadForm({ onUploaded }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault()
    const file = inputRef.current?.files?.[0]
    if (!file) return
    setBusy(true)
    setError(null)
    const form = new FormData()
    form.append('file', file)
    const res = await fetch('/api/upload', { method: 'POST', body: form })
    if (!res.ok) {
      setBusy(false)
      setError('Ошибка загрузки')
      return
    }
    const data = await res.json()
    onUploaded(data.url)
    setBusy(false)
  }

  return (
    <form onSubmit={handleUpload} className="flex items-center gap-2">
      <input ref={inputRef} type="file" accept="image/*" />
      <button disabled={busy} className="bg-slate-900 text-white px-3 py-1.5 rounded disabled:opacity-50">
        {busy ? 'Загрузка…' : 'Загрузить'}
      </button>
      {error && <span className="text-sm text-red-600">{error}</span>}
    </form>
  )
}


