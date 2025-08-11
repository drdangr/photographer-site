import { NextRequest } from 'next/server'

// В продакшене используем Vercel Blob, локально — файловую систему
const useBlob = !!process.env.BLOB_READ_WRITE_TOKEN

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const file = formData.get('file') as unknown as File | null
  if (!file) return Response.json({ message: 'Нет файла' }, { status: 400 })

  const filename = `${Date.now()}-${(file as any).name || 'image'}`

  if (useBlob) {
    // Vercel Blob
    const arrayBuffer = await file.arrayBuffer()
    const res = await fetch('https://api.vercel.com/v2/blob/upload', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`,
        'x-api-version': '2',
        'content-type': 'application/octet-stream',
        'x-vercel-filename': filename,
      },
      body: Buffer.from(arrayBuffer),
    })
    if (!res.ok) {
      const t = await res.text()
      return Response.json({ message: `Blob error: ${t}` }, { status: 500 })
    }
    const data = await res.json()
    return Response.json({ url: data.url as string })
  }

  // Локально сохраняем в public/uploads
  const { createWriteStream, mkdirSync, existsSync } = await import('fs')
  const { join } = await import('path')
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  const uploadDir = join(process.cwd(), 'public', 'uploads')
  if (!existsSync(uploadDir)) mkdirSync(uploadDir, { recursive: true })
  const filepath = join(uploadDir, filename)
  await new Promise<void>((resolve, reject) => {
    const stream = createWriteStream(filepath)
    stream.write(buffer)
    stream.end()
    stream.on('finish', () => resolve())
    stream.on('error', reject)
  })
  return Response.json({ url: `/uploads/${filename}` })
}


