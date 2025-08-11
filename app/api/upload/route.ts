import { NextRequest } from 'next/server'
import { createWriteStream, mkdirSync, existsSync } from 'fs'
import { join } from 'path'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const file = formData.get('file') as unknown as File | null
  if (!file) return Response.json({ message: 'Нет файла' }, { status: 400 })

  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  const uploadDir = join(process.cwd(), 'public', 'uploads')
  if (!existsSync(uploadDir)) mkdirSync(uploadDir, { recursive: true })

  const filename = `${Date.now()}-${(file as any).name || 'image'}`
  const filepath = join(uploadDir, filename)
  await new Promise<void>((resolve, reject) => {
    const stream = createWriteStream(filepath)
    stream.write(buffer)
    stream.end()
    stream.on('finish', () => resolve())
    stream.on('error', reject)
  })

  const url = `/uploads/${filename}`
  return Response.json({ url })
}


