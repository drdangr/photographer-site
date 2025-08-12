import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const runtime = 'nodejs'

export default async function GalleriesPage() {
  const { data } = await supabase
    .from('Gallery')
    .select('*')
    .order('displayOrder', { ascending: true })
    .order('createdAt', { ascending: false })
  const galleries = data ?? []
  return (
    <section>
      <h1 className="text-2xl font-semibold mb-4">Галереи</h1>
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
              <div className="font-medium">{g.title}</div>
              {g.description && (
                <div className="text-sm text-slate-600 mt-1 line-clamp-2">{g.description}</div>
              )}
            </div>
          </a>
        ))}
      </div>
    </section>
  )
}


