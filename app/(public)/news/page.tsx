import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function NewsPage() {
  const { data } = await supabase
    .from('NewsItem')
    .select('*')
    .order('date', { ascending: false })
    .order('id', { ascending: false })
  const items = data ?? []
  return (
    <section className="prose max-w-none">
      <h1>Новости</h1>
      {items.map((n) => (
        <article key={n.id} className="mb-8">
          <h2 className="!mb-1">{n.title}</h2>
          <div className="text-sm text-slate-500 !mt-0">
            {new Date(n.date as any).toLocaleString('ru-RU')}
          </div>
          <div className="mt-2" dangerouslySetInnerHTML={{ __html: (n.bodyMd as any) || '' }} />
        </article>
      ))}
    </section>
  )
}


