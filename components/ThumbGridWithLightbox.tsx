"use client"
import { useState } from 'react'
import Lightbox from './Lightbox'

type Item = { url: string; caption?: string | null }

export default function ThumbGridWithLightbox({ items }: { items: Item[] }) {
  const [open, setOpen] = useState<{ open: boolean; index: number }>({ open: false, index: 0 })
  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {items.map((p, i) => (
          <div key={i} className="flex flex-col items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={p.url}
              alt=""
              className="w-full h-48 object-cover rounded border cursor-zoom-in"
              onClick={() => setOpen({ open: true, index: i })}
            />
            {p.caption && p.caption.trim().length > 0 && (
              <div className="mt-1 text-base text-slate-800 text-center" title={p.caption || ''}>{p.caption}</div>
            )}
          </div>
        ))}
      </div>
      {open.open && (
        <Lightbox items={items} index={open.index} onIndexChange={(i) => setOpen((s) => ({ ...s, index: i }))} onClose={() => setOpen({ open: false, index: 0 })} />
      )}
    </>
  )
}


