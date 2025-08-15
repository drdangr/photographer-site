import { redirect } from 'next/navigation'
import { getServerSession } from '@/lib/session'
import { supabaseAdmin } from '@/lib/supabaseServer'
import RichEditor from '@/components/RichEditor'
import SaveButton from '@/components/SaveButton'
import { normalizeSlug } from '@/lib/slug'
import CoverImageInput from '@/components/CoverImageInput'

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
    <form action={save} className="space-y-4 max-w-3xl">
      <h1 className="text-xl font-semibold">Редактирование</h1>
      <input type="hidden" name="id" defaultValue={lecture.id} />
      <div>
        <label className="block text-sm mb-1">Заголовок</label>
        <input name="title" className="border rounded p-2 w-full" defaultValue={lecture.title} required />
      </div>
      <div>
        <label className="block text-sm mb-1">Slug</label>
        <input name="slug" className="border rounded p-2 w-full" defaultValue={lecture.slug} required />
      </div>
      <div>
        <label className="block text-sm mb-1">Раздел</label>
        <select name="sectionId" className="border rounded p-2 w-full" defaultValue={(lecture as any).sectionId ?? ''}>
          <option value="">— Без раздела —</option>
          {(sections || []).map((s: any) => (
            <option key={s.id} value={s.id}>{s.title}</option>
          ))}
        </select>
      </div>
      <CoverImageInput name="coverUrl" label="Обложка (URL или загрузка файла)" defaultValue={lecture.coverUrl ?? ''} />
      <div>
        <label className="block text-sm mb-1">Содержимое</label>
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
  if (!id || !title || !slug) return
  await supabaseAdmin
    .from('Lecture')
    .update({ title, slug: normalizeSlug(slug), coverUrl, contentHtml, sectionId })
    .eq('id', id)
    .limit(1)
  redirect('/admin/lectures')
}

async function remove(formData: FormData) {
  'use server'
  const id = Number(formData.get('id'))
  if (!id) return
  await supabaseAdmin.from('Lecture').delete().eq('id', id).limit(1)
  redirect('/admin/lectures')
}


