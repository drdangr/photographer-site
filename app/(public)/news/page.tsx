import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function NewsPage() {
  const locale = (await import('next/headers')).cookies().get('locale')?.value as 'ru' | 'uk' | 'en' | undefined
  const { data } = await supabase
    .from('NewsItem')
    .select('id, title, titleUk, titleEn, date, bodyMd, bodyMdUk, bodyMdEn')
    .order('date', { ascending: false })
    .order('id', { ascending: false })
  const items = data ?? []
  return (
    <section className="prose max-w-none">
      <h1>{locale==='uk'?'Новини': locale==='en'?'News':'Новости'}</h1>
      <div className="space-y-8">
        {items.map((n) => (
          <article key={n.id}>
            <h2>{locale==='uk'?(n as any).titleUk || n.title: locale==='en'?(n as any).titleEn || n.title: n.title}</h2>
            <div className="text-sm text-slate-500">{n.date ? new Date(n.date as any).toLocaleString() : ''}</div>
            <div
              dangerouslySetInnerHTML={{
                __html:
                  locale === 'uk'
                    ? ((n as any).bodyMdUk || (n as any).bodyMd || '')
                    : locale === 'en'
                    ? ((n as any).bodyMdEn || (n as any).bodyMd || '')
                    : ((n as any).bodyMd || ''),
              }}
            />
          </article>
        ))}
      </div>
    </section>
  )
}


