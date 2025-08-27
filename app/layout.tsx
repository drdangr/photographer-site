import './globals.css'
import type { ReactNode } from 'react'

import { supabase } from '@/lib/supabase'
import { I18nProvider } from '@/components/I18nProvider'
import LangSwitcher from '@/components/LangSwitcher'
import { cookies } from 'next/headers'
import dictRu from '@/locales/ru.json'
import dictUk from '@/locales/uk.json'
import dictEn from '@/locales/en.json'

export default async function RootLayout({ children }: { children: ReactNode }) {
  const { data: author } = await supabase
    .from('AuthorProfile')
    .select('fullName')
    .order('id', { ascending: false })
    .limit(1)
    .maybeSingle()
  const fullName = author?.fullName || 'Автор'
  // Читаем язык из cookie на сервере
  const cookieLocale = cookies().get('locale')?.value as 'ru' | 'uk' | 'en' | undefined
  const locale = cookieLocale || ((typeof process !== 'undefined' && process?.env?.DEFAULT_LOCALE) as 'ru' | 'uk' | 'en' || 'ru')
  const dict = locale === 'uk' ? (dictUk as any) : locale === 'en' ? (dictEn as any) : (dictRu as any)
  return (
    <html lang={locale} suppressHydrationWarning data-gramm="false" data-gramm_editor="false">
      <body className="min-h-screen bg-white text-slate-900" suppressHydrationWarning>
        <div className="max-w-6xl mx-auto px-4 py-6">
          <I18nProvider locale={locale} dict={dict}>
            <header className="flex items-center justify-between mb-8">
              <nav className="space-x-4">
                <a href="/news" className="hover:underline">{dict.nav.news}</a>
                <a href="/about" className="hover:underline">{dict.nav.about}</a>
                <a href="/galleries" className="hover:underline">{dict.nav.galleries}</a>
                <a href="/services" className="hover:underline">{dict.nav.services}</a>
                <a href="/education" className="hover:underline">{dict.nav.education}</a>
                <a href="/lectures" className="hover:underline">{dict.nav.lectures}</a>
                <a href="/clients" className="hover:underline">{dict.nav.clients}</a>
                <a href="/admin" className="hover:underline">{dict.nav.admin}</a>
              </nav>
              <LangSwitcher currentLocale={locale} />
            </header>
            <main>{children}</main>
            <footer className="mt-16 text-sm text-slate-500">© {new Date().getFullYear()} {fullName}</footer>
          </I18nProvider>
        </div>
      </body>
    </html>
  )
}


