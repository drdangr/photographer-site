import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseServer'

export const runtime = 'nodejs'

function sanitizeFilename(originalName: string): string {
  const extMatch = originalName.match(/\.[a-zA-Z0-9]+$/)
  const ext = extMatch ? extMatch[0].toLowerCase() : ''
  const base = originalName.replace(/\.[^.]*$/, '')
  const sanitizedBase = base
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9._-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$|\.+$/g, '')
    .slice(0, 80)
  const stamp = Date.now()
  return `${stamp}-${sanitizedBase || 'file'}${ext}`
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null as any)
  const originalName = (body?.fileName as string) || 'upload.bin'
  const bucket = process.env.SUPABASE_BUCKET || 'public-images'

  const d = new Date()
  const folder = `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`
  const filename = sanitizeFilename(originalName)
  const path = `${folder}/${filename}`

  const { data, error } = await supabaseAdmin.storage.from(bucket).createSignedUploadUrl(path)
  if (error || !data) {
    return Response.json({ message: error?.message || 'Cannot create signed upload url' }, { status: 500 })
  }

  const publicUrl = supabaseAdmin.storage.from(bucket).getPublicUrl(path).data.publicUrl
  return Response.json({ bucket, path, token: data.token, publicUrl })
}


