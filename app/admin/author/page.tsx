import { supabaseAdmin } from '@/lib/supabaseServer'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { getServerSession } from '@/lib/session'
import ImageInput from '@/components/ImageInput'
import RichEditor from '@/components/RichEditor'
import SaveButton from '@/components/SaveButton'

export default async function AdminAuthorPage() {
  const session = await getServerSession()
  if (!session.userId) redirect('/admin/login')

  const { data: author } = await supabaseAdmin
    .from('AuthorProfile')
    .select('*')
    .order('id', { ascending: true })
    .limit(1)
    .maybeSingle()
  const contactsParsed = (() => {
    try {
      return JSON.parse((author?.contacts as string) || '{}') as Record<string, string>
    } catch {
      return {} as Record<string, string>
    }
  })()

  return (
    <form action={saveAuthor} className="max-w-2xl space-y-4">
      <h2 className="text-xl font-semibold">Профиль автора</h2>
      <input type="hidden" name="id" defaultValue={author?.id} />
      <div>
        <label className="block text-sm mb-1">Полное имя</label>
        <input name="fullName" className="border rounded w-full p-2" defaultValue={author?.fullName ?? ''} required />
      </div>
      <ImageInput name="avatarUrl" label="Аватар (URL или загрузка)" defaultValue={author?.avatarUrl ?? ''} />
      <div>
        <label className="block text-sm mb-1">Био</label>
        <RichEditor name="bioMarkdown" defaultHtml={author?.bioMarkdown ?? ''} />
      </div>
      <div>
        <label className="block text-sm mb-1">Контакты (JSON)</label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-slate-600 mb-1">Email</label>
            <input name="email" type="email" className="border rounded w-full p-2" defaultValue={contactsParsed.email ?? ''} placeholder="contact@example.com" />
          </div>
          <div>
            <label className="block text-xs text-slate-600 mb-1">Телефон</label>
            <input name="phone" className="border rounded w-full p-2" defaultValue={contactsParsed.phone ?? ''} placeholder="+7 999 123-45-67" />
          </div>
          <div>
            <label className="block text-xs text-slate-600 mb-1">Instagram</label>
            <input name="instagram" className="border rounded w-full p-2" defaultValue={contactsParsed.instagram ?? ''} placeholder="https://instagram.com/yourprofile" />
          </div>
          <div>
            <label className="block text-xs text-slate-600 mb-1">Facebook</label>
            <input name="facebook" className="border rounded w-full p-2" defaultValue={contactsParsed.facebook ?? ''} placeholder="https://facebook.com/yourprofile" />
          </div>
        </div>
      </div>
      <SaveButton />
    </form>
  )
}

async function saveAuthor(formData: FormData) {
  'use server'
  const id = Number(formData.get('id') || 0)
  const fullName = String(formData.get('fullName') || '')
  const avatarUrl = String(formData.get('avatarUrl') || '') || null
  const bioMarkdown = String(formData.get('bioMarkdown') || '') || null
  // Сборка контактов из отдельных полей в JSON
  const email = String(formData.get('email') || '').trim()
  const phone = String(formData.get('phone') || '').trim()
  const instagram = String(formData.get('instagram') || '').trim()
  const facebook = String(formData.get('facebook') || '').trim()
  const contactsObj: Record<string, string> = {}
  if (email) contactsObj.email = email
  if (phone) contactsObj.phone = phone
  if (instagram) contactsObj.instagram = instagram
  if (facebook) contactsObj.facebook = facebook
  const contacts = Object.keys(contactsObj).length > 0 ? JSON.stringify(contactsObj) : null

  if (!fullName) return
  // contacts уже корректный JSON, валидация выше не требуется

  // Жёстко обеспечиваем единственную запись в таблице
  // 1) Определяем целевой id: присланный из формы или первый по возрастанию
  let targetId: number | null = Number.isFinite(id) && id > 0 ? id : null
  if (!targetId) {
    const { data: first } = await supabaseAdmin
      .from('AuthorProfile')
      .select('id')
      .order('id', { ascending: true })
      .limit(1)
      .maybeSingle()
    targetId = (first?.id as number) || null
  }

  if (targetId) {
    await supabaseAdmin
      .from('AuthorProfile')
      .update({ fullName, avatarUrl, bioMarkdown, contacts })
      .eq('id', targetId)
      .limit(1)
    // 2) Удаляем все прочие записи, чтобы не хранить историю
    await supabaseAdmin.from('AuthorProfile').delete().neq('id', targetId)
  } else {
    const { data: created } = await supabaseAdmin
      .from('AuthorProfile')
      .insert({ fullName, avatarUrl, bioMarkdown, contacts })
      .select('id')
      .maybeSingle()
    const newId = (created?.id as number) || null
    if (newId) {
      await supabaseAdmin.from('AuthorProfile').delete().neq('id', newId)
    }
  }

  revalidatePath('/')
  revalidatePath('/about')
  revalidatePath('/admin/author')
}


