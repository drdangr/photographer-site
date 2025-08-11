import { supabaseAdmin } from '@/lib/supabaseServer'
import { redirect } from 'next/navigation'

export async function saveGallery(formData: FormData) {
  'use server'
  const id = Number(formData.get('id') || 0)
  const title = String(formData.get('title') || '')
  const slug = String(formData.get('slug') || '')
  const description = String(formData.get('description') || '') || null
  const coverUrl = String(formData.get('coverUrl') || '') || null
  const photosJson = String(formData.get('photosJson') || '[]')
  const alt = String(formData.get('alt') || '') || null
  const displayOrderRaw = formData.get('displayOrder')
  const displayOrder = displayOrderRaw !== null && displayOrderRaw !== '' ? Number(displayOrderRaw) : undefined

  if (!title || !slug) return

  // Create or update gallery
  let gallery: { id: number }
  if (id) {
    await supabaseAdmin.from('Gallery').update({ title, slug, description, coverUrl, ...(displayOrder !== undefined ? { displayOrder } : {}) }).eq('id', id).limit(1)
    gallery = { id }
  } else {
    const { data, error } = await supabaseAdmin.from('Gallery').insert({ title, slug, description, coverUrl, displayOrder: displayOrder ?? 0 }).select('id').maybeSingle()
    if (error || !data) throw new Error('Не удалось создать галерею')
    gallery = { id: data.id as number }
  }

  // Optionally add photos in bulk when provided
  if (photosJson) {
    try {
      const parsed = JSON.parse(photosJson)
      if (Array.isArray(parsed) && parsed.length > 0) {
        const { data: maxRow } = await supabaseAdmin
          .from('Photo')
          .select('order')
          .eq('galleryId', gallery.id)
          .order('order', { ascending: false })
          .limit(1)
          .maybeSingle()
        let order = ((maxRow?.order as number) ?? 0) + 1
        const urls: string[] = parsed.filter((u) => typeof u === 'string' && u.length > 0)
        if (urls.length > 0) {
          await supabaseAdmin.from('Photo').insert(urls.map((u) => ({ galleryId: gallery.id, url: u, alt, order: order++ })))
        }
      }
    } catch {
      // ignore malformed photosJson
    }
  }

  redirect(`/admin/galleries/${gallery.id}`)
}

export async function deleteGallery(formData: FormData) {
  'use server'
  const id = Number(formData.get('id'))
  if (!id) return
  await supabaseAdmin.from('Gallery').delete().eq('id', id).limit(1)
  redirect('/admin/galleries')
}


