import { supabaseAdmin } from '@/lib/supabaseServer'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function saveGallery(formData: FormData) {
  'use server'
  const id = Number(formData.get('id') || 0)
  const locale = String(formData.get('_locale') || 'ru') as 'ru' | 'uk' | 'en'
  const title = String(formData.get('title') || '')
  const slug = String(formData.get('slug') || '')
  const description = String(formData.get('description') || '') || null
  const coverUrl = String(formData.get('coverUrl') || '') || null
  const photosJson = String(formData.get('photosJson') || '[]')
  const alt = String(formData.get('alt') || '') || null
  const altsJson = String(formData.get('altsJson') || '[]')
  const displayOrderRaw = formData.get('displayOrder')
  const displayOrder = displayOrderRaw !== null && displayOrderRaw !== '' ? Number(displayOrderRaw) : undefined
  const nowIso = new Date().toISOString()

  if (!title || !slug) return

  // Create or update gallery
  let gallery: { id: number }
  if (id) {
    const updatePayload: any = { slug, coverUrl, updatedAt: nowIso }
    if (locale === 'uk') { updatePayload.titleUk = title; updatePayload.descriptionUk = description }
    else if (locale === 'en') { updatePayload.titleEn = title; updatePayload.descriptionEn = description }
    else { updatePayload.title = title; updatePayload.description = description }
    if (displayOrder !== undefined && !Number.isNaN(displayOrder)) updatePayload.displayOrder = displayOrder
    const { error } = await supabaseAdmin
      .from('Gallery')
      .update(updatePayload)
      .eq('id', id)
      .limit(1)
    if (error) throw new Error(`Не удалось обновить галерею: ${error.message}`)
    gallery = { id }
  } else {
    const insertBase: any = { slug, coverUrl, createdAt: nowIso, updatedAt: nowIso }
    if (locale === 'uk') { insertBase.titleUk = title; insertBase.descriptionUk = description }
    else if (locale === 'en') { insertBase.titleEn = title; insertBase.descriptionEn = description }
    else { insertBase.title = title; insertBase.description = description }
    if (displayOrder !== undefined && !Number.isNaN(displayOrder)) insertBase.displayOrder = displayOrder

    // Первая попытка — с указанными полями
    let { data, error } = await supabaseAdmin
      .from('Gallery')
      .insert(insertBase)
      .select('id')
      .single()

    // Если ошибка из-за отсутствия столбца displayOrder — пробуем без него
    if (error && String(error.message).toLowerCase().includes('displayorder')) {
      // retry without displayOrder
      delete insertBase.displayOrder
      const retry = await supabaseAdmin.from('Gallery').insert(insertBase).select('id').single()
      data = retry.data
      error = retry.error as any
    }

    if (error) {
      const msg = /unique|duplicate|slug/i.test(error.message)
        ? 'Галерея с таким slug уже существует'
        : error.message
      throw new Error(`Не удалось создать галерею: ${msg}`)
    }
    if (!data) throw new Error('Не удалось создать галерею: пустой ответ')
    gallery = { id: (data as any).id as number }
  }

  // Optionally add photos in bulk when provided
  if (photosJson) {
    try {
      const parsed = JSON.parse(photosJson)
      const parsedAlts = JSON.parse(altsJson || '[]')
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
          const rows = urls.map((u, i) => ({
            galleryId: gallery.id,
            url: u,
            alt: (Array.isArray(parsedAlts) && typeof parsedAlts[i] === 'string' && parsedAlts[i].trim().length > 0) ? parsedAlts[i] : alt,
            order: order++
          }))
          await supabaseAdmin.from('Photo').insert(rows)
        }
      }
    } catch {
      // ignore malformed photosJson
    }
  }

  revalidatePath('/galleries')
  revalidatePath('/admin/galleries')
  revalidatePath(`/galleries/${slug}`)
  redirect(`/admin/galleries/${gallery.id}`)
}

export async function deleteGallery(formData: FormData) {
  'use server'
  const id = Number(formData.get('id'))
  if (!id) return
  // Получаем slug и URL-ы фотографий ДО удаления записей
  const { data: g } = await supabaseAdmin
    .from('Gallery')
    .select('id, slug, coverUrl')
    .eq('id', id)
    .maybeSingle()
  const { data: photosBefore } = await supabaseAdmin
    .from('Photo')
    .select('url')
    .eq('galleryId', id)

  // Удаляем записи из БД (в некоторых БД нет каскада)
  await supabaseAdmin.from('Photo').delete().eq('galleryId', id)
  await supabaseAdmin.from('Gallery').delete().eq('id', id).limit(1)

  // Пытаемся удалить файлы из Storage (best-effort, без падения в случае ошибки)
  try {
    const bucket = process.env.SUPABASE_BUCKET || 'public-images'
    if (g?.coverUrl) {
      const match = g.coverUrl.match(/\/object\/public\/(.*?)\/(.*)$/)
      const b = match?.[1] || bucket
      const p = match?.[2]
      if (p) {
        const { createClient } = await import('@supabase/supabase-js')
        const client = createClient(process.env.SUPABASE_URL as string, (process.env.SUPABASE_SERVICE_ROLE_KEY as string) || (process.env.SUPABASE_ANON_KEY as string))
        await client.storage.from(b).remove([p])
      }
    }
    const photos = photosBefore as any[] | null | undefined
    if (photos && photos.length > 0) {
      const { createClient } = await import('@supabase/supabase-js')
      const client = createClient(process.env.SUPABASE_URL as string, (process.env.SUPABASE_SERVICE_ROLE_KEY as string) || (process.env.SUPABASE_ANON_KEY as string))
      const toRemove: { bucket: string; path: string }[] = []
      for (const ph of photos) {
        const m = String(ph.url).match(/\/object\/public\/(.*?)\/(.*)$/)
        if (m?.[1] && m?.[2]) toRemove.push({ bucket: m[1], path: m[2] })
      }
      const groups: Record<string, string[]> = {}
      for (const it of toRemove) {
        groups[it.bucket] = groups[it.bucket] || []
        groups[it.bucket].push(it.path)
      }
      for (const [b, paths] of Object.entries(groups)) {
        await client.storage.from(b).remove(paths)
      }
    }
  } catch {}

  revalidatePath('/galleries')
  revalidatePath('/admin/galleries')
  if (g?.slug) revalidatePath(`/galleries/${g.slug}`)
  redirect('/admin/galleries')
}


