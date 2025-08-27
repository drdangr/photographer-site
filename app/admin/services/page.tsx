import { supabaseAdmin } from '@/lib/supabaseServer'
import { redirect } from 'next/navigation'
import { getServerSession } from '@/lib/session'
import SaveButton from '@/components/SaveButton'
import { cookies } from 'next/headers'

export default async function AdminServicesPage() {
  const session = await getServerSession()
  if (!session.userId) redirect('/admin/login')
  const locale = (cookies().get('locale')?.value as 'ru' | 'uk' | 'en' | undefined) || 'ru'
  const { data } = await supabaseAdmin
    .from('ServiceOffering')
    .select('id, title, titleUk, titleEn, slug, description, descriptionUk, descriptionEn, price, currency')
    .order('title', { ascending: true })
  const items = data ?? []
  return (
    <div className="space-y-6">
      <form action={saveService} className="grid grid-cols-1 md:grid-cols-5 gap-2 items-end">
        <h2 className="md:col-span-5 text-xl font-semibold">Добавить услугу</h2>
        <input type="hidden" name="_locale" defaultValue={locale} />
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
              <input type="hidden" name="_locale" defaultValue={locale} />
              <input name="title" className="border rounded p-2" defaultValue={locale==='uk'?(s as any).titleUk || s.title: locale==='en'?(s as any).titleEn || s.title: s.title} required />
              <input name="slug" className="border rounded p-2" defaultValue={s.slug} required />
              <input name="description" className="border rounded p-2 md:col-span-2" defaultValue={locale==='uk'?(s as any).descriptionUk || (s.description ?? ''): locale==='en'?(s as any).descriptionEn || (s.description ?? ''): (s.description ?? '')} placeholder="Описание" />
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
  const locale = String(formData.get('_locale') || 'ru') as 'ru' | 'uk' | 'en'
  const title = String(formData.get('title') || '')
  const slug = String(formData.get('slug') || '')
  const description = String(formData.get('description') || '') || null
  const priceRaw = formData.get('price')
  const price = priceRaw ? Number(priceRaw) : null
  const currency = String(formData.get('currency') || '') || null
  if (!title || !slug) return
  const existing = await supabaseAdmin.from('ServiceOffering').select('id').eq('slug', slug).maybeSingle()
  if (existing.data) {
    const patch: any = { price, currency }
    if (locale === 'uk') { patch.titleUk = title; patch.descriptionUk = description }
    else if (locale === 'en') { patch.titleEn = title; patch.descriptionEn = description }
    else { patch.title = title; patch.description = description }
    await supabaseAdmin.from('ServiceOffering').update(patch).eq('id', existing.data.id).limit(1)
  } else {
    const base: any = { slug, price, currency }
    if (locale === 'uk') { base.titleUk = title; base.descriptionUk = description }
    else if (locale === 'en') { base.titleEn = title; base.descriptionEn = description }
    else { base.title = title; base.description = description }
    await supabaseAdmin.from('ServiceOffering').insert(base)
  }
}

async function updateService(formData: FormData) {
  'use server'
  const id = Number(formData.get('id'))
  const locale = String(formData.get('_locale') || 'ru') as 'ru' | 'uk' | 'en'
  const title = String(formData.get('title') || '')
  const slug = String(formData.get('slug') || '')
  const description = String(formData.get('description') || '') || null
  const priceRaw = formData.get('price')
  const price = priceRaw !== null && priceRaw !== '' ? Number(priceRaw) : null
  const currency = String(formData.get('currency') || '') || null
  if (!id || !title || !slug) return
  const patch: any = { slug, price, currency }
  if (locale === 'uk') { patch.titleUk = title; patch.descriptionUk = description }
  else if (locale === 'en') { patch.titleEn = title; patch.descriptionEn = description }
  else { patch.title = title; patch.description = description }
  await supabaseAdmin.from('ServiceOffering').update(patch).eq('id', id).limit(1)
}

async function deleteService(formData: FormData) {
  'use server'
  const id = Number(formData.get('id'))
  if (!id) return
  await supabaseAdmin.from('ServiceOffering').delete().eq('id', id).limit(1)
}


