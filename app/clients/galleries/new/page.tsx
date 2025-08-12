"use client"
import { useEffect, useState } from 'react'
import { getSupabaseBrowser } from '@/lib/supabaseBrowser'
import { useRouter } from 'next/navigation'

export default function NewClientGalleryPage() {
  const supabase = getSupabaseBrowser()
  const router = useRouter()
  const [isAuthed, setIsAuthed] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      const { data } = await supabase.auth.getUser()
      setIsAuthed(!!data?.user)
      setLoading(false)
    })()
  }, [])

  async function onCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const title = String(form.get('title') || '') || null
    const comment = String(form.get('comment') || '') || null

    const { data: auth } = await supabase.auth.getUser()
    const user = auth?.user
    if (!user) return

    const now = new Date().toISOString()
    const { data, error } = await supabase
      .from('ClientGallery')
      .insert({ clientUserId: user.id, title, comment, createdAt: now, updatedAt: now })
      .select('id')
      .maybeSingle()

    if (error || !data) return
    router.push(`/clients/galleries/${(data as any).id}`)
  }

  if (loading) return <div className="text-sm text-slate-600">Загрузка…</div>
  if (!isAuthed) return <div className="text-sm text-slate-600">Нужно войти</div>

  return (
    <form onSubmit={onCreate} className="max-w-md space-y-3">
      <h2 className="text-xl font-semibold">Новая галерея</h2>
      <div>
        <label className="block text-sm mb-1">Название</label>
        <input name="title" className="border rounded p-2 w-full" />
      </div>
      <div>
        <label className="block text-sm mb-1">Комментарий</label>
        <input name="comment" className="border rounded p-2 w-full" />
      </div>
      <button className="bg-slate-900 text-white px-4 py-2 rounded">Создать</button>
    </form>
  )
}


