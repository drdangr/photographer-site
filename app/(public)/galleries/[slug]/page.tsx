import { supabase } from '@/lib/supabase'
import ThumbGridWithLightbox from '@/components/ThumbGridWithLightbox'
import { notFound } from 'next/navigation'

type Props = { params: { slug: string } }

export default async function GalleryPage({ params }: Props) {
  const locale = (await import('next/headers')).cookies().get('locale')?.value as 'ru' | 'uk' | 'en' | undefined
  const { data: gallery } = await supabase
    .from('Gallery')
    .select('id, title, titleUk, titleEn, description, descriptionUk, descriptionEn, slug, coverUrl')
    .eq('slug', params.slug)
    .maybeSingle()
  if (!gallery) return notFound()
  const { data: photos } = await supabase.from('Photo').select('*').eq('galleryId', gallery.id).order('order', { ascending: true })

  return (
    <section>
      <h1 className="text-2xl font-semibold mb-4">{locale==='uk'?(gallery as any).titleUk || gallery.title: locale==='en'?(gallery as any).titleEn || gallery.title: gallery.title}</h1>
      {((locale==='uk'?(gallery as any).descriptionUk: locale==='en'?(gallery as any).descriptionEn: gallery.description) || '') && (
        <p className="text-slate-700 mb-6">{locale==='uk'?(gallery as any).descriptionUk || gallery.description: locale==='en'?(gallery as any).descriptionEn || gallery.description: gallery.description}</p>
      )}
      <ThumbGridWithLightbox items={(photos as any || []).map((p: any) => ({ url: p.url, caption: p.alt }))} />
    </section>
  )
}

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const runtime = 'nodejs'

