import './globals.css'
import type { ReactNode } from 'react'

import { supabase } from '@/lib/supabase'

export default async function RootLayout({ children }: { children: ReactNode }) {
  const { data: author } = await supabase
    .from('AuthorProfile')
    .select('fullName')
    .order('id', { ascending: false })
    .limit(1)
    .maybeSingle()
  const fullName = author?.fullName || 'Автор'

  return (
    <html lang="ru" suppressHydrationWarning data-gramm="false" data-gramm_editor="false">
      <body className="min-h-screen bg-white text-slate-900" suppressHydrationWarning>
        <div className="max-w-6xl mx-auto px-4 py-6">
          <header className="flex items-center justify-end mb-8">
            <nav className="space-x-4">
              <a href="/news" className="hover:underline">Новости</a>
              <a href="/about" className="hover:underline">Об авторе</a>
              <a href="/galleries" className="hover:underline">Галереи</a>
              <a href="/services" className="hover:underline">Услуги</a>
              <a href="/education" className="hover:underline">Обучение</a>
              <a href="/lectures" className="hover:underline">Лекции и статьи</a>
              <a href="/clients" className="hover:underline">Клиентам</a>
              <a href="/admin" className="hover:underline">Админ</a>
            </nav>
          </header>
          <main>{children}</main>
          <footer className="mt-16 text-sm text-slate-500">© {new Date().getFullYear()} {fullName}</footer>
        </div>
      </body>
    </html>
  )
}


