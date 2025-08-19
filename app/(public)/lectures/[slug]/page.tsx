import { supabase } from '@/lib/supabase'

type Props = { params: { slug: string } }

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const runtime = 'nodejs'

export default async function LecturePage({ params }: Props) {
  const { data: lecture } = await supabase
    .from('Lecture')
    .select('id,title,slug,coverUrl,contentHtml,public,sectionId')
    .eq('slug', decodeURIComponent(params.slug))
    .eq('public', true)
    .maybeSingle()
  if (!lecture) return <div className="text-sm text-slate-600">Материал не найден</div>
  return (
    <article className="prose max-w-none">
      <h1>{lecture.title}</h1>
      {lecture.coverUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={lecture.coverUrl} alt={lecture.title} className="w-full h-64 object-cover rounded" />
      )}
      {lecture.contentHtml ? (
        <div dangerouslySetInnerHTML={{ __html: lecture.contentHtml }} />
      ) : (
        <p className="text-slate-600">Содержимое пока не добавлено.</p>
      )}
    </article>
  )}


