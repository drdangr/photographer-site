import { redirect } from 'next/navigation'
import { getServerSession } from '@/lib/session'
import { supabaseAdmin } from '@/lib/supabaseServer'
import RichEditor from '@/components/RichEditor'
import SaveButton from '@/components/SaveButton'
import { normalizeSlug } from '@/lib/slug'
import CoverImageInput from '@/components/CoverImageInput'
import EpubImport from '@/components/EpubImport'

type Props = { params: { id: string } }

export default async function EditLecturePage({ params }: Props) {
  const session = await getServerSession()
  if (!session.userId) redirect('/admin/login')
  const id = Number(params.id)
  const { data: lecture } = await supabaseAdmin.from('Lecture').select('*').eq('id', id).maybeSingle()
  const { data: sections } = await supabaseAdmin
    .from('LectureSection')
    .select('*')
    .order('displayOrder', { ascending: true })
    .order('title', { ascending: true })
  if (!lecture) redirect('/admin/lectures')
  return (
    <form action={save} className="space-y-4 max-w-4xl">
      <h1 className="text-xl font-semibold">Редактирование</h1>
      <input type="hidden" name="id" defaultValue={lecture.id} />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        <div className="md:col-span-2">
          <label className="block text-sm mb-1">Заголовок</label>
          <input name="title" className="border rounded p-2 w-full" defaultValue={lecture.title} required />
        </div>
        <div className="md:col-span-1">
          <label className="block text-sm mb-1">Slug</label>
          <input name="slug" className="border rounded p-2 w-full" defaultValue={lecture.slug} required />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm mb-1">Раздел</label>
          <select name="sectionId" className="border rounded p-2 w-full" defaultValue={(lecture as any).sectionId ?? ''}>
            <option value="">— Без раздела —</option>
            {(sections || []).map((s: any) => (
              <option key={s.id} value={s.id}>{s.title}</option>
            ))}
          </select>
        </div>
        <div className="md:col-span-1">
          <div className="flex items-center gap-2 pt-6 md:pt-0">
            <input id="lecture-public" type="checkbox" name="public" defaultChecked={(lecture as any).public ?? true} />
            <label htmlFor="lecture-public" className="text-sm">Публичная</label>
          </div>
        </div>
      </div>
      {/* lectures/YYYY/MM/DD/<slug>/covers */}
      <script dangerouslySetInnerHTML={{ __html: `window.__uploadCoverPrefix=()=>{const slug=document.querySelector('input[name=\\"slug\\"]')?.value?.trim()||'no-slug';const d=new Date();const y=d.getFullYear(),m=(''+(d.getMonth()+1)).padStart(2,'0'),day=(''+d.getDate()).padStart(2,'0');return 'lectures/'+y+'/'+m+'/'+day+'/'+slug+'/covers'}` }} />
      <CoverImageInput name="coverUrl" label="Обложка (URL или загрузка файла)" defaultValue={lecture.coverUrl ?? ''} />
      <div>
        <label className="block text-sm mb-1">Содержимое</label>
        {/* lectures/YYYY/MM/DD/<slug>/pictures */}
        <script dangerouslySetInnerHTML={{ __html: `window.__uploadPrefix=()=>{const slug=document.querySelector('input[name=\"slug\"]')?.value?.trim()||'no-slug';const d=new Date();const y=d.getFullYear(),m=(''+(d.getMonth()+1)).padStart(2,'0'),day=(''+d.getDate()).padStart(2,'0');return 'lectures/'+y+'/'+m+'/'+day+'/'+slug+'/pictures'}` }} />
        {/* Кнопка импорта EPUB (клиентский компонент, не вкладываем <form> внутрь <form>) */}
        <EpubImport lectureId={Number(lecture.id)} slug={String(lecture.slug)} />
        <RichEditor name="contentHtml" defaultHtml={lecture.contentHtml ?? ''} />
      </div>
      <div className="flex gap-3">
        <SaveButton />
        <button formAction={remove} className="text-red-600 border border-red-600 px-4 py-2 rounded">Удалить</button>
      </div>
    </form>
  )
}

