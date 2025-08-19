import { redirect } from 'next/navigation'
import { getServerSession } from '@/lib/session'
import { supabaseAdmin } from '@/lib/supabaseServer'
import RichEditor from '@/components/RichEditor'
import SaveButton from '@/components/SaveButton'
import { normalizeSlug } from '@/lib/slug'
import CoverImageInput from '@/components/CoverImageInput'
import EpubImport from '@/components/EpubImport'

export default async function NewLecturePage() {
  const session = await getServerSession()
  if (!session.userId) redirect('/admin/login')
  const { data: sections } = await supabaseAdmin
    .from('LectureSection')
    .select('*')
    .order('displayOrder', { ascending: true })
    .order('title', { ascending: true })
  return (
    <form action={save} className="space-y-4 max-w-3xl">
      <h1 className="text-xl font-semibold">Новая лекция / статья</h1>
      <div>
        <label className="block text-sm mb-1">Заголовок</label>
        <input name="title" className="border rounded p-2 w-full" required />
      </div>
      <div>
        <label className="block text-sm mb-1">Slug</label>
        <input name="slug" className="border rounded p-2 w-full" placeholder="kak-snimat-portrety" required />
      </div>
      <div>
        <label className="block text-sm mb-1">Раздел</label>
        <select name="sectionId" className="border rounded p-2 w-full">
          <option value="">— Без раздела —</option>
          {(sections || []).map((s: any) => (
            <option key={s.id} value={s.id}>{s.title}</option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-2">
        <label className="block text-sm">Публичная</label>
        <input type="checkbox" name="public" defaultChecked={true} />
      </div>
      {/* lectures/YYYY/MM/DD/<slug>/covers */}
      <script dangerouslySetInnerHTML={{ __html: `window.__uploadCoverPrefix=()=>{const slug=document.querySelector('input[name=\"slug\"]')?.value?.trim()||'no-slug';const d=new Date();const y=d.getFullYear(),m=(''+(d.getMonth()+1)).padStart(2,'0'),day=(''+d.getDate()).padStart(2,'0');return 'lectures/'+y+'/'+m+'/'+day+'/'+slug+'/covers'}` }} />
      <CoverImageInput name="coverUrl" label="Обложка (URL или загрузка файла)" />
      <div>
        <label className="block text-sm mb-1">Содержимое</label>
        {/* lectures/YYYY/MM/DD/<slug>/pictures */}
        <script dangerouslySetInnerHTML={{ __html: `window.__uploadPrefix=()=>{const slug=document.querySelector('input[name=\"slug\"]')?.value?.trim()||'no-slug';const d=new Date();const y=d.getFullYear(),m=(''+(d.getMonth()+1)).padStart(2,'0'),day=(''+d.getDate()).padStart(2,'0');return 'lectures/'+y+'/'+m+'/'+day+'/'+slug+'/pictures'}` }} />
        <EpubImport lectureId={0 as any} slug={'' as any} />
        <RichEditor name="contentHtml" />
      </div>
      <SaveButton />
    </form>
  )
}

async function save(formData: FormData) {
  'use server'
  const title = String(formData.get('title') || '')
  const slug = String(formData.get('slug') || '')
  const coverUrl = String(formData.get('coverUrl') || '') || null
  const contentHtml = String(formData.get('contentHtml') || '') || null
  const sectionIdRaw = formData.get('sectionId')
  const sectionId = sectionIdRaw ? Number(sectionIdRaw) : null
  const publicRaw = formData.get('public')
  const isPublic = publicRaw ? true : false
  if (!title || !slug) return
  const safeSlug = normalizeSlug(slug)
  let displayOrder = 0
  if (sectionId) {
    const { data: maxRow } = await supabaseAdmin
      .from('Lecture')
      .select('displayOrder')
      .eq('sectionId', sectionId)
      .order('displayOrder', { ascending: false })
      .limit(1)
      .maybeSingle()
    displayOrder = ((maxRow?.displayOrder as number) ?? 0) + 1
  }
  await supabaseAdmin.from('Lecture').insert({ title, slug: safeSlug, coverUrl, contentHtml, sectionId, displayOrder, public: isPublic })
  redirect('/admin/lectures')
}


