'use client'
import { useState } from 'react'

type Props = {
  lectureId: number
  slug: string
}

export default function EpubImport({ lectureId, slug }: Props) {
  const [file, setFile] = useState<File | null>(null)
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function onImport() {
    if (!file) return
    setPending(true)
    setMessage(null)
    try {
      const form = new FormData()
      form.set('lectureId', String(lectureId))
      form.set('slug', slug)
      form.set('file', file)
      const res = await fetch('/api/admin/import-epub', { method: 'POST', body: form })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || json?.ok === false) throw new Error(json?.message || 'Import failed')
      setMessage('Импорт завершён')
      // мягко перезагрузим страницу, чтобы увидеть обложку/контент
      setTimeout(() => (window.location.href = window.location.href), 500)
    } catch (e: any) {
      setMessage(e?.message || 'Ошибка импорта')
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      <input type="file" accept=".epub" onChange={(e) => setFile(e.target.files?.[0] || null)} />
      <button
        type="button"
        className="bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700 disabled:opacity-50"
        disabled={!file || pending}
        onClick={onImport}
      >
        {pending ? 'Импорт…' : 'Импортировать EPUB и заменить весь текст и картинки'}
      </button>
      {message && <span className="text-slate-600">{message}</span>}
    </div>
  )
}


