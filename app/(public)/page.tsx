import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const { data } = await supabase
    .from('AuthorProfile')
    .select('*')
    .order('updatedAt', { ascending: false })
    .limit(1)
    .maybeSingle()
  const author = data || null
  return (
    <section className="space-y-6">
      <div className="flex items-center gap-4">
        {author?.avatarUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={author.avatarUrl} alt={author.fullName ?? 'Автор'} className="w-20 h-20 rounded-full object-cover border" />
        )}
        <div>
          <h1 className="text-3xl font-bold">{author?.fullName || ''}</h1>
          <p className="text-slate-700">Добро пожаловать на официальный сайт{author?.fullName ? ` — ${author.fullName}` : ''}.</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <a className="p-4 border rounded hover:bg-slate-50" href="/galleries">
          <div className="font-semibold mb-1">Галереи</div>
          <div className="text-sm text-slate-600">Тематики и подборки работ</div>
        </a>
        <a className="p-4 border rounded hover:bg-slate-50" href="/services">
          <div className="font-semibold mb-1">Услуги</div>
          <div className="text-sm text-slate-600">Расценки и условия</div>
        </a>
        <a className="p-4 border rounded hover:bg-slate-50" href="/education">
          <div className="font-semibold mb-1">Обучение</div>
          <div className="text-sm text-slate-600">Мастер-классы и курсы</div>
        </a>
      </div>
    </section>
  )
}


