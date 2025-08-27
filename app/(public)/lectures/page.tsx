import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const runtime = 'nodejs'

export default async function LecturesListPage() {
  const locale = (await import('next/headers')).cookies().get('locale')?.value as 'ru' | 'uk' | 'en' | undefined
  const { data: sections } = await supabase
    .from('LectureSection')
    .select('id,title,titleUk,titleEn')
    .eq('public', true)
    .order('displayOrder', { ascending: true })
    .order('title', { ascending: true })
  const sectionsList = sections ?? []
  const { data: lectures } = await supabase
    .from('Lecture')
    .select('id,title,titleUk,titleEn,slug,coverUrl,sectionId,displayOrder,public')
    .eq('public', true)
    .order('sectionId', { ascending: true })
    .order('displayOrder', { ascending: true })
    .order('id', { ascending: true })
  const items = lectures ?? []
  return (
    <section>
      <h1 className="text-2xl font-semibold mb-4">{locale==='uk'?'Лекції та статті': locale==='en'?'Lectures & Articles':'Лекции и статьи'}</h1>
      <div className="space-y-8">
        {sectionsList.map((s) => (
          <div key={s.id}>
            <h2 className="text-xl font-semibold mb-3">{locale==='uk'?(s as any).titleUk || s.title: locale==='en'?(s as any).titleEn || s.title: s.title}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {items.filter((l) => l.sectionId === s.id).map((l) => (
                <a key={l.id} href={`/lectures/${l.slug}`} className="block border rounded overflow-hidden hover:shadow">
                  {l.coverUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={l.coverUrl} alt={l.title} className="w-full h-40 object-cover" />
                  ) : (
                    <div className="w-full h-40 bg-slate-100" />
                  )}
                  <div className="p-4">
                    <div className="font-medium">{locale==='uk'?(l as any).titleUk || l.title: locale==='en'?(l as any).titleEn || l.title: l.title}</div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        ))}
        {/* Без раздела */}
        <div>
          <h2 className="text-xl font-semibold mb-3">{locale==='uk'?'Без розділу': locale==='en'?'Uncategorized':'Без раздела'}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {items.filter((l) => !l.sectionId).map((l) => (
              <a key={l.id} href={`/lectures/${l.slug}`} className="block border rounded overflow-hidden hover:shadow">
                {l.coverUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={l.coverUrl} alt={l.title} className="w-full h-40 object-cover" />
                ) : (
                  <div className="w-full h-40 bg-slate-100" />
                )}
                <div className="p-4">
                  <div className="font-medium">{locale==='uk'?(l as any).titleUk || l.title: locale==='en'?(l as any).titleEn || l.title: l.title}</div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}


