import type { ReactNode } from 'react'

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <section>
      <h1 className="text-2xl font-semibold mb-6">Админ-панель</h1>
      <nav className="mb-6 space-x-4">
        <a href="/admin" className="underline">Главная</a>
        <a href="/admin/author">Автор</a>
        <a href="/admin/galleries">Галереи</a>
        <a href="/admin/services">Услуги</a>
        <a href="/admin/education">Обучение</a>
        <a href="/admin/news">Новости</a>
        <a href="/admin/lectures">Лекции и статьи</a>
        <a href="/admin/logout" className="text-red-600">Выйти</a>
      </nav>
      {children}
    </section>
  )
}


