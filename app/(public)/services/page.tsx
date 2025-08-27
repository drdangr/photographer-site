import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const runtime = 'nodejs'

export default async function ServicesPage() {
  const locale = (await import('next/headers')).cookies().get('locale')?.value as 'ru' | 'uk' | 'en' | undefined
  const { data } = await supabase
    .from('ServiceOffering')
    .select('id, title, titleUk, titleEn, description, descriptionUk, descriptionEn, price, currency')
    .order('title', { ascending: true })
  const services = data ?? []
  return (
    <section>
      <h1 className="text-2xl font-semibold mb-4">{locale==='uk'?'Професійні послуги': locale==='en'?'Professional services':'Профессиональные услуги'}</h1>
      <ul className="space-y-3">
        {services.map((s) => (
          <li key={s.id} className="border rounded p-4">
            <div className="font-medium">{locale==='uk'?(s as any).titleUk || s.title: locale==='en'?(s as any).titleEn || s.title: s.title}</div>
            {((locale==='uk'?(s as any).descriptionUk: locale==='en'?(s as any).descriptionEn: s.description) || '') && (
              <div className="text-sm text-slate-600 mt-1">{locale==='uk'?(s as any).descriptionUk || s.description: locale==='en'?(s as any).descriptionEn || s.description: s.description}</div>
            )}
            <div className="mt-2 text-slate-800">
              {typeof s.price === 'number' ? `${s.price} ${s.currency ?? ''}` : 'Цена по запросу'}
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}


