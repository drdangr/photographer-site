import { NextRequest } from 'next/server'
import { getServerSession } from '@/lib/session'
import { supabaseAdmin } from '@/lib/supabaseServer'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  const session = await getServerSession()
  const userId = session.userId || null
  const body = await request.json().catch(() => null as any)
  if (!body?.sha256 || !body?.publicUrl || !body?.bucket || !body?.path) {
    return Response.json({ message: 'Bad request' }, { status: 400 })
  }
  const payload = {
    sha256: String(body.sha256),
    size: Number(body.size || 0),
    contentType: body.contentType ? String(body.contentType) : null,
    bucket: String(body.bucket),
    path: String(body.path),
    publicUrl: String(body.publicUrl),
    ...(userId ? { userId } : {}),
  }
  const { error } = await supabaseAdmin
    .from('MediaAsset')
    .upsert(payload as any, { onConflict: 'sha256' })
  if (error) return Response.json({ message: error.message }, { status: 500 })
  return Response.json({ ok: true })
}


