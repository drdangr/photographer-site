import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { getServerSession } from '@/lib/session'

export default async function AdminServicesPage() {
  const session = await getServerSession()
  if (!session.userId) redirect('/admin/login')

  const items = await prisma.serviceOffering.findMany({ orderBy: { title: 'asc' } })
  return (
    <div className="space-y-6">
      <form action={saveService} className="grid grid-cols-1 md:grid-cols-5 gap-2 items-end">
        <h2 className="md:col-span-5 text-xl font-semibold">Добавить услугу</h2>
        <input name="title" className="border rounded p-2" placeholder="Название" required />
        <input name="slug" className="border rounded p-2" placeholder="slug" required />
        <input name="description" className="border rounded p-2" placeholder="Описание" />
        <input name="price" type="number" className="border rounded p-2" placeholder="Цена" />
        <input name="currency" className="border rounded p-2" placeholder="Валюта (RUB)" defaultValue="RUB" />
        <button className="bg-slate-900 text-white px-4 py-2 rounded">Добавить</button>
      </form>

      <ul className="divide-y">
        {items.map((s) => (
          <li key={s.id} className="py-3">
            <form action={updateService} className="grid grid-cols-1 md:grid-cols-6 gap-2 items-end">
              <input type="hidden" name="id" defaultValue={s.id} />
              <input name="title" className="border rounded p-2" defaultValue={s.title} required />
              <input name="slug" className="border rounded p-2" defaultValue={s.slug} required />
              <input name="description" className="border rounded p-2 md:col-span-2" defaultValue={s.description ?? ''} placeholder="Описание" />
              <div className="flex gap-2">
                <input name="price" type="number" className="border rounded p-2 w-28" defaultValue={typeof s.price === 'number' ? s.price : ''} placeholder="Цена" />
                <input name="currency" className="border rounded p-2 w-24" defaultValue={s.currency ?? 'RUB'} placeholder="RUB" />
              </div>
              <div className="flex items-center gap-3">
                <button className="bg-slate-900 text-white px-4 py-2 rounded">Сохранить</button>
              </div>
            </form>
            <div className="mt-2">
              <form action={deleteService}>
                <input type="hidden" name="id" defaultValue={s.id} />
                <button className="text-red-600">Удалить</button>
              </form>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

async function saveService(formData: FormData) {
  'use server'
  const title = String(formData.get('title') || '')
  const slug = String(formData.get('slug') || '')
  const description = String(formData.get('description') || '') || null
  const priceRaw = formData.get('price')
  const price = priceRaw ? Number(priceRaw) : null
  const currency = String(formData.get('currency') || '') || null
  if (!title || !slug) return
  await prisma.serviceOffering.upsert({
    where: { slug },
    update: { title, description, price, currency },
    create: { title, slug, description, price, currency },
  })
}

async function updateService(formData: FormData) {
  'use server'
  const id = Number(formData.get('id'))
  const title = String(formData.get('title') || '')
  const slug = String(formData.get('slug') || '')
  const description = String(formData.get('description') || '') || null
  const priceRaw = formData.get('price')
  const price = priceRaw !== null && priceRaw !== '' ? Number(priceRaw) : null
  const currency = String(formData.get('currency') || '') || null
  if (!id || !title || !slug) return
  await prisma.serviceOffering.update({ where: { id }, data: { title, slug, description, price, currency } })
}

async function deleteService(formData: FormData) {
  'use server'
  const id = Number(formData.get('id'))
  if (!id) return
  await prisma.serviceOffering.delete({ where: { id } })
}


