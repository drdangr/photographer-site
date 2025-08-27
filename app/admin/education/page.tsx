import { supabaseAdmin } from '@/lib/supabaseServer'
import { redirect } from 'next/navigation'
import { getServerSession } from '@/lib/session'
import SaveButton from '@/components/SaveButton'
import { cookies } from 'next/headers'

export default async function AdminEducationPage() {
  const session = await getServerSession()
  if (!session.userId) redirect('/admin/login')
  const locale = (cookies().get('locale')?.value as 'ru' | 'uk' | 'en' | undefined) || 'ru'
  const { data } = await supabaseAdmin
    .from('EducationOffering')
    .select('id, kind, title, titleUk, titleEn, slug, description, descriptionUk, descriptionEn, duration, durationUk, durationEn, price, currency')
    .order('kind', { ascending: true })
  const items = data ?? []
  return (
    <div className="space-y-6">
      <form action={saveEducation} className="grid grid-cols-1 md:grid-cols-6 gap-2 items-end">
        <h2 className="md:col-span-6 text-xl font-semibold">Добавить обучение</h2>
        <input type="hidden" name="_locale" defaultValue={locale} />
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
        <SaveButton>Добавить</SaveButton>
      </form>

      <ul className="divide-y">
        {items.map((o) => (
          <li key={o.id} className="py-3">
            <form action={updateEducation} className="grid grid-cols-1 md:grid-cols-7 gap-2 items-end">
              <input type="hidden" name="id" defaultValue={o.id} />
              <input type="hidden" name="_locale" defaultValue={locale} />
              <select name="kind" className="border rounded p-2" defaultValue={o.kind}>
                <option value="WORKSHOP">WORKSHOP</option>
                <option value="COURSE">COURSE</option>
                <option value="ACADEMIC">ACADEMIC</option>
              </select>
              <input name="title" className="border rounded p-2" defaultValue={locale==='uk'?(o as any).titleUk || o.title: locale==='en'?(o as any).titleEn || o.title: o.title} required />
              <input name="slug" className="border rounded p-2" defaultValue={o.slug} required />
              <input name="description" className="border rounded p-2" defaultValue={locale==='uk'?(o as any).descriptionUk || (o.description ?? ''): locale==='en'?(o as any).descriptionEn || (o.description ?? ''): (o.description ?? '')} placeholder="Описание" />
              <input name="duration" className="border rounded p-2" defaultValue={locale==='uk'?(o as any).durationUk || (o.duration ?? ''): locale==='en'?(o as any).durationEn || (o.duration ?? ''): (o.duration ?? '')} placeholder="Длительность" />
              <div className="flex gap-2">
                <input name="price" type="number" className="border rounded p-2 w-28" defaultValue={typeof o.price === 'number' ? o.price : ''} placeholder="Цена" />
                <input name="currency" className="border rounded p-2 w-24" defaultValue={o.currency ?? 'RUB'} placeholder="RUB" />
              </div>
              <div>
                <SaveButton />
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
  const locale = String(formData.get('_locale') || 'ru') as 'ru' | 'uk' | 'en'
  const kind = String(formData.get('kind') || 'WORKSHOP') as 'WORKSHOP' | 'COURSE' | 'ACADEMIC'
  const title = String(formData.get('title') || '')
  const slug = String(formData.get('slug') || '')
  const description = String(formData.get('description') || '') || null
  const duration = String(formData.get('duration') || '') || null
  const priceRaw = formData.get('price')
  const price = priceRaw ? Number(priceRaw) : null
  const currency = String(formData.get('currency') || '') || null
  if (!title || !slug) return
  const existing = await supabaseAdmin.from('EducationOffering').select('id').eq('slug', slug).maybeSingle()
  if (existing.data) {
    const patch: any = { kind, price, currency }
    if (locale === 'uk') { patch.titleUk = title; patch.descriptionUk = description; patch.durationUk = duration }
    else if (locale === 'en') { patch.titleEn = title; patch.descriptionEn = description; patch.durationEn = duration }
    else { patch.title = title; patch.description = description; patch.duration = duration }
    await supabaseAdmin.from('EducationOffering').update(patch).eq('id', existing.data.id).limit(1)
  } else {
    const base: any = { kind, slug, price, currency }
    if (locale === 'uk') { base.titleUk = title; base.descriptionUk = description; base.durationUk = duration }
    else if (locale === 'en') { base.titleEn = title; base.descriptionEn = description; base.durationEn = duration }
    else { base.title = title; base.description = description; base.duration = duration }
    await supabaseAdmin.from('EducationOffering').insert(base)
  }
}

async function updateEducation(formData: FormData) {
  'use server'
  const id = Number(formData.get('id'))
  const locale = String(formData.get('_locale') || 'ru') as 'ru' | 'uk' | 'en'
  const kind = String(formData.get('kind') || 'WORKSHOP') as 'WORKSHOP' | 'COURSE' | 'ACADEMIC'
  const title = String(formData.get('title') || '')
  const slug = String(formData.get('slug') || '')
  const description = String(formData.get('description') || '') || null
  const duration = String(formData.get('duration') || '') || null
  const priceRaw = formData.get('price')
  const price = priceRaw !== null && priceRaw !== '' ? Number(priceRaw) : null
  const currency = String(formData.get('currency') || '') || null
  if (!id || !title || !slug) return
  const patch: any = { kind, slug, price, currency }
  if (locale === 'uk') { patch.titleUk = title; patch.descriptionUk = description; patch.durationUk = duration }
  else if (locale === 'en') { patch.titleEn = title; patch.descriptionEn = description; patch.durationEn = duration }
  else { patch.title = title; patch.description = description; patch.duration = duration }
  await supabaseAdmin.from('EducationOffering').update(patch).eq('id', id).limit(1)
}

async function deleteEducation(formData: FormData) {
  'use server'
  const id = Number(formData.get('id'))
  if (!id) return
  await supabaseAdmin.from('EducationOffering').delete().eq('id', id).limit(1)
}


