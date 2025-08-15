'use client'
import { useState } from 'react'

type Props = {
  name: string
  label?: string
  defaultValue?: string | null
}

export default function CoverImageInput({ name, label, defaultValue }: Props) {
  const [url, setUrl] = useState<string>(defaultValue ?? '')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError(null)
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: form })
      if (!res.ok) throw new Error('Upload failed')
      const data = await res.json()
      setUrl(data.url)
    } catch (err) {
      setError('Ошибка загрузки')
    } finally {
      setUploading(false)
    }
  }

  function clear() {
    setUrl('')
  }

  return (
    <div>
      {label && <label className="block text-sm mb-1">{label}</label>}
      <input type="hidden" name={name} value={url} readOnly />
      <div className="flex items-center gap-2">
        <input
          placeholder="https://... или /uploads/..."
          className="border rounded p-2 flex-1"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <input type="file" accept="image/*" onChange={onFileChange} />
        <button type="button" disabled className="px-3 py-1.5 rounded border">
          {uploading ? 'Загрузка…' : 'Файл'}
        </button>
        {url && (
          <button type="button" onClick={clear} className="px-3 py-1.5 rounded border" title="Удалить">×</button>
        )}
      </div>
      {error && <div className="text-sm text-red-600 mt-1">{error}</div>}
      {url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="cover" className="mt-2 h-32 object-cover rounded border" />
      )}
    </div>
  )}


