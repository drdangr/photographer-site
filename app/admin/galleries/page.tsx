import { supabaseAdmin } from '@/lib/supabaseServer'
import { redirect } from 'next/navigation'
import { getServerSession } from '@/lib/session'

export default async function AdminGalleriesPage() {
  const session = await getServerSession()
  if (!session.userId) redirect('/admin/login')

  const { data: galleries } = await supabaseAdmin
    .from('Gallery')
    .select('*')
    .order('displayOrder', { ascending: true })
    .order('updatedAt', { ascending: false })
  return (
    <div className="space-y-4">
      <a href="/admin/galleries/new" className="inline-block bg-slate-900 text-white px-4 py-2 rounded">Новая галерея</a>
      <ul className="divide-y">
        {galleries.map((g) => (
          <li key={g.id} className="py-3 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="font-medium truncate">{g.title}</div>
              <div className="text-sm text-slate-500 truncate">/{g.slug}</div>
            </div>
            <div className="flex items-center gap-2">
              <form action={moveUp}>
                <input type="hidden" name="id" defaultValue={g.id} />
                <button className="px-2 py-1 border rounded" title="Вверх">▲</button>
              </form>
              <form action={moveDown}>
                <input type="hidden" name="id" defaultValue={g.id} />
                <button className="px-2 py-1 border rounded" title="Вниз">▼</button>
              </form>
              <a href={`/admin/galleries/${g.id}`} className="underline">Редактировать</a>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

async function moveUp(formData: FormData) {
  'use server'
  const id = Number(formData.get('id'))
  const { data: g } = await supabaseAdmin.from('Gallery').select('*').eq('id', id).maybeSingle()
  if (!g) return
  const { data: prev } = await supabaseAdmin
    .from('Gallery')
    .select('*')
    .lt('displayOrder', g.displayOrder)
    .order('displayOrder', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (!prev) return
  await supabaseAdmin.from('Gallery').update({ displayOrder: prev.displayOrder }).eq('id', g.id).limit(1)
  await supabaseAdmin.from('Gallery').update({ displayOrder: g.displayOrder }).eq('id', prev.id).limit(1)
  redirect('/admin/galleries')
}

async function moveDown(formData: FormData) {
  'use server'
  const id = Number(formData.get('id'))
  const { data: g } = await supabaseAdmin.from('Gallery').select('*').eq('id', id).maybeSingle()
  if (!g) return
  const { data: next } = await supabaseAdmin
    .from('Gallery')
    .select('*')
    .gt('displayOrder', g.displayOrder)
    .order('displayOrder', { ascending: true })
    .limit(1)
    .maybeSingle()
  if (!next) return
  await supabaseAdmin.from('Gallery').update({ displayOrder: next.displayOrder }).eq('id', g.id).limit(1)
  await supabaseAdmin.from('Gallery').update({ displayOrder: g.displayOrder }).eq('id', next.id).limit(1)
  redirect('/admin/galleries')
}


