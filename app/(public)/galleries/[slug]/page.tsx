import { supabase } from '@/lib/supabase'
import ThumbGridWithLightbox from '@/components/ThumbGridWithLightbox'
import { notFound } from 'next/navigation'

type Props = { params: { slug: string } }

export default async function GalleryPage({ params }: Props) {
  const { data: gallery } = await supabase.from('Gallery').select('*').eq('slug', params.slug).maybeSingle()
  if (!gallery) return notFound()
  const { data: photos } = await supabase.from('Photo').select('*').eq('galleryId', gallery.id).order('order', { ascending: true })

  return (
    <section>
      <h1 className="text-2xl font-semibold mb-4">{gallery.title}</h1>
      {gallery.description && (
        <p className="text-slate-700 mb-6">{gallery.description}</p>
      )}
      <ThumbGridWithLightbox items={(photos as any || []).map((p: any) => ({ url: p.url, caption: p.alt }))} />
    </section>
  )
}

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const runtime = 'nodejs'

