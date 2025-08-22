'use client'
import { useEffect, useRef, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { isYouTubeUrl, parseYouTubeId, youtubeThumbUrl } from '@/lib/youtube'

type Props = {
  name: string // имя скрытого поля, куда положим JSON со списком URL
  label?: string
  prefix?: string
  galleryId?: number | string
}

export default function MultiImageInput({ name, label, prefix, galleryId }: Props) {
  const [urls, setUrls] = useState<string[]>([])
  const [alts, setAlts] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [urlToAdd, setUrlToAdd] = useState('')
  const rootRef = useRef<HTMLDivElement>(null)
  const hiddenUrlsRef = useRef<HTMLInputElement>(null)
  const hiddenAltsRef = useRef<HTMLInputElement>(null)
  const { pending } = useFormStatus()
  const wasPendingRef = useRef(false)

  // Очистка очереди добавления после успешного сабмита (когда pending -> false)
  useEffect(() => {
    if (pending) {
      wasPendingRef.current = true
      return
    }
    if (wasPendingRef.current) {
      wasPendingRef.current = false
      setUrls([])
      setAlts([])
      setUrlToAdd('')
      setError(null)
    }
  }, [pending])

  // Сигнализируем форме об изменениях скрытых полей, чтобы активировать кнопку "Сохранить"
  useEffect(() => {
    hiddenUrlsRef.current?.dispatchEvent(new Event('input', { bubbles: true }))
    hiddenAltsRef.current?.dispatchEvent(new Event('input', { bubbles: true }))
  }, [urls, alts])

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
        const params = new URLSearchParams()
        let p = prefix
        if (!p && typeof (window as any).__uploadPrefix === 'function') {
          try { p = (window as any).__uploadPrefix() } catch {}
        }
        if (p) params.set('prefix', String(p))
        if (galleryId !== undefined && galleryId !== null) params.set('galleryId', String(galleryId))
        const url = '/api/upload' + (params.toString() ? `?${params.toString()}` : '')
        const res = await fetch(url, { method: 'POST', body: form })
        if (!res.ok) throw new Error('upload failed')
        const data = await res.json()
        uploaded.push(data.url)
      }
      setUrls((prev) => [...prev, ...uploaded])
      setAlts((prev) => [...prev, ...uploaded.map(() => '')])
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
    setAlts((prev) => [...prev, ''])
    setUrlToAdd('')
  }

  function removeAt(index: number) {
    setUrls((prev) => prev.filter((_, i) => i !== index))
    setAlts((prev) => prev.filter((_, i) => i !== index))
  }

  return (
    <div ref={rootRef}>
      {label && <label className="block text-sm mb-1">{label}</label>}
      <input ref={hiddenUrlsRef} type="hidden" name={name} value={JSON.stringify(urls)} readOnly />
      <input ref={hiddenAltsRef} type="hidden" name="altsJson" value={JSON.stringify(alts)} readOnly />
      <div className="flex items-center gap-2 mb-2">
        <input
          placeholder="вставьте URL изображения или YouTube-ссылку"
          className="border rounded p-2 flex-1"
          value={urlToAdd}
          onChange={(e) => setUrlToAdd(e.target.value)}
        />
        <button type="button" className="px-3 py-1.5 rounded border" onClick={addUrl}>Добавить URL</button>
        <input type="file" accept="image/*" multiple onChange={onFilesChange} />
      </div>
      {error && <div className="text-sm text-red-600 mb-2">{error}</div>}
      {urls.length > 0 && (
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
          {urls.map((u, i) => (
            <div key={`${u}-${i}`} className="relative group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={(isYouTubeUrl(u) && parseYouTubeId(u)) ? youtubeThumbUrl(parseYouTubeId(u) as string) : u}
                alt="pre"
                className="h-20 w-full object-cover rounded border"
              />
              {isYouTubeUrl(u) && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <span className="inline-block bg-black/50 text-white rounded-full w-6 h-6 text-center leading-6">▶</span>
                </div>
              )}
              <button
                type="button"
                onClick={() => removeAt(i)}
                className="absolute top-1 right-1 text-xs bg-white/90 border rounded px-1 hidden group-hover:block"
              >
                ×
              </button>
              <div className="mt-1">
                <input
                  className="border rounded p-1 w-full text-xs"
                  placeholder="ALT"
                  value={alts[i] ?? ''}
                  onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault() }}
                  onChange={(e) => setAlts((prev) => prev.map((v, idx) => idx === i ? e.target.value : v))}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}


