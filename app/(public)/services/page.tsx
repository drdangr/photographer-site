import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const runtime = 'nodejs'

export default async function ServicesPage() {
  const { data } = await supabase
    .from('ServiceOffering')
    .select('*')
    .order('title', { ascending: true })
  const services = data ?? []
  return (
    <section>
      <h1 className="text-2xl font-semibold mb-4">Профессиональные услуги</h1>
      <ul className="space-y-3">
        {services.map((s) => (
          <li key={s.id} className="border rounded p-4">
            <div className="font-medium">{s.title}</div>
            {s.description && <div className="text-sm text-slate-600 mt-1">{s.description}</div>}
            <div className="mt-2 text-slate-800">
              {typeof s.price === 'number' ? `${s.price} ${s.currency ?? ''}` : 'Цена по запросу'}
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}


