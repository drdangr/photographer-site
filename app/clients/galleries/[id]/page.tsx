"use client"
import MultiImageInput from '@/components/MultiImageInput'
import Lightbox from '@/components/Lightbox'
import { useEffect, useState } from 'react'
import { getSupabaseBrowser } from '@/lib/supabaseBrowser'

type Props = { params: { id: string } }

type Photo = { id: number; url: string; alt: string | null }
type ClientPhotoType = Photo & { uploadComment?: string | null }
type AuthorPhotoType = Photo & { authorComment?: string | null }

export default function EditClientGallery({ params }: Props) {
  const supabase = getSupabaseBrowser()
  const id = Number(params.id)
  const [loading, setLoading] = useState(true)
  const [isAuthed, setIsAuthed] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [gallery, setGallery] = useState<{ title: string | null; comment: string | null } | null>(null)
  const [clientPhotos, setClientPhotos] = useState<ClientPhotoType[]>([])
  const [authorPhotos, setAuthorPhotos] = useState<AuthorPhotoType[]>([])
  const [lb, setLb] = useState<{ open: boolean; items: { url: string; caption?: string | null }[]; index: number }>({ open: false, items: [], index: 0 })

  useEffect(() => {
    ;(async () => {
      const { data: auth } = await supabase.auth.getUser()
      if (!auth?.user) {
        setIsAuthed(false)
        setLoading(false)
        return
      }
      setIsAuthed(true)
      setIsAdmin((auth.user as any)?.app_metadata?.role === 'admin')
      const { data: g } = await supabase
        .from('ClientGallery')
        .select('*')
        .eq('id', id)
        .maybeSingle()
      if (!g) {
        setGallery(null)
        setLoading(false)
        return
      } else {
        setGallery({ title: (g as any).title ?? null, comment: (g as any).comment ?? null })
      }
      if (!((auth.user as any)?.app_metadata?.role === 'admin')) {
        if ((g as any).clientUserId && (g as any).clientUserId !== auth.user.id) {
          setGallery(null)
          setLoading(false)
          return
        }
      }
      const { data: cp } = await supabase
        .from('ClientPhoto')
        .select('*')
        .eq('clientGalleryId', id)
        .order('order', { ascending: true })
      setClientPhotos((cp as any) || [])
      const { data: ap } = await supabase
        .from('ClientAuthorPhoto')
        .select('*')
        .eq('clientGalleryId', id)
        .order('order', { ascending: true })
      setAuthorPhotos((ap as any) || [])
      setLoading(false)
    })()
  }, [id])

  async function onAddClientPhotos(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formEl = e.currentTarget as HTMLFormElement
    const form = new FormData(formEl)
    const photosJson = String(form.get('photosJson') || '[]')
    const uploadComment = String(form.get('uploadComment') || '') || null
    let urls: string[] = []
    try { const parsed = JSON.parse(photosJson); if (Array.isArray(parsed)) urls = parsed.filter((u) => typeof u === 'string' && u.length > 0) } catch {}
    if (urls.length === 0) return
    const { data: maxRow } = await supabase
      .from('ClientPhoto')
      .select('order')
      .eq('clientGalleryId', id)
      .order('order', { ascending: false })
      .limit(1)
      .maybeSingle()
    let order = (((maxRow as any)?.order as number) ?? 0) + 1
    await supabase.from('ClientPhoto').insert(urls.map((u) => ({ clientGalleryId: id, url: u, order: order++, uploadComment })))
    const { data: cp } = await supabase
      .from('ClientPhoto')
      .select('*')
      .eq('clientGalleryId', id)
      .order('order', { ascending: true })
    setClientPhotos((cp as any) || [])
    formEl.reset()
  }


  if (loading) return <div className="text-sm text-slate-600">Загрузка…</div>
  if (!isAuthed) return <div className="text-sm text-slate-600">Нужно войти</div>
  if (!gallery) return <div className="text-sm text-slate-600">Галерея не найдена</div>

  async function deleteClientPhoto(photoId: number) {
    await supabase.from('ClientPhoto').delete().eq('id', photoId).limit(1)
    const { data: cp } = await supabase
      .from('ClientPhoto')
      .select('*')
      .eq('clientGalleryId', id)
      .order('order', { ascending: true })
    setClientPhotos((cp as any) || [])
  }

  async function editClientPhotoComment(photoId: number, current: string | null | undefined) {
    const next = window.prompt('Комментарий к фото', current ?? '')
    if (next === null) return
    await supabase.from('ClientPhoto').update({ uploadComment: next || null }).eq('id', photoId).limit(1)
    const { data: cp } = await supabase
      .from('ClientPhoto')
      .select('*')
      .eq('clientGalleryId', id)
      .order('order', { ascending: true })
    setClientPhotos((cp as any) || [])
  }

  // helpers
  function groupByComment<T extends { [k: string]: any }>(items: T[], field: keyof T): { key: string; items: T[] }[] {
    const map = new Map<string, T[]>()
    for (const it of items) {
      const key = ((it[field] as string | null | undefined) || '').trim()
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(it)
    }
    // сортировка: непустые ключи по алфавиту, пустой в конец
    const keys = Array.from(map.keys()).sort((a, b) => {
      if (!a && !b) return 0
      if (!a) return 1
      if (!b) return -1
      return a.localeCompare(b)
    })
    return keys.map((k) => ({ key: k, items: map.get(k)! }))
  }

  const groupedClient = groupByComment(clientPhotos, 'uploadComment')
  const groupedAuthor = groupByComment(authorPhotos, 'authorComment')

  return (
    <div className="space-y-6">
      <section>
        <h3 className="font-semibold mb-2">Мои фото</h3>
        <form onSubmit={onAddClientPhotos} className="space-y-2">
          <MultiImageInput name="photosJson" />
          <div>
            <label className="block text-sm mb-1">Комментарий к загрузке</label>
            <input name="uploadComment" className="border rounded p-2 w-full" />
          </div>
          <button className="border px-3 py-1.5 rounded">Добавить</button>
        </form>
        <div className="space-y-6 mt-3">
          {groupedClient.map((g, gi) => (
            <div key={`cg-${gi}`} className="space-y-3 pt-8 border-t border-slate-300">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {g.items.map((p, i) => (
                  <div key={p.id} className="border rounded overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={p.url}
                      alt={p.alt ?? ''}
                      className="w-full h-40 object-cover cursor-zoom-in"
                      onClick={() => setLb({ open: true, items: g.items.map((it) => ({ url: it.url, caption: it.uploadComment })), index: i })}
                    />
                    <div className="p-1 text-right text-xs text-slate-500">
                      <button type="button" onClick={() => editClientPhotoComment(p.id, p.uploadComment)} title="Редактировать">✎</button>
                      <button type="button" className="ml-2" onClick={() => deleteClientPhoto(p.id)} title="Удалить">✕</button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="text-base text-slate-800">{g.key || 'без комментария'}</div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h3 className="font-semibold mb-2">Серия фотографа</h3>
        {isAdmin && (
          <AdminAuthorUploader galleryId={id} afterUpload={async () => {
            const { data: ap } = await supabase
              .from('ClientAuthorPhoto')
              .select('*')
              .eq('clientGalleryId', id)
              .order('order', { ascending: true })
            setAuthorPhotos((ap as any) || [])
          }} />
        )}
        <div className="space-y-6 mt-3">
          {groupedAuthor.map((g, gi) => (
            <div key={`ag-${gi}`} className="space-y-3 pt-8 border-t border-slate-300">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {g.items.map((p, i) => (
                  <div key={p.id} className="border rounded overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={p.url}
                      alt={p.alt ?? ''}
                      className="w-full h-40 object-cover cursor-zoom-in"
                      onClick={() => setLb({ open: true, items: g.items.map((it) => ({ url: it.url, caption: it.authorComment })), index: i })}
                    />
                  </div>
                ))}
              </div>
              <div className="text-base text-slate-800">{g.key || 'без комментария'}</div>
            </div>
          ))}
        </div>
      </section>
      {lb.open && (
        <Lightbox
          key={`${lb.items.length}-${lb.index}`}
          items={lb.items}
          index={lb.index}
          onIndexChange={(i) => setLb((s) => ({ ...s, index: i }))}
          onClose={() => setLb({ open: false, items: [], index: 0 })}
        />
      )}
    </div>
  )
}

function AdminAuthorUploader({ galleryId, afterUpload }: { galleryId: number; afterUpload: () => void }) {
  const supabase = getSupabaseBrowser()
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formEl = e.currentTarget as HTMLFormElement
    const form = new FormData(formEl)
    const photosJson = String(form.get('photosJson') || '[]')
    const authorComment = String(form.get('authorComment') || '') || null
    let urls: string[] = []
    try { const parsed = JSON.parse(photosJson); if (Array.isArray(parsed)) urls = parsed.filter((u) => typeof u === 'string' && u.length > 0) } catch {}
    if (urls.length === 0) return
    const { data: maxRow } = await supabase
      .from('ClientAuthorPhoto')
      .select('order')
      .eq('clientGalleryId', galleryId)
      .order('order', { ascending: false })
      .limit(1)
      .maybeSingle()
    let order = (((maxRow as any)?.order as number) ?? 0) + 1
    await supabase.from('ClientAuthorPhoto').insert(urls.map((u) => ({ clientGalleryId: galleryId, url: u, order: order++, authorComment })))
    formEl.reset()
    await afterUpload()
  }
  return (
    <form onSubmit={onSubmit} className="space-y-2">
      <MultiImageInput name="photosJson" />
      <div>
        <label className="block text-sm mb-1">Комментарий фотографа</label>
        <input name="authorComment" className="border rounded p-2 w-full" />
      </div>
      <button className="border px-3 py-1.5 rounded">Добавить</button>
    </form>
  )
}


