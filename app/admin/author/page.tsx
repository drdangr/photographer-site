import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { getServerSession } from '@/lib/session'
import ImageInput from '@/components/ImageInput'

export default async function AdminAuthorPage() {
  const session = await getServerSession()
  if (!session.userId) redirect('/admin/login')

  const author = await prisma.authorProfile.findFirst()

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
        <label className="block text-sm mb-1">Био (Markdown)</label>
        <textarea name="bioMarkdown" className="border rounded w-full p-2 h-40" defaultValue={author?.bioMarkdown ?? ''} />
      </div>
      <div>
        <label className="block text-sm mb-1">Контакты (JSON)</label>
        <textarea name="contacts" className="border rounded w-full p-2" defaultValue={author?.contacts ?? ''} />
      </div>
      <button className="bg-slate-900 text-white px-4 py-2 rounded">Сохранить</button>
    </form>
  )
}

async function saveAuthor(formData: FormData) {
  'use server'
  const id = Number(formData.get('id') || 0)
  const fullName = String(formData.get('fullName') || '')
  const avatarUrl = String(formData.get('avatarUrl') || '') || null
  const bioMarkdown = String(formData.get('bioMarkdown') || '') || null
  const contacts = String(formData.get('contacts') || '') || null

  if (!fullName) return
  if (contacts) {
    try { JSON.parse(contacts) } catch { throw new Error('Неверный JSON контактов') }
  }

  if (id) {
    await prisma.authorProfile.update({
      where: { id },
      data: { fullName, avatarUrl, bioMarkdown, contacts }
    })
  } else {
    await prisma.authorProfile.create({ data: { fullName, avatarUrl, bioMarkdown, contacts } })
  }
}


