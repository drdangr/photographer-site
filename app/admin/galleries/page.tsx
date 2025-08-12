import { supabaseAdmin } from '@/lib/supabaseServer'
import { revalidatePath } from 'next/cache'

export const dynamic = 'force-dynamic'
export const revalidate = 0
import { redirect } from 'next/navigation'
import { getServerSession } from '@/lib/session'

export default async function AdminGalleriesPage() {
  const session = await getServerSession()
  if (!session.userId) redirect('/admin/login')

  const { data } = await supabaseAdmin
    .from('Gallery')
    .select('*')
    .order('displayOrder', { ascending: true })
    .order('updatedAt', { ascending: false })
  const galleries = data ?? []
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
  const { data: rows } = await supabaseAdmin
    .from('Gallery')
    .select('id, displayOrder')
    .order('displayOrder', { ascending: true })
    .order('id', { ascending: true })
  if (!rows) return
  // Нормализуем порядок: 1..N без дублей, чтобы swap работал
  for (let i = 0; i < rows.length; i++) {
    const desired = i + 1
    if ((rows[i].displayOrder as number) !== desired) {
      await supabaseAdmin.from('Gallery').update({ displayOrder: desired }).eq('id', rows[i].id).limit(1)
      rows[i].displayOrder = desired as any
    }
  }
  const idx = rows.findIndex((r) => r.id === id)
  if (idx <= 0) return
  const curr = rows[idx]
  const prev = rows[idx - 1]
  await supabaseAdmin.from('Gallery').update({ displayOrder: prev.displayOrder }).eq('id', curr.id).limit(1)
  await supabaseAdmin.from('Gallery').update({ displayOrder: curr.displayOrder }).eq('id', prev.id).limit(1)
  revalidatePath('/admin/galleries')
  redirect('/admin/galleries')
}

async function moveDown(formData: FormData) {
  'use server'
  const id = Number(formData.get('id'))
  const { data: rows } = await supabaseAdmin
    .from('Gallery')
    .select('id, displayOrder')
    .order('displayOrder', { ascending: true })
    .order('id', { ascending: true })
  if (!rows) return
  // Нормализуем 1..N на случай дублей/нулей
  for (let i = 0; i < rows.length; i++) {
    const desired = i + 1
    if ((rows[i].displayOrder as number) !== desired) {
      await supabaseAdmin.from('Gallery').update({ displayOrder: desired }).eq('id', rows[i].id).limit(1)
      rows[i].displayOrder = desired as any
    }
  }
  const idx = rows.findIndex((r) => r.id === id)
  if (idx === -1 || idx >= rows.length - 1) return
  const curr = rows[idx]
  const next = rows[idx + 1]
  await supabaseAdmin.from('Gallery').update({ displayOrder: next.displayOrder }).eq('id', curr.id).limit(1)
  await supabaseAdmin.from('Gallery').update({ displayOrder: curr.displayOrder }).eq('id', next.id).limit(1)
  revalidatePath('/admin/galleries')
  redirect('/admin/galleries')
}


