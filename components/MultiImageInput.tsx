'use client'
import { useState } from 'react'

type Props = {
  name: string // имя скрытого поля, куда положим JSON со списком URL
  label?: string
}

export default function MultiImageInput({ name, label }: Props) {
  const [urls, setUrls] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [urlToAdd, setUrlToAdd] = useState('')

  async function onFilesChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (files.length === 0) return
    setBusy(true)
    setError(null)
    try {
      const uploaded: string[] = []
      for (const file of files) {
        const form = new FormData()
        form.append('file', file)
        const res = await fetch('/api/upload', { method: 'POST', body: form })
        if (!res.ok) throw new Error('upload failed')
        const data = await res.json()
        uploaded.push(data.url)
      }
      setUrls((prev) => [...prev, ...uploaded])
    } catch (e) {
      setError('Ошибка загрузки файлов')
    } finally {
      setBusy(false)
    }
  }

  function addUrl() {
    const trimmed = urlToAdd.trim()
    if (!trimmed) return
    setUrls((prev) => [...prev, trimmed])
    setUrlToAdd('')
  }

  function removeAt(index: number) {
    setUrls((prev) => prev.filter((_, i) => i !== index))
  }

  return (
    <div>
      {label && <label className="block text-sm mb-1">{label}</label>}
      <input type="hidden" name={name} value={JSON.stringify(urls)} readOnly />
      <div className="flex items-center gap-2 mb-2">
        <input
          placeholder="вставьте URL изображения"
          className="border rounded p-2 flex-1"
          value={urlToAdd}
          onChange={(e) => setUrlToAdd(e.target.value)}
        />
        <button type="button" className="px-3 py-1.5 rounded border" onClick={addUrl}>Добавить URL</button>
        <input type="file" accept="image/*" multiple onChange={onFilesChange} />
        <button type="button" disabled className="px-3 py-1.5 rounded border">
          {busy ? 'Загрузка…' : 'Файлы'}
        </button>
      </div>
      {error && <div className="text-sm text-red-600 mb-2">{error}</div>}
      {urls.length > 0 && (
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
          {urls.map((u, i) => (
            <div key={`${u}-${i}`} className="relative group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={u} alt="pre" className="h-20 w-full object-cover rounded border" />
              <button
                type="button"
                onClick={() => removeAt(i)}
                className="absolute top-1 right-1 text-xs bg-white/90 border rounded px-1 hidden group-hover:block"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}


