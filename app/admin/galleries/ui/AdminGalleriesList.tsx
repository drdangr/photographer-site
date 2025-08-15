'use client'
import { useRef, useState } from 'react'
import { moveGalleryDown, moveGalleryUp } from '../actions'

type Gallery = {
  id: number
  title: string
  slug: string
}

export default function AdminGalleriesList({ initialItems }: { initialItems: Gallery[] }) {
  const [items, setItems] = useState<Gallery[]>(initialItems)
  const [busyId, setBusyId] = useState<number | null>(null)
  const listRef = useRef<HTMLUListElement | null>(null)

  function measurePositions() {
    const list = listRef.current
    const map = new Map<number, DOMRect>()
    if (!list) return map
    for (const li of Array.from(list.children)) {
      const el = li as HTMLElement
      const id = Number(el.dataset.id)
      map.set(id, el.getBoundingClientRect())
    }
    return map
  }

  function animateFrom(before: Map<number, DOMRect>) {
    const list = listRef.current
    if (!list) return
    for (const li of Array.from(list.children)) {
      const el = li as HTMLElement
      const id = Number(el.dataset.id)
      const prev = before.get(id)
      if (!prev) continue
      const next = el.getBoundingClientRect()
      const dx = prev.left - next.left
      const dy = prev.top - next.top
      if (dx || dy) {
        el.animate(
          [
            { transform: `translate(${dx}px, ${dy}px)` },
            { transform: 'translate(0, 0)' },
          ],
          { duration: 220, easing: 'cubic-bezier(.2,.8,.2,1)' }
        )
      }
    }
  }

  function ordersEqual(a: Gallery[], b: Gallery[]) {
    if (a.length !== b.length) return false
    for (let i = 0; i < a.length; i++) if (a[i].id !== b[i].id) return false
    return true
  }

  function swap(idxA: number, idxB: number) {
    setItems((prev) => {
      const next = prev.slice()
      const a = next[idxA]
      next[idxA] = next[idxB]
      next[idxB] = a
      return next
    })
  }

  async function onUp(id: number) {
    const idx = items.findIndex((i) => i.id === id)
    if (idx <= 0) return
    setBusyId(id)
    const before = measurePositions()
    swap(idx, idx - 1) // оптимистично
    requestAnimationFrame(() => animateFrom(before))
    try {
      const res = await moveGalleryUp(id)
      if (!res?.ok) throw new Error(res?.error || 'move up failed')
      if (res.items && !ordersEqual(items, res.items as any)) {
        const before2 = measurePositions()
        setItems(res.items as any)
        requestAnimationFrame(() => animateFrom(before2))
      }
    } catch {
      // откат
      const beforeRollback = measurePositions()
      swap(idx - 1, idx)
      requestAnimationFrame(() => animateFrom(beforeRollback))
    } finally {
      setBusyId(null)
    }
  }

  async function onDown(id: number) {
    const idx = items.findIndex((i) => i.id === id)
    if (idx === -1 || idx >= items.length - 1) return
    setBusyId(id)
    const before = measurePositions()
    swap(idx, idx + 1)
    requestAnimationFrame(() => animateFrom(before))
    try {
      const res = await moveGalleryDown(id)
      if (!res?.ok) throw new Error(res?.error || 'move down failed')
      if (res.items && !ordersEqual(items, res.items as any)) {
        const before2 = measurePositions()
        setItems(res.items as any)
        requestAnimationFrame(() => animateFrom(before2))
      }
    } catch {
      const beforeRollback = measurePositions()
      swap(idx + 1, idx)
      requestAnimationFrame(() => animateFrom(beforeRollback))
    } finally {
      setBusyId(null)
    }
  }

  return (
    <ul ref={listRef} className="divide-y">
      {items.map((g, i) => (
        <li key={g.id} data-id={g.id} className="py-3 flex items-center justify-between gap-4 will-change-transform">
          <div className="min-w-0">
            <div className="font-medium truncate">{g.title}</div>
            <div className="text-sm text-slate-500 truncate">/{g.slug}</div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => onUp(g.id)} className="px-2 py-1 border rounded disabled:opacity-50" title="Вверх" disabled={busyId !== null}>▲</button>
            <button onClick={() => onDown(g.id)} className="px-2 py-1 border rounded disabled:opacity-50" title="Вниз" disabled={busyId !== null}>▼</button>
            <a href={`/admin/galleries/${g.id}`} className="underline">Редактировать</a>
          </div>
        </li>
      ))}
    </ul>
  )
}


