"use client"
import { useEffect, useState } from 'react'
import { getSupabaseBrowser } from '@/lib/supabaseBrowser'
import { deleteClientGallery } from './actions'
import Lightbox from '@/components/Lightbox'

type Gallery = { id: number; title: string | null; comment: string | null }
type ClientPhoto = { id: number; url: string; uploadComment?: string | null }
type AuthorPhoto = { id: number; url: string; authorComment?: string | null }

export default function ClientGalleriesPage() {
  const supabase = getSupabaseBrowser()
  const [loading, setLoading] = useState(true)
  const [isAuthed, setIsAuthed] = useState(false)
  const [galleries, setGalleries] = useState<Gallery[]>([])
  const [photosByGallery, setPhotosByGallery] = useState<Record<number, { client: ClientPhoto[]; author: AuthorPhoto[] }>>({})
  const [lb, setLb] = useState<{ open: boolean; items: { url: string; caption?: string | null }[]; index: number }>({ open: false, items: [], index: 0 })

  function groupByComment<T extends { [k: string]: any }>(items: T[], field: keyof T): { key: string; items: T[] }[] {
    const map = new Map<string, T[]>()
    for (const it of items) {
      const key = ((it[field] as string | null | undefined) || '').trim()
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(it)
    }
    const keys = Array.from(map.keys()).sort((a, b) => {
      if (!a && !b) return 0
      if (!a) return 1
      if (!b) return -1
      return a.localeCompare(b)
    })
    return keys.map((k) => ({ key: k, items: map.get(k)! }))
  }

  useEffect(() => {
    ;(async () => {
      const { data: auth } = await supabase.auth.getUser()
      const user = auth?.user
      if (!user) {
        setLoading(false)
        setIsAuthed(false)
        return
      }
      setIsAuthed(true)
      const isAdmin = (user as any)?.app_metadata?.role === 'admin'
      let gs: Gallery[] = []
      if (isAdmin) {
        // fetch all galleries via admin API (with owner emails and preloaded photos)
        const { data: session } = await supabase.auth.getSession()
        const token = session?.session?.access_token
        const resp = await fetch('/api/admin/client-galleries', {
          cache: 'no-store',
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        })
        if (resp.ok) {
          const json = await resp.json()
          gs = (json.galleries as any[]) || []
          setPhotosByGallery(json.photosByGallery || {})
        }
      } else {
        const { data } = await supabase
          .from('ClientGallery')
          .select('*')
          .eq('clientUserId', user.id)
          .order('updatedAt', { ascending: false })
        gs = (data as Gallery[]) || []
        // preload own photos
        const map: Record<number, { client: ClientPhoto[]; author: AuthorPhoto[] }> = {}
        for (const g of gs) {
          const [{ data: cp }, { data: ap }] = await Promise.all([
            supabase.from('ClientPhoto').select('id,url,uploadComment').eq('clientGalleryId', g.id).order('order', { ascending: true }),
            supabase.from('ClientAuthorPhoto').select('id,url,authorComment').eq('clientGalleryId', g.id).order('order', { ascending: true }),
          ])
          map[g.id] = { client: (cp as any) || [], author: (ap as any) || [] }
        }
        setPhotosByGallery(map)
      }
      setGalleries(gs)
      setLoading(false)
    })()
  }, [])

  if (loading) return <div className="text-sm text-slate-600">Загрузка…</div>
  if (!isAuthed) return <div className="text-sm text-slate-600">Нужно войти</div>

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">Мои галереи</h2>
      <a href="/clients/galleries/new" className="inline-block bg-slate-900 text-white px-4 py-2 rounded">Новая галерея</a>
      <ul className="divide-y">
        {galleries.map((g) => {
          const ph = photosByGallery[g.id] || { client: [], author: [] }
          const groupedClient = groupByComment(ph.client, 'uploadComment')
          const groupedAuthor = groupByComment(ph.author, 'authorComment')
          return (
            <li key={g.id} className="py-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{g.title} {(g as any).ownerEmail ? <span className="text-xs text-slate-500">({(g as any).ownerEmail})</span> : null}</div>
                  <div className="text-sm text-slate-600">{g.comment ?? ''}</div>
                </div>
                <div className="flex items-center gap-3">
                  <a href={`/clients/galleries/${g.id}`} className="underline">Редактировать</a>
                  <form action={deleteClientGallery}>
                    <input type="hidden" name="galleryId" value={g.id} />
                    <button className="text-red-600" onClick={(e) => { if (!confirm('Удалить эту галерею?')) { e.preventDefault(); e.stopPropagation(); } }}>Удалить</button>
                  </form>
                </div>
              </div>
              <div className="text-sm text-slate-700">Мои фото:</div>
              <div className="space-y-4">
                {groupedClient.map((gc, idx) => (
                  <div key={`gc-${g.id}-${idx}`} className="space-y-2">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {gc.items.map((p: any, i: number) => (
                        <img key={p.id} src={p.url} alt="" className="w-full h-32 object-cover rounded border cursor-zoom-in" onClick={() => setLb({ open: true, items: gc.items.map((it: any) => ({ url: it.url, caption: it.uploadComment })), index: i })} />
                      ))}
                    </div>
                    <div className="text-base text-slate-800">{gc.key || 'без комментария'}</div>
                  </div>
                ))}
              </div>
              <div className="text-sm text-slate-700">Серия фотографа:</div>
              <div className="space-y-4">
                {groupedAuthor.map((ga, idx) => (
                  <div key={`ga-${g.id}-${idx}`} className="space-y-2">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {ga.items.map((p: any, i: number) => (
                        <img key={p.id} src={p.url} alt="" className="w-full h-32 object-cover rounded border cursor-zoom-in" onClick={() => setLb({ open: true, items: ga.items.map((it: any) => ({ url: it.url, caption: it.authorComment })), index: i })} />
                      ))}
                    </div>
                    <div className="text-base text-slate-800">{ga.key || 'без комментария'}</div>
                  </div>
                ))}
              </div>
            </li>
          )
        })}
      </ul>
      {lb.open && (
        <Lightbox
          key={`${lb.items.length}-${lb.index}`}
          items={lb.items}
          index={lb.index}
          onIndexChange={(i) => setLb((s) => ({ ...s, index: i }))}
          onClose={() => setLb({ open: false, items: [], index: 0 })}
        />
      )}
    </section>
  )
}

// server action вынесен в ./actions.ts


