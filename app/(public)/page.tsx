import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const locale = (await import('next/headers')).cookies().get('locale')?.value as 'ru' | 'uk' | 'en' | undefined
  const { data } = await supabase
    .from('AuthorProfile')
    .select('id, fullName, fullNameUk, fullNameEn, avatarUrl, updatedAt')
    .order('updatedAt', { ascending: false })
    .limit(1)
    .maybeSingle()
  const author = data || null
  const authorName = locale === 'uk'
    ? (author?.fullNameUk || author?.fullName || '')
    : locale === 'en'
      ? (author?.fullNameEn || author?.fullName || '')
      : (author?.fullName || '')
  const avatarAlt = locale === 'en' ? 'Author' : 'Автор'
  const welcome = locale === 'uk'
    ? 'Ласкаво просимо на офіційний сайт'
    : locale === 'en'
      ? 'Welcome to the official website'
      : 'Добро пожаловать на официальный сайт'
  const tGalleries = locale === 'uk' ? 'Галереї' : locale === 'en' ? 'Galleries' : 'Галереи'
  const dGalleries = locale === 'uk' ? 'Тематики та добірки робіт' : locale === 'en' ? 'Темы и подборки работ' : 'Тематики и подборки работ'
  const tServices = locale === 'uk' ? 'Послуги' : locale === 'en' ? 'Services' : 'Услуги'
  const dServices = locale === 'uk' ? 'Ціни та умови' : locale === 'en' ? 'Pricing and terms' : 'Расценки и условия'
  const tEducation = locale === 'uk' ? 'Навчання' : locale === 'en' ? 'Education' : 'Обучение'
  const dEducation = locale === 'uk' ? 'Майстер-класи та курси' : locale === 'en' ? 'Master classes and courses' : 'Мастер-классы и курсы'
  return (
    <section className="space-y-6">
      <div className="flex items-center gap-4">
        {author?.avatarUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={author.avatarUrl} alt={authorName || avatarAlt} className="w-20 h-20 rounded-full object-cover border" />
        )}
        <div>
          <h1 className="text-3xl font-bold">{authorName}</h1>
          <p className="text-slate-700">{welcome}{authorName ? ` — ${authorName}` : ''}.</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <a className="p-4 border rounded hover:bg-slate-50" href="/galleries">
          <div className="font-semibold mb-1">{tGalleries}</div>
          <div className="text-sm text-slate-600">{dGalleries}</div>
        </a>
        <a className="p-4 border rounded hover:bg-slate-50" href="/services">
          <div className="font-semibold mb-1">{tServices}</div>
          <div className="text-sm text-slate-600">{dServices}</div>
        </a>
        <a className="p-4 border rounded hover:bg-slate-50" href="/education">
          <div className="font-semibold mb-1">{tEducation}</div>
          <div className="text-sm text-slate-600">{dEducation}</div>
        </a>
      </div>
    </section>
  )
}


