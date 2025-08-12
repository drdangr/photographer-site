"use client"
import { useEffect } from 'react'

type Item = { url: string; caption?: string | null }

export default function Lightbox({ items, index, onClose, onIndexChange }: {
  items: Item[]
  index: number
  onClose: () => void
  onIndexChange: (i: number) => void
}) {
  const current = items[index]

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') onIndexChange((index + 1) % items.length)
      if (e.key === 'ArrowLeft') onIndexChange((index - 1 + items.length) % items.length)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [index, items.length, onClose, onIndexChange])

  if (!current) return null

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 text-white flex flex-col"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div className="relative flex-1 flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
        <button
          className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 rounded px-3 py-2"
          onClick={() => onIndexChange((index - 1 + items.length) % items.length)}
          aria-label="Предыдущее"
        >
          ‹
        </button>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={current.url} alt="" className="max-h-[80vh] max-w-[95vw] object-contain" />
        <button
          className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 rounded px-3 py-2"
          onClick={() => onIndexChange((index + 1) % items.length)}
          aria-label="Следующее"
        >
          ›
        </button>
        <button className="absolute top-2 right-2 bg-white/20 hover:bg-white/30 rounded px-3 py-1" onClick={onClose} aria-label="Закрыть">✕</button>
      </div>
      <div className="p-3 text-sm bg-black/80" onClick={(e) => e.stopPropagation()}>
        {current.caption || ''}
      </div>
    </div>
  )
}


