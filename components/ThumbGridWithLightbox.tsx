"use client"
import { useState } from 'react'
import Lightbox from './Lightbox'
import { isYouTubeUrl, parseYouTubeId, youtubeThumbUrl } from '@/lib/youtube'

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
              src={(isYouTubeUrl(p.url) && parseYouTubeId(p.url)) ? youtubeThumbUrl(parseYouTubeId(p.url) as string) : p.url}
              alt=""
              className="w-full h-48 object-cover rounded border cursor-zoom-in"
              onClick={() => setOpen({ open: true, index: i })}
            />
            {isYouTubeUrl(p.url) && (
              <div className="-mt-12 mb-8 pointer-events-none">
                <span className="inline-block bg-black/60 text-white rounded-full w-10 h-10 text-center leading-10">▶</span>
              </div>
            )}
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


