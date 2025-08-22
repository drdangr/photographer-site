'use client'
import { useState } from 'react'

type Props = {
  name: string
  label?: string
  defaultValue?: string | null
  prefix?: string
  galleryId?: number | string
}

export default function ImageInput({ name, label, defaultValue, prefix, galleryId }: Props) {
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
      const params = new URLSearchParams()
      let p = prefix
      if (!p && typeof (window as any).__uploadCoverPrefix === 'function') {
        try { p = (window as any).__uploadCoverPrefix() } catch {}
      }
      if (!p && typeof (window as any).__uploadPrefix === 'function') {
        try { p = (window as any).__uploadPrefix() } catch {}
      }
      if (p) params.set('prefix', String(p))
      if (galleryId !== undefined && galleryId !== null) params.set('galleryId', String(galleryId))
      const url = '/api/upload' + (params.toString() ? `?${params.toString()}` : '')
      const res = await fetch(url, { method: 'POST', body: form })
      if (!res.ok) throw new Error('Upload failed')
      const data = await res.json()
      setUrl(data.url)
    } catch (err) {
      setError('Ошибка загрузки')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      {label && <label className="block text-sm mb-1">{label}</label>}
      <input type="hidden" name={name} value={url} />
      <div className="flex gap-2 items-center">
        <input
          placeholder="https://... или /uploads/..."
          className="border rounded p-2 flex-1"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <input type="file" accept="image/*" onChange={onFileChange} />
      </div>
      {error && <div className="text-sm text-red-600 mt-1">{error}</div>}
      {url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="preview" className="mt-2 h-24 object-cover rounded border" />
      )}
    </div>
  )
}


