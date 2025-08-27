'use client'
import { useState } from 'react'

type Props = {
  lectureId: number
  slug: string
  locale?: 'ru' | 'uk' | 'en'
}

export default function EpubImport({ lectureId, slug, locale = 'ru' }: Props) {
  const [file, setFile] = useState<File | null>(null)
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function onImport() {
    if (!file) return
    setPending(true)
    setMessage(null)
    try {
      // 1) Выгружаем EPUB напрямую в Supabase через подписанный URL
      let dynPrefix = ''
      if (typeof (window as any).__uploadPrefix === 'function') {
        try { dynPrefix = (window as any).__uploadPrefix() } catch {}
      } else if (typeof (window as any).__uploadPrefix === 'string') {
        dynPrefix = (window as any).__uploadPrefix
      }
      if (dynPrefix) dynPrefix = String(dynPrefix).replace(/\/pictures(\/|$)/, '/sources$1')

      const params = new URLSearchParams(dynPrefix ? { prefix: dynPrefix } : {})
      const metaRes = await fetch('/api/storage/signed-upload' + (params.toString() ? `?${params.toString()}` : ''), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: (file as any).name || 'book.epub' })
      })
      if (!metaRes.ok) throw new Error('Не удалось создать ссылку загрузки')
      const meta = await metaRes.json()

      const upRes = await fetch(meta.signedUrl, {
        method: 'PUT',
        headers: {
          'x-upsert': 'true',
          'content-type': (file as any).type || 'application/epub+zip',
          'authorization': `Bearer ${meta.token}`,
        },
        body: file,
      })
      if (!upRes.ok) throw new Error('Не удалось загрузить файл')

      // 2) Запускаем серверный импорт с указанием пути в Storage
      const res = await fetch('/api/admin/import-epub', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lectureId, slug, bucket: meta.bucket, path: meta.path, locale })
      })
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


