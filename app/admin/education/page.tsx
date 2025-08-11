import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { getServerSession } from '@/lib/session'

export default async function AdminEducationPage() {
  const session = await getServerSession()
  if (!session.userId) redirect('/admin/login')

  const items = await prisma.educationOffering.findMany({ orderBy: { kind: 'asc' } })
  return (
    <div className="space-y-6">
      <form action={saveEducation} className="grid grid-cols-1 md:grid-cols-6 gap-2 items-end">
        <h2 className="md:col-span-6 text-xl font-semibold">Добавить обучение</h2>
        <select name="kind" className="border rounded p-2">
          <option value="WORKSHOP">WORKSHOP</option>
          <option value="COURSE">COURSE</option>
          <option value="ACADEMIC">ACADEMIC</option>
        </select>
        <input name="title" className="border rounded p-2" placeholder="Название" required />
        <input name="slug" className="border rounded p-2" placeholder="slug" required />
        <input name="description" className="border rounded p-2" placeholder="Описание" />
        <input name="duration" className="border rounded p-2" placeholder="Длительность" />
        <div className="flex gap-2">
          <input name="price" type="number" className="border rounded p-2 w-28" placeholder="Цена" />
          <input name="currency" className="border rounded p-2 w-24" placeholder="RUB" defaultValue="RUB" />
        </div>
        <button className="bg-slate-900 text-white px-4 py-2 rounded">Добавить</button>
      </form>

      <ul className="divide-y">
        {items.map((o) => (
          <li key={o.id} className="py-3">
            <form action={updateEducation} className="grid grid-cols-1 md:grid-cols-7 gap-2 items-end">
              <input type="hidden" name="id" defaultValue={o.id} />
              <select name="kind" className="border rounded p-2" defaultValue={o.kind}>
                <option value="WORKSHOP">WORKSHOP</option>
                <option value="COURSE">COURSE</option>
                <option value="ACADEMIC">ACADEMIC</option>
              </select>
              <input name="title" className="border rounded p-2" defaultValue={o.title} required />
              <input name="slug" className="border rounded p-2" defaultValue={o.slug} required />
              <input name="description" className="border rounded p-2" defaultValue={o.description ?? ''} placeholder="Описание" />
              <input name="duration" className="border rounded p-2" defaultValue={o.duration ?? ''} placeholder="Длительность" />
              <div className="flex gap-2">
                <input name="price" type="number" className="border rounded p-2 w-28" defaultValue={typeof o.price === 'number' ? o.price : ''} placeholder="Цена" />
                <input name="currency" className="border rounded p-2 w-24" defaultValue={o.currency ?? 'RUB'} placeholder="RUB" />
              </div>
              <div>
                <button className="bg-slate-900 text-white px-4 py-2 rounded">Сохранить</button>
              </div>
            </form>
            <div className="mt-2">
              <form action={deleteEducation}>
                <input type="hidden" name="id" defaultValue={o.id} />
                <button className="text-red-600">Удалить</button>
              </form>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

async function saveEducation(formData: FormData) {
  'use server'
  const kind = String(formData.get('kind') || 'WORKSHOP') as 'WORKSHOP' | 'COURSE' | 'ACADEMIC'
  const title = String(formData.get('title') || '')
  const slug = String(formData.get('slug') || '')
  const description = String(formData.get('description') || '') || null
  const duration = String(formData.get('duration') || '') || null
  const priceRaw = formData.get('price')
  const price = priceRaw ? Number(priceRaw) : null
  const currency = String(formData.get('currency') || '') || null
  if (!title || !slug) return
  await prisma.educationOffering.upsert({
    where: { slug },
    update: { kind, title, description, duration, price, currency },
    create: { kind, title, slug, description, duration, price, currency },
  })
}

async function updateEducation(formData: FormData) {
  'use server'
  const id = Number(formData.get('id'))
  const kind = String(formData.get('kind') || 'WORKSHOP') as 'WORKSHOP' | 'COURSE' | 'ACADEMIC'
  const title = String(formData.get('title') || '')
  const slug = String(formData.get('slug') || '')
  const description = String(formData.get('description') || '') || null
  const duration = String(formData.get('duration') || '') || null
  const priceRaw = formData.get('price')
  const price = priceRaw !== null && priceRaw !== '' ? Number(priceRaw) : null
  const currency = String(formData.get('currency') || '') || null
  if (!id || !title || !slug) return
  await prisma.educationOffering.update({ where: { id }, data: { kind, title, slug, description, duration, price, currency } })
}

async function deleteEducation(formData: FormData) {
  'use server'
  const id = Number(formData.get('id'))
  if (!id) return
  await prisma.educationOffering.delete({ where: { id } })
}


