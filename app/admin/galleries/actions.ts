"use server"
import { revalidatePath } from 'next/cache'
import { supabaseAdmin } from '@/lib/supabaseServer'

export async function moveGalleryUp(id: number) {
  if (!id) return { ok: false, error: 'no id' }
  const { data: rows } = await supabaseAdmin
    .from('Gallery')
    .select('id, displayOrder')
    .order('displayOrder', { ascending: true })
    .order('id', { ascending: true })
  if (!rows) return { ok: false, error: 'no rows' }
  // normalize to 1..N
  for (let i = 0; i < rows.length; i++) {
    const desired = i + 1
    if ((rows[i].displayOrder as number) !== desired) {
      await supabaseAdmin.from('Gallery').update({ displayOrder: desired }).eq('id', rows[i].id).limit(1)
      rows[i].displayOrder = desired as any
    }
  }
  const idx = rows.findIndex((r) => r.id === id)
  if (idx <= 0) return { ok: true }
  const curr = rows[idx]
  const prev = rows[idx - 1]
  await supabaseAdmin.from('Gallery').update({ displayOrder: prev.displayOrder }).eq('id', curr.id).limit(1)
  await supabaseAdmin.from('Gallery').update({ displayOrder: curr.displayOrder }).eq('id', prev.id).limit(1)
  const { data: result } = await supabaseAdmin
    .from('Gallery')
    .select('id, title, slug, displayOrder')
    .order('displayOrder', { ascending: true })
    .order('id', { ascending: true })
  revalidatePath('/admin/galleries')
  return { ok: true, items: result }
}

export async function moveGalleryDown(id: number) {
  if (!id) return { ok: false, error: 'no id' }
  const { data: rows } = await supabaseAdmin
    .from('Gallery')
    .select('id, displayOrder')
    .order('displayOrder', { ascending: true })
    .order('id', { ascending: true })
  if (!rows) return { ok: false, error: 'no rows' }
  // normalize to 1..N
  for (let i = 0; i < rows.length; i++) {
    const desired = i + 1
    if ((rows[i].displayOrder as number) !== desired) {
      await supabaseAdmin.from('Gallery').update({ displayOrder: desired }).eq('id', rows[i].id).limit(1)
      rows[i].displayOrder = desired as any
    }
  }
  const idx = rows.findIndex((r) => r.id === id)
  if (idx === -1 || idx >= rows.length - 1) return { ok: true }
  const curr = rows[idx]
  const next = rows[idx + 1]
  await supabaseAdmin.from('Gallery').update({ displayOrder: next.displayOrder }).eq('id', curr.id).limit(1)
  await supabaseAdmin.from('Gallery').update({ displayOrder: curr.displayOrder }).eq('id', next.id).limit(1)
  const { data: result } = await supabaseAdmin
    .from('Gallery')
    .select('id, title, slug, displayOrder')
    .order('displayOrder', { ascending: true })
    .order('id', { ascending: true })
  revalidatePath('/admin/galleries')
  return { ok: true, items: result }
}


