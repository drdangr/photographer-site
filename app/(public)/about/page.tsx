import { supabase } from '@/lib/supabase'
// Рендерим HTML, т.к. в админке используется RichEditor (Tiptap)

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function AboutPage() {
  const { data } = await supabase
    .from('AuthorProfile')
    .select('*')
    .order('id', { ascending: false })
    .limit(1)
    .maybeSingle()
  const author = data || null
  const locale = (await import('next/headers')).cookies().get('locale')?.value as 'ru' | 'uk' | 'en' | undefined
  const fullName = (() => {
    if (!author) return 'Об авторе'
    if (locale === 'uk') return (author as any).fullNameUk || (author as any).fullName || 'Про автора'
    if (locale === 'en') return (author as any).fullNameEn || (author as any).fullName || 'About the author'
    return (author as any).fullName || 'Об авторе'
  })()
  const bio = (() => {
    if (!author) return ''
    if (locale === 'uk') return (author as any).bioMarkdownUk || (author as any).bioMarkdown || ''
    if (locale === 'en') return (author as any).bioMarkdownEn || (author as any).bioMarkdown || ''
    return (author as any).bioMarkdown || ''
  })()
  return (
    <section className="prose max-w-none">
      {author?.avatarUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={author.avatarUrl} alt={author.fullName ?? 'Автор'} className="w-48 h-48 rounded-full object-cover border" />
      )}
      <h1 className="!mt-4 !mb-2 !text-3xl md:!text-5xl !font-extrabold">
        {fullName}
      </h1>
      {bio ? (
        <div dangerouslySetInnerHTML={{ __html: bio as string }} />
      ) : (
        <p>Добавьте информацию об авторе в админ-панели.</p>
      )}

      {author?.contacts && (() => {
        try {
          const contacts = JSON.parse(author.contacts as string) as Record<string, string>
          const entries = Object.entries(contacts || {})
          if (entries.length === 0) return null
          const asHref = (value: string) => {
            const v = value.trim()
            if (/^https?:\/\//i.test(v)) return v
            if (/^[\w.+-]+@[^@]+\.[^@]+$/.test(v)) return `mailto:${v}`
            if (/^\+?[0-9 ()-]{6,}$/.test(v)) return `tel:${v.replace(/[^0-9+]/g, '')}`
            return null
          }
          return (
            <div className="not-prose mt-6">
              <h2 className="text-xl font-semibold mb-2">Контакты</h2>
              <ul className="space-y-1">
                {entries.map(([k, v]) => {
                  const href = asHref(v)
                  return (
                    <li key={k} className="text-slate-700">
                      <span className="font-medium mr-2">{k}:</span>
                      {href ? (
                        <a href={href} className="underline break-all">{v}</a>
                      ) : (
                        <span className="break-all">{v}</span>
                      )}
                    </li>
                  )
                })}
              </ul>
            </div>
          )
        } catch {
          return null
        }
      })()}
    </section>
  )
}


