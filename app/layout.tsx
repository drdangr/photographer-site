import './globals.css'
import type { ReactNode } from 'react'
import type { Metadata } from 'next'

import { supabase } from '@/lib/supabase'
import { I18nProvider } from '@/components/I18nProvider'
import LangSwitcher from '@/components/LangSwitcher'
import { cookies } from 'next/headers'
import dictRu from '@/locales/ru.json'
import dictUk from '@/locales/uk.json'
import dictEn from '@/locales/en.json'

export const metadata: Metadata = {
  metadataBase: new URL('https://www.stepanov.website'),
  title: 'Степанов Геннадий | Фотограф | Лектор',
  description: 'Профессиональный фотограф, преподаватель фотографии. Портретная, документальная и коммерческая фотография. Онлайн-лекции и курсы по фотографии.',
  keywords: 'фотография, фотограф, лекции, курсы фотографии, портретная фотография',
  authors: [{ name: 'Геннадий Степанов' }],
  creator: 'Геннадий Степанов',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'ru_RU',
    url: 'https://www.stepanov.website',
    title: 'Степанов Геннадий | Фотограф | Лектор',
    description: 'Профессиональный фотограф, преподаватель фотографии',
    siteName: 'stepanov.website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Степанов Геннадий | Фотограф | Лектор',
    description: 'Профессиональный фотограф, преподаватель фотографии',
  },
  alternates: {
    canonical: 'https://www.stepanov.website',
  },
}

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
      <head>
        <script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-VPSLQV6VB3"
        ></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-VPSLQV6VB3');
            `,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: 'Степанов Алексей Валерьевич',
              url: 'https://www.stepanov.website',
              logo: 'https://www.stepanov.website/logo.png',
              description: 'Профессиональный фотограф, преподаватель фотографии',
              sameAs: [
                'https://www.facebook.com/aleksej.stepanov.797257',
                'https://instagram.com/alekseistepanovdop',
              ],
              contact: {
                '@type': 'ContactPoint',
                contactType: 'Customer Service',
                telephone: '+380672201917',
                email: 'Stepanovdop@gmail.com',
              },
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Person',
              name: 'Алексей Степанов',
              url: 'https://www.stepanov.website',
              jobTitle: 'Фотограф, Лектор',
              image: 'https://ejdyesmdailkdbdljaal.supabase.co/storage/v1/object/public/public-images/2025/08/17/1755428777608-img_9193.jpg',
              sameAs: [
                'https://www.facebook.com/aleksej.stepanov.797257',
                'https://instagram.com/alekseistepanovdop',
              ],
            }),
          }}
        />
      </head>
      <body className="min-h-screen bg-white text-slate-900" suppressHydrationWarning>
        <div className="max-w-6xl mx-auto px-4 py-6">
          <I18nProvider locale={locale} dict={dict}>
            <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-3">
              <nav className="flex flex-wrap gap-x-4 gap-y-2">
                <a href="/news" className="hover:underline whitespace-nowrap">{dict.nav.news}</a>
                <a href="/about" className="hover:underline whitespace-nowrap">{dict.nav.about}</a>
                <a href="/galleries" className="hover:underline whitespace-nowrap">{dict.nav.galleries}</a>
                <a href="/services" className="hover:underline whitespace-nowrap">{dict.nav.services}</a>
                <a href="/education" className="hover:underline whitespace-nowrap">{dict.nav.education}</a>
                <a href="/lectures" className="hover:underline whitespace-nowrap">{dict.nav.lectures}</a>
                <a href="/clients" className="hover:underline whitespace-nowrap">{dict.nav.clients}</a>
                <a href="/admin" className="hover:underline whitespace-nowrap">{dict.nav.admin}</a>
              </nav>
              <LangSwitcher currentLocale={locale} />
            </header>
            <main>{children}</main>
            <footer className="mt-16 text-sm text-slate-500 border-t border-slate-200 pt-6">
              <div className="flex flex-col gap-4">
                <div>
                  <p className="font-semibold text-slate-900 mb-2">Контакты</p>
                  <ul className="space-y-1 text-slate-600">
                    <li>
                      <a href="mailto:Stepanovdop@gmail.com" className="hover:underline">
                        Email: Stepanovdop@gmail.com
                      </a>
                    </li>
                    <li>
                      <a href="tel:+380672201917" className="hover:underline">
                        Телефон: +380672201917
                      </a>
                    </li>
                    <li>
                      <a href="https://www.facebook.com/aleksej.stepanov.797257" target="_blank" rel="noopener noreferrer" className="hover:underline">
                        Facebook
                      </a>
                    </li>
                    <li>
                      <a href="https://instagram.com/alekseistepanovdop" target="_blank" rel="noopener noreferrer" className="hover:underline">
                        Instagram
                      </a>
                    </li>
                  </ul>
                </div>
                <div className="text-xs text-slate-500 pt-4 border-t border-slate-200">
                  © {new Date().getFullYear()} {fullName}
                </div>
              </div>
            </footer>
          </I18nProvider>
        </div>
      </body>
    </html>
  )
}


