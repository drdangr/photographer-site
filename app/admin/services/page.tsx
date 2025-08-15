import { supabaseAdmin } from '@/lib/supabaseServer'
import { redirect } from 'next/navigation'
import { getServerSession } from '@/lib/session'
import SaveButton from '@/components/SaveButton'

export default async function AdminServicesPage() {
  const session = await getServerSession()
  if (!session.userId) redirect('/admin/login')

  const { data } = await supabaseAdmin.from('ServiceOffering').select('*').order('title', { ascending: true })
  const items = data ?? []
  return (
    <div className="space-y-6">
      <form action={saveService} className="grid grid-cols-1 md:grid-cols-5 gap-2 items-end">
        <h2 className="md:col-span-5 text-xl font-semibold">Добавить услугу</h2>
        <input name="title" className="border rounded p-2" placeholder="Название" required />
        <input name="slug" className="border rounded p-2" placeholder="slug" required />
        <input name="description" className="border rounded p-2" placeholder="Описание" />
        <input name="price" type="number" className="border rounded p-2" placeholder="Цена" />
        <input name="currency" className="border rounded p-2" placeholder="Валюта (RUB)" defaultValue="RUB" />
        <SaveButton>Добавить</SaveButton>
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
                <SaveButton />
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
  const existing = await supabaseAdmin.from('ServiceOffering').select('id').eq('slug', slug).maybeSingle()
  if (existing.data) {
    await supabaseAdmin.from('ServiceOffering').update({ title, description, price, currency }).eq('id', existing.data.id).limit(1)
  } else {
    await supabaseAdmin.from('ServiceOffering').insert({ title, slug, description, price, currency })
  }
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
  await supabaseAdmin.from('ServiceOffering').update({ title, slug, description, price, currency }).eq('id', id).limit(1)
}

async function deleteService(formData: FormData) {
  'use server'
  const id = Number(formData.get('id'))
  if (!id) return
  await supabaseAdmin.from('ServiceOffering').delete().eq('id', id).limit(1)
}


