import { redirect } from 'next/navigation'
import { getServerSession } from '@/lib/session'
import { supabaseAdmin } from '@/lib/supabaseServer'
import SaveButton from '@/components/SaveButton'
import RichEditor from '@/components/RichEditor'

export default async function AdminNewsPage() {
  const session = await getServerSession()
  if (!session.userId) redirect('/admin/login')

  const { data } = await supabaseAdmin
    .from('NewsItem')
    .select('*')
    .order('date', { ascending: false })
    .order('id', { ascending: false })
  const items = data ?? []

  return (
    <div className="space-y-8 max-w-3xl">
      <form action={createNews} className="space-y-3">
        <h2 className="text-lg font-semibold">Добавить новость</h2>
        <div>
          <label className="block text-sm mb-1">Заголовок</label>
          <input name="title" className="border rounded p-2 w-full" required />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm mb-1">Дата</label>
            <input name="date" type="date" className="border rounded p-2 w-full" />
          </div>
          <div>
            <label className="block text-sm mb-1">Время</label>
            <input name="time" type="time" className="border rounded p-2 w-full" />
          </div>
        </div>
        <div>
          <label className="block text-sm mb-1">Текст</label>
          <RichEditor name="bodyMd" />
        </div>
        <SaveButton>Добавить</SaveButton>
      </form>

      <ul className="divide-y">
        {items.map((n) => (
          <li key={n.id} className="py-4">
            <form action={updateNews} className="space-y-3">
              <input type="hidden" name="id" defaultValue={n.id} />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm mb-1">Заголовок</label>
                  <input name="title" className="border rounded p-2 w-full" defaultValue={n.title ?? ''} required />
                </div>
                <div>
                  <label className="block text-sm mb-1">Дата</label>
                  <input name="date" type="date" className="border rounded p-2" defaultValue={n.date ? String(n.date).slice(0,10) : ''} />
                </div>
                <div>
                  <label className="block text-sm mb-1">Время</label>
                  <input name="time" type="time" className="border rounded p-2" defaultValue={n.date ? new Date(n.date as any).toISOString().slice(11,16) : ''} />
                </div>
              </div>
              <div>
                <label className="block text-sm mb-1">Текст</label>
                <RichEditor name="bodyMd" defaultHtml={n.bodyMd ?? ''} />
              </div>
              <div className="flex items-center gap-3">
                <SaveButton />
                <button formAction={deleteNews} className="text-red-600">Удалить</button>
              </div>
            </form>
          </li>
        ))}
      </ul>
    </div>
  )
}

async function createNews(formData: FormData) {
  'use server'
  const title = String(formData.get('title') || '')
  const dateRaw = String(formData.get('date') || '')
  const timeRaw = String(formData.get('time') || '')
  const bodyMd = String(formData.get('bodyMd') || '')
  if (!title) return
  const date = (dateRaw || timeRaw) ? new Date(`${dateRaw || new Date().toISOString().slice(0,10)}T${timeRaw || '00:00'}:00`) : new Date()
  await supabaseAdmin.from('NewsItem').insert({ title, date, bodyMd })
}

async function updateNews(formData: FormData) {
  'use server'
  const id = Number(formData.get('id'))
  const title = String(formData.get('title') || '')
  const dateRaw = String(formData.get('date') || '')
  const timeRaw = String(formData.get('time') || '')
  const bodyMd = String(formData.get('bodyMd') || '')
  if (!id || !title) return
  const date = (dateRaw || timeRaw) ? new Date(`${dateRaw || new Date().toISOString().slice(0,10)}T${timeRaw || '00:00'}:00`) : new Date()
  await supabaseAdmin.from('NewsItem').update({ title, date, bodyMd }).eq('id', id).limit(1)
}

async function deleteNews(formData: FormData) {
  'use server'
  const id = Number(formData.get('id'))
  if (!id) return
  await supabaseAdmin.from('NewsItem').delete().eq('id', id).limit(1)
}


