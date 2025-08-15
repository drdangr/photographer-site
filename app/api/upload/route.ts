import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseServer'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const file = formData.get('file') as unknown as File | null
  if (!file) return Response.json({ message: 'Нет файла' }, { status: 400 })

  const originalName = (file as any).name || 'image'
  // sanitize filename for Supabase Storage (no spaces or unsupported chars)
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
  const filename = `${Date.now()}-${sanitizedBase || 'image'}${ext}`

  const urlObj = new URL(request.url)
  let prefix = urlObj.searchParams.get('prefix') || ''
  const galleryIdRaw = urlObj.searchParams.get('galleryId')
  if (!prefix && galleryIdRaw) {
    const gId = Number(galleryIdRaw)
    if (Number.isFinite(gId) && gId > 0) {
      const { data: g } = await supabaseAdmin
        .from('ClientGallery')
        .select('clientUserId')
        .eq('id', gId)
        .maybeSingle()
      if (g?.clientUserId) prefix = `clients/${g.clientUserId}`
    }
  }
  prefix = prefix.replace(/^\/+|\/+$/g, '') // trim slashes

  const useSupabase = !!process.env.SUPABASE_URL && !!process.env.SUPABASE_SERVICE_ROLE_KEY

  if (useSupabase) {
    const { createClient } = await import('@supabase/supabase-js')
    const supabaseUrl = process.env.SUPABASE_URL as string
    const supabaseKey = (process.env.SUPABASE_SERVICE_ROLE_KEY as string) || (process.env.SUPABASE_ANON_KEY as string)
    const bucket = process.env.SUPABASE_BUCKET || 'public-images'

    const supabase = createClient(supabaseUrl, supabaseKey)
    const arrayBuffer = await file.arrayBuffer()
    const d = new Date()
    const folder = `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`
    const prefixPath = prefix ? prefix : folder
    const filePath = `${prefixPath}/${filename}`

    const { error } = await supabase.storage.from(bucket).upload(filePath, Buffer.from(arrayBuffer), {
      contentType: (file as any).type || 'application/octet-stream',
      upsert: true,
    })

    if (error) {
      return Response.json({ message: `Supabase upload error: ${error.message}` }, { status: 500 })
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(filePath)
    return Response.json({ url: data.publicUrl })
  }

  // Локально сохраняем в public/uploads (dev)
  const { createWriteStream, mkdirSync, existsSync } = await import('fs')
  const { join } = await import('path')
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  const uploadDir = join(process.cwd(), 'public', 'uploads')
  const dir = prefix ? join(uploadDir, ...prefix.split('/')) : uploadDir
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  const filepath = join(dir, filename)
  await new Promise<void>((resolve, reject) => {
    const stream = createWriteStream(filepath)
    stream.write(buffer)
    stream.end()
    stream.on('finish', () => resolve())
    stream.on('error', reject)
  })
  const publicPath = prefix ? `/uploads/${prefix}/${filename}` : `/uploads/${filename}`
  return Response.json({ url: publicPath })
}


