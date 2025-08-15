import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseServer'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  // Собираем все URL из ClientPhoto/ClientAuthorPhoto и создаём MediaAsset для тех, кого ещё нет
  const { data: cp } = await supabaseAdmin.from('ClientPhoto').select('url')
  const { data: ap } = await supabaseAdmin.from('ClientAuthorPhoto').select('url')
  const urls = Array.from(new Set([...(cp || []).map((x: any) => x.url), ...(ap || []).map((x: any) => x.url)])).filter(Boolean)
  let created = 0
  let skipped = 0
  const bucket = process.env.SUPABASE_BUCKET || 'public-images'

  for (const url of urls) {
    const { data: exists } = await supabaseAdmin.from('MediaAsset').select('id').eq('publicUrl', url).maybeSingle()
    if (exists) { skipped++; continue }
    let size = 0
    try {
      const resp = await fetch(url, { method: 'HEAD' as any, cache: 'no-store' as any })
      const len = resp.headers.get('content-length')
      size = len ? Number(len) : 0
    } catch {}
    // Грубое извлечение path из URL (после /object/public/<bucket>/)
    let path = ''
    const idx = url.indexOf(`/object/public/`)
    if (idx !== -1) {
      const tail = url.substring(idx + `/object/public/`.length)
      const parts = tail.split('/')
      if (parts.length >= 2) {
        // первая часть — имя бакета
        path = parts.slice(1).join('/')
      }
    }
    await supabaseAdmin.from('MediaAsset').insert({ sha256: `legacy-${Date.now()}-${Math.random()}`, size, contentType: null, bucket, path, publicUrl: url })
    created++
  }

  return Response.json({ ok: true, total: urls.length, created, skipped })
}