async function save(formData: FormData) {
  'use server'
  const id = Number(formData.get('id'))
  const title = String(formData.get('title') || '')
  const slug = String(formData.get('slug') || '')
  const coverUrl = String(formData.get('coverUrl') || '') || null
  const contentHtml = String(formData.get('contentHtml') || '') || null
  const sectionIdRaw = formData.get('sectionId')
  const sectionId = sectionIdRaw ? Number(sectionIdRaw) : null
  const publicRaw = formData.get('public')
  const isPublic = publicRaw ? true : false
  if (!id || !title || !slug) return
  // До обновления получаем прежний HTML, чтобы найти удалённые ссылки
  const { data: beforeRow } = await supabaseAdmin.from('Lecture').select('contentHtml, coverUrl').eq('id', id).maybeSingle()
  await supabaseAdmin
    .from('Lecture')
    .update({ title, slug: normalizeSlug(slug), coverUrl, contentHtml, sectionId, public: isPublic })
    .eq('id', id)
    .limit(1)
  // Безопасно чистим файлы, удалённые из HTML/сменённую обложку, если они больше нигде не используются
  try {
    const extract = (html: string | null): Set<string> => {
      const set = new Set<string>()
      if (!html) return set
      const re = /src\s*=\s*["']([^"']+)["']/gi
      let m: RegExpExecArray | null
      while ((m = re.exec(html))) set.add(m[1])
      return set
    }
    const before = extract((beforeRow as any)?.contentHtml || '')
    const after = extract(contentHtml)
    const removed = Array.from(before).filter((u) => !after.has(u))
    if (removed.length > 0 || ((beforeRow as any)?.coverUrl && (beforeRow as any)?.coverUrl !== coverUrl)) {
      const supabaseUrl = process.env.SUPABASE_URL as string
      const key = process.env.SUPABASE_SERVICE_ROLE_KEY as string
      const { createClient } = await import('@supabase/supabase-js')
      const sb = createClient(supabaseUrl, key)
      const bucketEnv = process.env.SUPABASE_BUCKET || 'public-images'
      const parse = (url: string) => {
        const mark = '/storage/v1/object/public/'
        const i = url.indexOf(mark)
        if (i === -1) return null as null | { bucket: string; path: string }
        const tail = url.substring(i + mark.length)
        const [b, ...rest] = tail.split('/')
        return { bucket: b, path: rest.join('/') }
      }
      const stillUsed = async (url: string) => {
        const exists = async (builder: any): Promise<boolean> => {
          const { data } = await builder
          return !!data
        }
        const checks = await Promise.all([
          exists(supabaseAdmin.from('Lecture').select('id').neq('id', id).like('contentHtml', `%${url}%`).limit(1).maybeSingle()),
          exists(supabaseAdmin.from('Lecture').select('id').eq('coverUrl', url).limit(1).maybeSingle()),
          exists(supabaseAdmin.from('NewsItem').select('id').like('bodyMd', `%${url}%`).limit(1).maybeSingle()),
          exists(supabaseAdmin.from('Gallery').select('id').eq('coverUrl', url).limit(1).maybeSingle()),
          exists(supabaseAdmin.from('Photo').select('id').eq('url', url).limit(1).maybeSingle()),
          exists(supabaseAdmin.from('ClientPhoto').select('id').eq('url', url).limit(1).maybeSingle()),
          exists(supabaseAdmin.from('ClientAuthorPhoto').select('id').eq('url', url).limit(1).maybeSingle()),
          exists(supabaseAdmin.from('AuthorProfile').select('id').eq('avatarUrl', url).limit(1).maybeSingle()),
          exists(supabaseAdmin.from('AuthorProfile').select('id').like('bioMarkdown', `%${url}%`).limit(1).maybeSingle()),
        ])
        return checks.some(Boolean)
      }
      const toProcess = new Set<string>(removed)
      const prevCover: string | null = ((beforeRow as any)?.coverUrl as string) || null
      if (prevCover && prevCover !== coverUrl) toProcess.add(prevCover)
      for (const url of toProcess) {
        const used = await stillUsed(url)
        if (used) continue
        const bp = parse(url)
        if (bp && bp.bucket === bucketEnv) {
          try { await sb.storage.from(bp.bucket).remove([bp.path]) } catch {}
          await supabaseAdmin.from('MediaAsset').delete().eq('publicUrl', url)
        }
      }
    }
  } catch {}
  redirect('/admin/lectures')
}

