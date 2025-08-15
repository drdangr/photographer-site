'use server'
import { revalidatePath } from 'next/cache'
import { supabaseAdmin } from '@/lib/supabaseServer'

async function removeUrlFromStorageIfUnused(url: string) {
  if (!url) return
  // Проверяем использование URL в других сущностях
  const checks: Promise<any>[] = [
    supabaseAdmin.from('ClientPhoto').select('id').eq('url', url).limit(1).maybeSingle(),
    supabaseAdmin.from('ClientAuthorPhoto').select('id').eq('url', url).limit(1).maybeSingle(),
    supabaseAdmin.from('Photo').select('id').eq('url', url).limit(1).maybeSingle(),
    supabaseAdmin.from('Gallery').select('id').eq('coverUrl', url).limit(1).maybeSingle(),
    supabaseAdmin.from('Lecture').select('id').eq('coverUrl', url).limit(1).maybeSingle(),
    supabaseAdmin.from('Lecture').select('id').like('contentHtml', `%${url}%`).limit(1).maybeSingle(),
    supabaseAdmin.from('NewsItem').select('id').like('bodyMd', `%${url}%`).limit(1).maybeSingle(),
    supabaseAdmin.from('AuthorProfile').select('id').eq('avatarUrl', url).limit(1).maybeSingle(),
    supabaseAdmin.from('AuthorProfile').select('id').like('bioMarkdown', `%${url}%`).limit(1).maybeSingle(),
  ]
  const results = await Promise.allSettled(checks)
  const stillUsed = results.some((r) => r.status === 'fulfilled' && (r as any).value?.data)
  if (stillUsed) return

  // Попытка удалить через MediaAsset, если есть
  const { data: asset } = await supabaseAdmin
    .from('MediaAsset')
    .select('id,bucket,path')
    .eq('publicUrl', url)
    .maybeSingle()
  try {
    const { createClient } = await import('@supabase/supabase-js')
    const client = createClient(
      process.env.SUPABASE_URL as string,
      (process.env.SUPABASE_SERVICE_ROLE_KEY as string) || (process.env.SUPABASE_ANON_KEY as string)
    )
    if (asset?.bucket && asset?.path) {
      await client.storage.from(asset.bucket as any).remove([asset.path as any])
      await supabaseAdmin.from('MediaAsset').delete().eq('id', asset.id as any).limit(1)
      return
    }
    // Fallback: парсим bucket/path из URL
    const mark = '/object/public/'
    const idx = url.indexOf(mark)
    if (idx !== -1) {
      const tail = url.substring(idx + mark.length)
      const parts = tail.split('/')
      if (parts.length >= 2) {
        const bucket = parts[0]
        const path = parts.slice(1).join('/')
        await client.storage.from(bucket).remove([path])
      }
    }
  } catch {}
}

export async function deleteClientGallery(formData: FormData) {
  const id = Number(formData.get('galleryId'))
  if (!id) return
  // Загружаем URL до удаления
  const [{ data: cp }, { data: ap }] = await Promise.all([
    supabaseAdmin.from('ClientPhoto').select('url').eq('clientGalleryId', id),
    supabaseAdmin.from('ClientAuthorPhoto').select('url').eq('clientGalleryId', id),
  ])
  const urls = [
    ...((cp || []).map((x: any) => x.url)),
    ...((ap || []).map((x: any) => x.url)),
  ].filter(Boolean)

  // Удаляем записи из БД
  await supabaseAdmin.from('ClientPhoto').delete().eq('clientGalleryId', id)
  await supabaseAdmin.from('ClientAuthorPhoto').delete().eq('clientGalleryId', id)
  await supabaseAdmin.from('ClientGallery').delete().eq('id', id).limit(1)

  // Удаляем файлы, если не используются больше нигде
  const uniq = Array.from(new Set(urls))
  for (const url of uniq) await removeUrlFromStorageIfUnused(url)

  revalidatePath('/clients/galleries')
}

export async function deleteClientAuthorPhoto(formData: FormData) {
  const photoId = Number(formData.get('photoId'))
  const galleryId = Number(formData.get('galleryId')) || undefined
  if (!photoId) return
  const { data: row } = await supabaseAdmin
    .from('ClientAuthorPhoto')
    .select('id,url,clientGalleryId')
    .eq('id', photoId)
    .maybeSingle()
  await supabaseAdmin.from('ClientAuthorPhoto').delete().eq('id', photoId).limit(1)
  if (row?.url) await removeUrlFromStorageIfUnused(row.url as any)
  if (galleryId || row?.clientGalleryId) {
    revalidatePath(`/clients/galleries/${galleryId || row?.clientGalleryId}`)
  } else {
    revalidatePath('/clients/galleries')
  }
}


