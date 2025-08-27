import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const runtime = 'nodejs'

export default async function GalleriesPage() {
  const locale = (await import('next/headers')).cookies().get('locale')?.value as 'ru' | 'uk' | 'en' | undefined
  const { data } = await supabase
    .from('Gallery')
    .select('id, title, titleUk, titleEn, slug, description, descriptionUk, descriptionEn, coverUrl, displayOrder, createdAt')
    .order('displayOrder', { ascending: true })
    .order('createdAt', { ascending: false })
  const galleries = data ?? []
  return (
    <section>
      <h1 className="text-2xl font-semibold mb-4">{locale==='uk'?'Галереї': locale==='en'?'Galleries':'Галереи'}</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {galleries.map((g) => (
          <a key={g.id} href={`/galleries/${g.slug}`} className="block border rounded overflow-hidden hover:shadow">
            {g.coverUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={g.coverUrl} alt={g.title} className="w-full h-48 object-cover" />
            ) : (
              <div className="w-full h-48 bg-slate-100" />
            )}
            <div className="p-4">
              <div className="font-medium">{locale==='uk'?(g as any).titleUk || g.title: locale==='en'?(g as any).titleEn || g.title: g.title}</div>
              {((locale==='uk'?(g as any).descriptionUk: locale==='en'?(g as any).descriptionEn: g.description) || '') && (
                <div className="text-sm text-slate-600 mt-1 line-clamp-2">{locale==='uk'?(g as any).descriptionUk || g.description: locale==='en'?(g as any).descriptionEn || g.description: g.description}</div>
              )}
            </div>
          </a>
        ))}
      </div>
    </section>
  )
}


