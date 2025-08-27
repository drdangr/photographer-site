"use client"
import type { ReactNode } from 'react'
import { useI18n } from '@/components/I18nProvider'

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { t } = useI18n() as any
  return (
    <section>
      <h1 className="text-2xl font-semibold mb-6">{t('admin.title', 'Админ-панель')}</h1>
      <nav className="mb-6 space-x-4">
        <a href="/admin" className="underline">{t('admin.home')}</a>
        <a href="/admin/author">{t('admin.author')}</a>
        <a href="/admin/galleries">{t('admin.galleries')}</a>
        <a href="/admin/services">{t('admin.services')}</a>
        <a href="/admin/education">{t('admin.education')}</a>
        <a href="/admin/clients">{t('admin.clients')}</a>
        <a href="/admin/news">{t('admin.news')}</a>
        <a href="/admin/lectures">{t('admin.lectures')}</a>
        <a href="/admin/logout" className="text-red-600">{t('admin.logout')}</a>
      </nav>
      {children}
    </section>
  )
}


