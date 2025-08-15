import { redirect } from 'next/navigation'
import { getServerSession } from '@/lib/session'
import { supabaseAdmin } from '@/lib/supabaseServer'
import { revalidatePath } from 'next/cache'
import ConfirmButton from '@/components/ConfirmButton'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type Row = { uid: string; email: string; bytes_total: number; last_upload: string | null }

export default async function AdminClientsPage() {
  const session = await getServerSession()
  if (!session.userId) redirect('/admin/login')

  // Читаем клиентов из Supabase Auth (кроме админов)
  const usersResp = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 })
  const authUsers = (usersResp as any).data?.users || []
  const clients = authUsers.filter((u: any) => (u?.app_metadata?.role || '') !== 'admin')

  const items: Row[] = []
  for (const u of clients) {
    const uid = u.id as string
    const email = u.email as string
    // Пытаемся получить агрегаты через RPC (если функция создана в БД)
    try {
      const { data: agg } = await supabaseAdmin.rpc('client_portal_usage', { uid })
      if (agg && Array.isArray(agg) && agg.length > 0) {
        const row: any = agg[0]
        items.push({ uid, email, bytes_total: Number(row.bytes_total || 0), last_upload: row.last_upload || null })
        continue
      }
    } catch {}

    // Фолбэк: собираем все URL из портала клиента и оцениваем размер
    const { data: galleries } = await supabaseAdmin
      .from('ClientGallery')
      .select('id')
      .eq('clientUserId', uid)
    const galleryIds = (galleries || []).map((g: any) => g.id)
    let bytes = 0
    let last: string | null = null
    if (galleryIds.length > 0) {
      const { data: cp } = await supabaseAdmin
        .from('ClientPhoto')
        .select('url, createdAt')
        .in('clientGalleryId', galleryIds)
      const { data: ap } = await supabaseAdmin
        .from('ClientAuthorPhoto')
        .select('url, createdAt')
        .in('clientGalleryId', galleryIds)
      const urls = [...(cp || []).map((x: any) => x.url), ...(ap || []).map((x: any) => x.url)]
      const times: string[] = [
        ...((cp || []).map((x: any) => x.createdAt).filter(Boolean)),
        ...((ap || []).map((x: any) => x.createdAt).filter(Boolean)),
      ]
      if (times.length > 0) {
        times.sort()
        last = times[times.length - 1]
      }
      // Оценка объёма: сначала по MediaAsset, затем HEAD-запросами для отсутствующих
      if (urls.length > 0) {
        const matched = new Set<string>()
        const chunk = 100
        for (let i = 0; i < urls.length; i += chunk) {
          const part = urls.slice(i, i + chunk)
          const { data: assets } = await supabaseAdmin
            .from('MediaAsset')
            .select('size, publicUrl')
            .in('publicUrl', part)
          for (const a of assets || []) {
            bytes += a.size || 0
            matched.add(a.publicUrl as string)
          }
        }
        // fallback для старых загрузок, которых нет в MediaAsset
        const missing = urls.filter((u) => !matched.has(u))
        const headChunk = 10
        for (let i = 0; i < missing.length; i += headChunk) {
          const part = missing.slice(i, i + headChunk)
          const sizes = await Promise.all(part.map(async (url) => {
            // 1) HEAD content-length
            try {
              const head = await fetch(url, { method: 'HEAD' as any, cache: 'no-store' as any })
              const len = head.headers.get('content-length')
              if (len) return Number(len)
            } catch {}
            // 2) GET с Range: 0-0 → читаем Content-Range
            try {
              const get = await fetch(url, { headers: { Range: 'bytes=0-0' } as any, cache: 'no-store' as any })
              const cr = get.headers.get('content-range') || get.headers.get('Content-Range')
              if (cr) {
                const m = cr.match(/\/(\d+)$/)
                if (m) return Number(m[1])
              }
            } catch {}
            return 0
          }))
          bytes += sizes.reduce((s, n) => s + (Number.isFinite(n) ? n : 0), 0)
        }
      }
    }
    items.push({ uid, email, bytes_total: bytes, last_upload: last })
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-xl font-semibold">Клиенты</h1>
        <div className="flex items-center gap-4 text-sm">
          <a href="/api/admin/migrate-client-media-sizes" target="_blank" className="underline">Пересчитать объём (миграция)</a>
          <form action="/api/admin/cleanup-orphan-media" method="GET" target="_blank" className="flex items-center gap-2">
            <input name="prefix" placeholder="префикс (напр. 2025/08/12)" className="border rounded p-1" />
            <button type="submit" className="underline">Удалить сироты</button>
          </form>
        </div>
      </div>
      <table className="w-full text-sm border">
        <thead className="bg-slate-50">
          <tr>
            <th className="text-left p-2 border">Логин (email)</th>
            <th className="text-left p-2 border">Объём загрузок</th>
            <th className="text-left p-2 border">Последняя загрузка</th>
            <th className="p-2 border">Действия</th>
          </tr>
        </thead>
        <tbody>
          {items.map((u) => (
            <tr key={u.uid}>
              <td className="p-2 border align-top">{u.email}</td>
              <td className="p-2 border align-top">{formatBytes(u.bytes_total || 0)}</td>
              <td className="p-2 border align-top">{u.last_upload ? new Date(u.last_upload).toLocaleString('ru-RU') : '—'}</td>
              <td className="p-2 border align-top text-center">
                <div className="flex items-center gap-3 justify-center">
                  <form action={recalcClientUsage}>
                    <input type="hidden" name="uid" defaultValue={u.uid} />
                    <button className="underline text-slate-700">Обновить объём</button>
                  </form>
                  <form action={deleteClient}>
                    <input type="hidden" name="uid" defaultValue={u.uid} />
                    <ConfirmButton>Удалить</ConfirmButton>
                  </form>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  const kb = bytes / 1024
  if (kb < 1024) return `${kb.toFixed(1)} KB`
  const mb = kb / 1024
  if (mb < 1024) return `${mb.toFixed(1)} MB`
  const gb = mb / 1024
  return `${gb.toFixed(2)} GB`
}

async function deleteClient(formData: FormData) {
  'use server'
  const uid = String(formData.get('uid') || '')
  if (!uid) return
  // 1) Собираем список URL, которые были в портале пользователя
  const { data: gs } = await supabaseAdmin
    .from('ClientGallery')
    .select('id')
    .eq('clientUserId', uid)
  const galleryIds = (gs || []).map((g: any) => g.id)
  const urls: string[] = []
  if (galleryIds.length > 0) {
    const [{ data: cp }, { data: ap }] = await Promise.all([
      supabaseAdmin.from('ClientPhoto').select('url').in('clientGalleryId', galleryIds),
      supabaseAdmin.from('ClientAuthorPhoto').select('url').in('clientGalleryId', galleryIds),
    ])
    urls.push(...(cp || []).map((x: any) => x.url), ...(ap || []).map((x: any) => x.url))
  }

  // 2) Удаляем все сущности портала (каскадом)
  if (galleryIds.length > 0) {
    await supabaseAdmin.from('ClientPhoto').delete().in('clientGalleryId', galleryIds)
    await supabaseAdmin.from('ClientAuthorPhoto').delete().in('clientGalleryId', galleryIds)
    await supabaseAdmin.from('ClientGallery').delete().in('id', galleryIds)
  }

  // 3) Безопасная очистка файлов в Storage только по URL из портала пользователя,
  //    и только если эти URL больше нигде не используются
  const uniq = Array.from(new Set(urls)).filter(Boolean)
  const supabaseUrl = process.env.SUPABASE_URL as string
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY as string
  const bucketEnv = process.env.SUPABASE_BUCKET || 'public-images'
  const { createClient } = await import('@supabase/supabase-js')
  const sb = createClient(supabaseUrl, key)

  for (const url of uniq) {
    // 3.1 проверяем ссылки в других местах (Promise-обёртка для совместимости типов)
    const exists = async (builder: any): Promise<boolean> => {
      const { data } = await builder
      return !!data
    }
    const checks = await Promise.all([
      exists(supabaseAdmin.from('ClientPhoto').select('id').eq('url', url).limit(1).maybeSingle()),
      exists(supabaseAdmin.from('ClientAuthorPhoto').select('id').eq('url', url).limit(1).maybeSingle()),
      exists(supabaseAdmin.from('Photo').select('id').eq('url', url).limit(1).maybeSingle()),
      exists(supabaseAdmin.from('Gallery').select('id').eq('coverUrl', url).limit(1).maybeSingle()),
      exists(supabaseAdmin.from('Lecture').select('id').eq('coverUrl', url).limit(1).maybeSingle()),
      exists(supabaseAdmin.from('Lecture').select('id').like('contentHtml', `%${url}%`).limit(1).maybeSingle()),
      exists(supabaseAdmin.from('NewsItem').select('id').like('bodyMd', `%${url}%`).limit(1).maybeSingle()),
      exists(supabaseAdmin.from('AuthorProfile').select('id').eq('avatarUrl', url).limit(1).maybeSingle()),
      exists(supabaseAdmin.from('AuthorProfile').select('id').like('bioMarkdown', `%${url}%`).limit(1).maybeSingle()),
    ])
    const anyUse = checks.some(Boolean)
    if (anyUse) continue

    // 3.2 удаляем объект из Storage и запись MediaAsset, если найдём
    const { data: asset } = await supabaseAdmin
      .from('MediaAsset')
      .select('id,bucket,path')
      .eq('publicUrl', url)
      .maybeSingle()
    if (asset) {
      const b = (asset as any).bucket || bucketEnv
      const p = (asset as any).path
      if (b && p && b === bucketEnv) {
        try { await sb.storage.from(b).remove([p]) } catch {}
      }
      await supabaseAdmin.from('MediaAsset').delete().eq('id', (asset as any).id).limit(1)
    } else {
      // Fallback: попытка извлечь bucket/path из URL и удалить объект напрямую
      let parsedBucket = ''
      let parsedPath = ''
      const mark = '/object/public/'
      const idx2 = url.indexOf(mark)
      if (idx2 !== -1) {
        const tail = url.substring(idx2 + mark.length)
        const parts = tail.split('/')
        if (parts.length >= 2) {
          parsedBucket = parts[0]
          parsedPath = parts.slice(1).join('/')
        }
      }
      if (parsedBucket && parsedPath && parsedBucket === bucketEnv) {
        try { await sb.storage.from(parsedBucket).remove([parsedPath]) } catch {}
      }
    }
  }

  // 4) Удаляем пользователя из Supabase Auth
  await supabaseAdmin.auth.admin.deleteUser(uid)
  revalidatePath('/admin/clients')
}

async function recalcClientUsage(formData: FormData) {
  'use server'
  const uid = String(formData.get('uid') || '')
  if (!uid) return
  // Создаём MediaAsset для отсутствующих URL этого клиента (пересчёт размеров)
  const { data: galleries } = await supabaseAdmin
    .from('ClientGallery')
    .select('id')
    .eq('clientUserId', uid)
  const galleryIds = (galleries || []).map((g: any) => g.id)
  const urls: string[] = []
  if (galleryIds.length > 0) {
    const [{ data: cp }, { data: ap }] = await Promise.all([
      supabaseAdmin.from('ClientPhoto').select('url').in('clientGalleryId', galleryIds),
      supabaseAdmin.from('ClientAuthorPhoto').select('url').in('clientGalleryId', galleryIds),
    ])
    urls.push(...(cp || []).map((x: any) => x.url), ...(ap || []).map((x: any) => x.url))
  }
  const uniq = Array.from(new Set(urls)).filter(Boolean)
  const bucket = process.env.SUPABASE_BUCKET || 'public-images'
  for (const url of uniq) {
    const { data: exists } = await supabaseAdmin.from('MediaAsset').select('id').eq('publicUrl', url).maybeSingle()
    if (exists) continue
    let size = 0
    try {
      const resp = await fetch(url, { method: 'HEAD' as any, cache: 'no-store' as any })
      const len = resp.headers.get('content-length'); if (len) size = Number(len)
      if (!size) {
        const get = await fetch(url, { headers: { Range: 'bytes=0-0' } as any, cache: 'no-store' as any })
        const cr = get.headers.get('content-range') || get.headers.get('Content-Range')
        const m = cr?.match(/\/(\d+)$/); if (m) size = Number(m[1])
      }
    } catch {}
    // best-effort извлечение path (после /object/public/<bucket>/)
    let path = ''
    const idx = url.indexOf(`/object/public/`)
    if (idx !== -1) {
      const tail = url.substring(idx + `/object/public/`.length)
      const parts = tail.split('/'); if (parts.length >= 2) path = parts.slice(1).join('/')
    }
    await supabaseAdmin.from('MediaAsset').insert({ sha256: `recalc-${Date.now()}`, size, contentType: null, bucket, path, publicUrl: url })
  }
  revalidatePath('/admin/clients')
}


