import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const runtime = 'nodejs'

export default async function EducationPage() {
  const locale = (await import('next/headers')).cookies().get('locale')?.value as 'ru' | 'uk' | 'en' | undefined
  const { data } = await supabase
    .from('EducationOffering')
    .select('id, kind, title, titleUk, titleEn, description, descriptionUk, descriptionEn, duration, durationUk, durationEn, price, currency')
    .order('kind', { ascending: true })
  const offerings = data ?? []
  return (
    <section>
      <h1 className="text-2xl font-semibold mb-4">{locale==='uk'?'Навчання': locale==='en'?'Education':'Обучение'}</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {offerings.map((o) => (
          <div key={o.id} className="border rounded p-4">
            <div className="text-sm uppercase text-slate-500">{o.kind}</div>
            <div className="font-medium">{locale==='uk'?(o as any).titleUk || o.title: locale==='en'?(o as any).titleEn || o.title: o.title}</div>
            {((locale==='uk'?(o as any).descriptionUk: locale==='en'?(o as any).descriptionEn: o.description) || '') && (
              <div className="text-sm text-slate-600 mt-1">{locale==='uk'?(o as any).descriptionUk || o.description: locale==='en'?(o as any).descriptionEn || o.description: o.description}</div>
            )}
            <div className="mt-2 text-slate-800">
              {typeof o.price === 'number' ? `${o.price} ${o.currency ?? ''}` : 'Стоимость по запросу'}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}


