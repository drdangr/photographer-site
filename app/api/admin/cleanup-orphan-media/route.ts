import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseServer'

export const runtime = 'nodejs'

function buildPublicUrl(bucket: string, path: string) {
  const base = process.env.SUPABASE_URL?.replace(/\/$/, '')
  return `${base}/storage/v1/object/public/${bucket}/${path}`
}

async function isUrlReferenced(url: string) {
  const q = [
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
  const results = await Promise.allSettled(q)
  return results.some((r) => r.status === 'fulfilled' && (r as any).value?.data)
}

export async function GET(req: NextRequest) {
  const prefix = req.nextUrl.searchParams.get('prefix') || '' // e.g. 2025/08/12
  const bucket = process.env.SUPABASE_BUCKET || 'public-images'
  const { createClient } = await import('@supabase/supabase-js')
  const sb = createClient(process.env.SUPABASE_URL as string, process.env.SUPABASE_SERVICE_ROLE_KEY as string)

  // Рекурсивный обход: глубина до 3 уровней (год/месяц/день)
  async function listAll(path: string): Promise<string[]> {
    const out: string[] = []
    const { data, error } = await sb.storage.from(bucket).list(path, { limit: 1000 })
    if (error) return out
    for (const item of data || []) {
      // По API Supabase: элемент с metadata === null — это папка; с metadata !== null — файл
      if (!item.name) continue
      const nextPath = path ? `${path}/${item.name}` : item.name
      if (item.metadata) {
        out.push(nextPath)
      } else {
        const child = await listAll(nextPath)
        out.push(...child)
      }
    }
    return out
  }

  const paths = await listAll(prefix)
  const deleted: string[] = []
  const kept: string[] = []

  for (const p of paths) {
    const url = buildPublicUrl(bucket, p)
    const ref = await isUrlReferenced(url)
    if (ref) { kept.push(p); continue }
    const { error } = await sb.storage.from(bucket).remove([p])
    if (!error) deleted.push(p)
    else kept.push(p)
    // чистим MediaAsset при совпадении URL
    await supabaseAdmin.from('MediaAsset').delete().eq('publicUrl', url)
  }

  return Response.json({ ok: true, prefix, scanned: paths.length, deleted, kept })
}


