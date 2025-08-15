import { supabaseAdmin } from '@/lib/supabaseServer'
import { redirect } from 'next/navigation'
import { getServerSession } from '@/lib/session'
import { revalidatePath } from 'next/cache'
import SaveButton from '@/components/SaveButton'

export default async function AdminLecturesPage() {
  const session = await getServerSession()
  if (!session.userId) redirect('/admin/login')
  const { data: sections } = await supabaseAdmin
    .from('LectureSection')
    .select('*')
    .order('displayOrder', { ascending: true })
    .order('title', { ascending: true })
  const sectionsList = sections ?? []
  const { data: lectures } = await supabaseAdmin
    .from('Lecture')
    .select('id,title,slug,sectionId,displayOrder')
    .order('sectionId', { ascending: true })
    .order('displayOrder', { ascending: true })
  const items = lectures ?? []
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <a href="/admin/lectures/new" className="inline-block bg-slate-900 text-white px-4 py-2 rounded">Новая запись</a>
      </div>

      {/* Управление разделами */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Разделы</h2>
        <form action={createSection} className="flex items-end gap-2">
          <div className="flex-1">
            <label className="block text-sm mb-1">Название нового раздела</label>
            <input name="title" className="border rounded p-2 w-full" placeholder="Например: Техника" required />
          </div>
          <SaveButton>Добавить</SaveButton>
        </form>
        <ul className="divide-y">
          {sectionsList.map((s: any) => (
            <li key={s.id} className="py-3 flex items-center justify-between gap-2">
              <form action={updateSection} className="flex items-end gap-2 flex-1">
                <input type="hidden" name="id" defaultValue={s.id} />
                <div className="flex-1">
                  <label className="block text-xs text-slate-600 mb-1">Название</label>
                  <input name="title" className="border rounded p-2 w-full" defaultValue={s.title} required />
                </div>
                <SaveButton />
              </form>
              <div className="flex items-center gap-2">
                <form action={moveSectionUp}><input type="hidden" name="id" defaultValue={s.id} /><button className="px-2 py-1 border rounded" title="Вверх">▲</button></form>
                <form action={moveSectionDown}><input type="hidden" name="id" defaultValue={s.id} /><button className="px-2 py-1 border rounded" title="Вниз">▼</button></form>
                <form action={deleteSection}>
                  <input type="hidden" name="id" defaultValue={s.id} />
                  <button className="text-red-600">Удалить</button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      </section>
      <div className="space-y-6">
        {sectionsList.map((s: any) => (
          <section key={s.id}>
            <h2 className="text-lg font-semibold mb-2">{s.title}</h2>
            <ul className="divide-y">
              {items.filter((l) => l.sectionId === s.id).map((l) => (
                <li key={l.id} className="py-3 flex items-center justify-between">
                  <div className="min-w-0">
                    <div className="font-medium truncate">{l.title}</div>
                    <div className="text-sm text-slate-500 truncate">/{l.slug}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <form action={moveUp}><input type="hidden" name="id" defaultValue={l.id} /><button className="px-2 py-1 border rounded" title="Вверх">▲</button></form>
                    <form action={moveDown}><input type="hidden" name="id" defaultValue={l.id} /><button className="px-2 py-1 border rounded" title="Вниз">▼</button></form>
                    <a className="underline" href={`/admin/lectures/${l.id}`}>Редактировать</a>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}
        {/* Без раздела */}
        <section>
          <h2 className="text-lg font-semibold mb-2">Без раздела</h2>
          <ul className="divide-y">
            {items.filter((l) => !l.sectionId).map((l) => (
              <li key={l.id} className="py-3 flex items-center justify-between">
                <div className="min-w-0">
                  <div className="font-medium truncate">{l.title}</div>
                  <div className="text-sm text-slate-500 truncate">/{l.slug}</div>
                </div>
                <div className="flex items-center gap-2">
                  <form action={moveUp}><input type="hidden" name="id" defaultValue={l.id} /><button className="px-2 py-1 border rounded" title="Вверх">▲</button></form>
                  <form action={moveDown}><input type="hidden" name="id" defaultValue={l.id} /><button className="px-2 py-1 border rounded" title="Вниз">▼</button></form>
                  <a className="underline" href={`/admin/lectures/${l.id}`}>Редактировать</a>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}

async function moveUp(formData: FormData) {
  'use server'
  const id = Number(formData.get('id'))
  const { data: current } = await supabaseAdmin
    .from('Lecture')
    .select('id, sectionId, displayOrder')
    .eq('id', id)
    .maybeSingle()
  if (!current) return
  const sectionId = current.sectionId as number | null
  const { data: rows } = await supabaseAdmin
    .from('Lecture')
    .select('id, displayOrder')
    .eq('sectionId', sectionId)
    .order('displayOrder', { ascending: true })
    .order('id', { ascending: true })
  if (!rows) return
  for (let i = 0; i < rows.length; i++) {
    const desired = i + 1
    if ((rows[i].displayOrder as number) !== desired) {
      await supabaseAdmin.from('Lecture').update({ displayOrder: desired }).eq('id', rows[i].id).limit(1)
      rows[i].displayOrder = desired as any
    }
  }
  const idx = rows.findIndex((r) => r.id === id)
  if (idx <= 0) return
  const curr = rows[idx]
  const prev = rows[idx - 1]
  await supabaseAdmin.from('Lecture').update({ displayOrder: prev.displayOrder }).eq('id', curr.id).limit(1)
  await supabaseAdmin.from('Lecture').update({ displayOrder: curr.displayOrder }).eq('id', prev.id).limit(1)
  revalidatePath('/admin/lectures')
}

async function moveDown(formData: FormData) {
  'use server'
  const id = Number(formData.get('id'))
  const { data: current } = await supabaseAdmin
    .from('Lecture')
    .select('id, sectionId, displayOrder')
    .eq('id', id)
    .maybeSingle()
  if (!current) return
  const sectionId = current.sectionId as number | null
  const { data: rows } = await supabaseAdmin
    .from('Lecture')
    .select('id, displayOrder')
    .eq('sectionId', sectionId)
    .order('displayOrder', { ascending: true })
    .order('id', { ascending: true })
  if (!rows) return
  for (let i = 0; i < rows.length; i++) {
    const desired = i + 1
    if ((rows[i].displayOrder as number) !== desired) {
      await supabaseAdmin.from('Lecture').update({ displayOrder: desired }).eq('id', rows[i].id).limit(1)
      rows[i].displayOrder = desired as any
    }
  }
  const idx = rows.findIndex((r) => r.id === id)
  if (idx === -1 || idx >= rows.length - 1) return
  const curr = rows[idx]
  const next = rows[idx + 1]
  await supabaseAdmin.from('Lecture').update({ displayOrder: next.displayOrder }).eq('id', curr.id).limit(1)
  await supabaseAdmin.from('Lecture').update({ displayOrder: curr.displayOrder }).eq('id', next.id).limit(1)
  revalidatePath('/admin/lectures')
}

// Разделы: CRUD и сортировка
async function createSection(formData: FormData) {
  'use server'
  const title = String(formData.get('title') || '').trim()
  if (!title) return
  const { data: maxRow } = await supabaseAdmin
    .from('LectureSection')
    .select('displayOrder')
    .order('displayOrder', { ascending: false })
    .limit(1)
    .maybeSingle()
  const displayOrder = ((maxRow?.displayOrder as number) ?? 0) + 1
  await supabaseAdmin.from('LectureSection').insert({ title, displayOrder })
  revalidatePath('/admin/lectures')
}

async function updateSection(formData: FormData) {
  'use server'
  const id = Number(formData.get('id'))
  const title = String(formData.get('title') || '').trim()
  if (!id || !title) return
  await supabaseAdmin.from('LectureSection').update({ title }).eq('id', id).limit(1)
  revalidatePath('/admin/lectures')
}

async function deleteSection(formData: FormData) {
  'use server'
  const id = Number(formData.get('id'))
  if (!id) return
  // При удалении раздела переводим лекции в "Без раздела"
  await supabaseAdmin.from('Lecture').update({ sectionId: null, displayOrder: 0 }).eq('sectionId', id)
  await supabaseAdmin.from('LectureSection').delete().eq('id', id).limit(1)
  revalidatePath('/admin/lectures')
}

async function moveSectionUp(formData: FormData) {
  'use server'
  const id = Number(formData.get('id'))
  const { data: rows } = await supabaseAdmin
    .from('LectureSection')
    .select('id, displayOrder')
    .order('displayOrder', { ascending: true })
    .order('id', { ascending: true })
  if (!rows) return
  for (let i = 0; i < rows.length; i++) {
    const desired = i + 1
    if ((rows[i].displayOrder as number) !== desired) {
      await supabaseAdmin.from('LectureSection').update({ displayOrder: desired }).eq('id', rows[i].id).limit(1)
      rows[i].displayOrder = desired as any
    }
  }
  const idx = rows.findIndex((r) => r.id === id)
  if (idx <= 0) return
  const curr = rows[idx]
  const prev = rows[idx - 1]
  await supabaseAdmin.from('LectureSection').update({ displayOrder: prev.displayOrder }).eq('id', curr.id).limit(1)
  await supabaseAdmin.from('LectureSection').update({ displayOrder: curr.displayOrder }).eq('id', prev.id).limit(1)
  revalidatePath('/admin/lectures')
}

async function moveSectionDown(formData: FormData) {
  'use server'
  const id = Number(formData.get('id'))
  const { data: rows } = await supabaseAdmin
    .from('LectureSection')
    .select('id, displayOrder')
    .order('displayOrder', { ascending: true })
    .order('id', { ascending: true })
  if (!rows) return
  for (let i = 0; i < rows.length; i++) {
    const desired = i + 1
    if ((rows[i].displayOrder as number) !== desired) {
      await supabaseAdmin.from('LectureSection').update({ displayOrder: desired }).eq('id', rows[i].id).limit(1)
      rows[i].displayOrder = desired as any
    }
  }
  const idx = rows.findIndex((r) => r.id === id)
  if (idx === -1 || idx >= rows.length - 1) return
  const curr = rows[idx]
  const next = rows[idx + 1]
  await supabaseAdmin.from('LectureSection').update({ displayOrder: next.displayOrder }).eq('id', curr.id).limit(1)
  await supabaseAdmin.from('LectureSection').update({ displayOrder: curr.displayOrder }).eq('id', next.id).limit(1)
  revalidatePath('/admin/lectures')
}


