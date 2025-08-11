import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const runtime = 'nodejs'

export default async function EducationPage() {
  const { data: offerings } = await supabase.from('EducationOffering').select('*').order('kind', { ascending: true })
  return (
    <section>
      <h1 className="text-2xl font-semibold mb-4">Обучение</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {offerings.map((o) => (
          <div key={o.id} className="border rounded p-4">
            <div className="text-sm uppercase text-slate-500">{o.kind}</div>
            <div className="font-medium">{o.title}</div>
            {o.description && <div className="text-sm text-slate-600 mt-1">{o.description}</div>}
            <div className="mt-2 text-slate-800">
              {typeof o.price === 'number' ? `${o.price} ${o.currency ?? ''}` : 'Стоимость по запросу'}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}


