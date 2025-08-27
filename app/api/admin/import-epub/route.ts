import { NextRequest } from 'next/server'
import JSZip from 'jszip'
import { XMLParser } from 'fast-xml-parser'
import sanitizeHtml from 'sanitize-html'
import { load as loadHtml } from 'cheerio'
import { supabaseAdmin } from '@/lib/supabaseServer'

export const runtime = 'nodejs'

function formatDateParts(d = new Date()) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return { y, m, day }
}

function sanitize(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: [
      'h1','h2','h3','p','strong','em','u','s','a','ul','ol','li','blockquote','code','pre',
      'table','thead','tbody','tr','td','th','img','hr','br','span','figure','figcaption'
    ],
    allowedAttributes: {
      a: ['href','title'],
      img: ['src','alt','title','loading','style'],
      '*': ['style']
    },
    transformTags: {
      img: (tagName, attribs) => {
        const baseStyle = 'display:block;max-width:100%;width:100%;height:auto;margin:0;'
        const style = attribs.style ? `${attribs.style};${baseStyle}` : baseStyle
        const { width, height, ...rest } = attribs as any
        return { tagName, attribs: { ...rest, loading: 'lazy', style } }
      }
    },
    allowVulnerableTags: true,
  })
}

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || ''
    let lectureId = 0
    let slug = ''
    let locale: 'ru' | 'uk' | 'en' = 'ru'
    let buffer: Buffer | null = null

    if (contentType.includes('application/json')) {
      const body = (await req.json().catch(() => null)) as any
      lectureId = Number(body?.lectureId || 0)
      slug = String(body?.slug || '')
      if (body?.locale && ['ru','uk','en'].includes(String(body.locale))) locale = String(body.locale) as any
      const bucket = String(body?.bucket || process.env.SUPABASE_BUCKET || 'public-images')
      const path = String(body?.path || '')
      const fileUrl = typeof body?.fileUrl === 'string' ? (body.fileUrl as string) : ''
      if (!lectureId || !slug || (!path && !fileUrl)) return Response.json({ message: 'Bad request' }, { status: 400 })
      if (fileUrl) {
        const resp = await fetch(fileUrl)
        if (!resp.ok) return Response.json({ message: 'Cannot download file' }, { status: 400 })
        const arr = await resp.arrayBuffer()
        buffer = Buffer.from(arr)
      } else {
        const { createClient } = await import('@supabase/supabase-js')
        const sb = createClient(
          process.env.SUPABASE_URL as string,
          (process.env.SUPABASE_SERVICE_ROLE_KEY as string) || (process.env.SUPABASE_ANON_KEY as string)
        )
        const { data: blob, error } = await sb.storage.from(bucket).download(path)
        if (error || !blob) return Response.json({ message: error?.message || 'Cannot download file' }, { status: 500 })
        const arr = await (blob as Blob).arrayBuffer()
        buffer = Buffer.from(arr)
      }
    } else {
      const form = await req.formData()
      const file = form.get('file') as unknown as File | null
      lectureId = Number(form.get('lectureId') || 0)
      slug = String(form.get('slug') || '')
      const lRaw = String(form.get('locale') || '')
      if (['ru','uk','en'].includes(lRaw)) locale = lRaw as any
      if (!file || !lectureId || !slug) return Response.json({ message: 'Bad request' }, { status: 400 })
      buffer = Buffer.from(await (file as any).arrayBuffer())
    }

    if (!buffer) return Response.json({ message: 'No file' }, { status: 400 })
    const zip = await JSZip.loadAsync(buffer)

    // 1) Читаем контейнер и OPF
    const containerXml = await zip.file('META-INF/container.xml')?.async('string')
    if (!containerXml) return Response.json({ message: 'Invalid EPUB (no container.xml)' }, { status: 400 })
    const parser = new XMLParser({ ignoreAttributes: false })
    const container = parser.parse(containerXml)
    const rootfile = container?.container?.rootfiles?.rootfile?.['@_full-path']
    if (!rootfile) return Response.json({ message: 'Invalid EPUB (no rootfile)' }, { status: 400 })

    const opfText = await zip.file(rootfile)?.async('string')
    if (!opfText) return Response.json({ message: 'Invalid EPUB (no OPF)' }, { status: 400 })
    const opf = parser.parse(opfText)
    const manifest: Array<any> = [].concat(opf?.package?.manifest?.item || [])
    const spine: Array<any> = [].concat(opf?.package?.spine?.itemref || [])

    const manifestById = new Map<string, any>()
    for (const it of manifest) manifestById.set(it['@_id'], it)

    const basePath = rootfile.substring(0, rootfile.lastIndexOf('/') + 1)
    const { y, m, day } = formatDateParts(new Date())
    const picturesPrefix = `lectures/${y}/${m}/${day}/${slug}/pictures`
    const coversPrefix = `lectures/${y}/${m}/${day}/${slug}/covers`
    const bucket = process.env.SUPABASE_BUCKET || 'public-images'

    // 2) Вспомогалка загрузки в Storage
    const uploadFile = async (path: string, data: Uint8Array, contentType?: string) => {
      const { createClient } = await import('@supabase/supabase-js')
      const supabaseUrl = process.env.SUPABASE_URL as string
      const supabaseKey = (process.env.SUPABASE_SERVICE_ROLE_KEY as string) || (process.env.SUPABASE_ANON_KEY as string)
      const sb = createClient(supabaseUrl, supabaseKey)
      const { error } = await sb.storage.from(bucket).upload(path, data, { contentType, upsert: true })
      if (error) throw new Error(error.message)
      const { data: pu } = sb.storage.from(bucket).getPublicUrl(path)
      return pu.publicUrl
    }

    // 3) Обложка
    let coverUrl: string | null = null
    const coverId = manifest.find((i) => (i['@_properties'] || '').includes('cover-image'))?.['@_id']
    const coverHref = coverId ? manifestById.get(coverId)?.['@_href'] : null
    if (coverHref) {
      const entry = zip.file(basePath + coverHref)
      if (entry) {
        const bin = await entry.async('uint8array')
        const path = `${coversPrefix}/${Date.now()}-${coverHref.split('/').pop()}`
        coverUrl = await uploadFile(path, bin)
      }
    }

    // 4) Главы → HTML
    const htmlParts: string[] = []
    for (const itemref of spine) {
      const idref = itemref['@_idref']
      const item = manifestById.get(idref)
      if (!item) continue
      const href = item['@_href']
      const entry = zip.file(basePath + href)
      if (!entry) continue
      const xhtml = await entry.async('string')
      const $ = loadHtml(xhtml, { xmlMode: true })
      // убираем типичные артефакты экспорта
      $('span.Apple-converted-space').each((_, el) => {
        $(el).replaceWith(' ')
      })

      // переносим img → Supabase, переписываем пути
      const imgs = $('img').toArray()
      await Promise.all(imgs.map(async (el) => {
        const src = $(el).attr('src')
        if (!src) return
        const imgFile = zip.file(basePath + src)
        if (!imgFile) return
        const bin = await imgFile.async('uint8array')
        const name = src.split('/').pop() || 'image'
        const path = `${picturesPrefix}/${Date.now()}-${name}`
        const url = await uploadFile(path, bin)
        $(el).attr('src', url).attr('loading', 'lazy')
      }))

      // нормализуем HTML для TipTap
      const body = $('body').length ? $('body').html() || '' : $.root().html() || ''
      // удаляем невидимые/служебные символы: объект‑замена, ZWSP/ZWJ, BOM, мягкие переносы
      const cleaned = body.replace(/[\uFFFC\uFEFF\u200B\u200C\u200D\u2060\u00AD]/g, '')
      htmlParts.push(sanitize(cleaned))
    }

    const finalHtml = htmlParts.join('\n')

    // 5) Сохраняем в Lecture с учётом локали
    const patch: any = { coverUrl }
    if (locale === 'uk') patch.contentHtmlUk = finalHtml
    else if (locale === 'en') patch.contentHtmlEn = finalHtml
    else patch.contentHtml = finalHtml
    await supabaseAdmin.from('Lecture').update(patch).eq('id', lectureId).limit(1)

    return Response.json({ ok: true, coverUrl, length: finalHtml.length })
  } catch (e: any) {
    return Response.json({ ok: false, message: e?.message || 'Import failed' }, { status: 500 })
  }
}