async function remove(formData: FormData) {
  'use server'
  const id = Number(formData.get('id'))
  if (!id) return
  // Сначала выгружаем HTML и обложку, чтобы удалить файлы из Storage (если они больше нигде не используются)
  const { data: row } = await supabaseAdmin.from('Lecture').select('contentHtml, coverUrl').eq('id', id).maybeSingle()
  try {
    const supabaseUrl = process.env.SUPABASE_URL as string
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY as string
    const { createClient } = await import('@supabase/supabase-js')
    const sb = createClient(supabaseUrl, key)
    const bucketEnv = process.env.SUPABASE_BUCKET || 'public-images'
    const parse = (url: string) => {
      const mark = '/storage/v1/object/public/'
      const i = url.indexOf(mark)
      if (i === -1) return null as null | { bucket: string; path: string }
      const tail = url.substring(i + mark.length)
      const [b, ...rest] = tail.split('/')
      return { bucket: b, path: rest.join('/') }
    }
    const extract = (html: string | null): string[] => {
      const arr: string[] = []
      if (!html) return arr
      const re = /src\s*=\s*["']([^"']+)["']/gi
      let m: RegExpExecArray | null
      while ((m = re.exec(html))) arr.push(m[1])
      return arr
    }
    const stillUsed = async (url: string) => {
      const exists = async (builder: any): Promise<boolean> => {
        const { data } = await builder
        return !!data
      }
      const checks = await Promise.all([
        exists(supabaseAdmin.from('Lecture').select('id').neq('id', id).like('contentHtml', `%${url}%`).limit(1).maybeSingle()),
        exists(supabaseAdmin.from('Lecture').select('id').eq('coverUrl', url).limit(1).maybeSingle()),
        exists(supabaseAdmin.from('NewsItem').select('id').like('bodyMd', `%${url}%`).limit(1).maybeSingle()),
        exists(supabaseAdmin.from('Gallery').select('id').eq('coverUrl', url).limit(1).maybeSingle()),
        exists(supabaseAdmin.from('Photo').select('id').eq('url', url).limit(1).maybeSingle()),
        exists(supabaseAdmin.from('ClientPhoto').select('id').eq('url', url).limit(1).maybeSingle()),
        exists(supabaseAdmin.from('ClientAuthorPhoto').select('id').eq('url', url).limit(1).maybeSingle()),
        exists(supabaseAdmin.from('AuthorProfile').select('id').eq('avatarUrl', url).limit(1).maybeSingle()),
        exists(supabaseAdmin.from('AuthorProfile').select('id').like('bioMarkdown', `%${url}%`).limit(1).maybeSingle()),
      ])
      return checks.some(Boolean)
    }
    const urls = new Set<string>(extract((row as any)?.contentHtml || ''))
    const cov: string | null = ((row as any)?.coverUrl as string) || null
    if (cov) urls.add(cov)
    for (const url of urls) {
      const used = await stillUsed(url)
      if (used) continue
      const bp = parse(url)
      if (bp && bp.bucket === bucketEnv) {
        try { await sb.storage.from(bp.bucket).remove([bp.path]) } catch {}
        await supabaseAdmin.from('MediaAsset').delete().eq('publicUrl', url)
      }
    }
  } catch {}
  await supabaseAdmin.from('Lecture').delete().eq('id', id).limit(1)
  redirect('/admin/lectures')
}


