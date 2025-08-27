"use client"
import type { ReactNode } from 'react'
import { useI18n } from '@/components/I18nProvider'

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { t } = useI18n() as any
  return (
    <section>
      <h1 className="text-2xl font-semibold mb-6">{t('admin.title', 'Админ-панель')}</h1>
      <nav className="mb-6 flex flex-wrap gap-x-4 gap-y-2">
        <a href="/admin" className="underline whitespace-nowrap">{t('admin.home')}</a>
        <a href="/admin/author" className="whitespace-nowrap">{t('admin.author')}</a>
        <a href="/admin/galleries" className="whitespace-nowrap">{t('admin.galleries')}</a>
        <a href="/admin/services" className="whitespace-nowrap">{t('admin.services')}</a>
        <a href="/admin/education" className="whitespace-nowrap">{t('admin.education')}</a>
        <a href="/admin/clients" className="whitespace-nowrap">{t('admin.clients')}</a>
        <a href="/admin/news" className="whitespace-nowrap">{t('admin.news')}</a>
        <a href="/admin/lectures" className="whitespace-nowrap">{t('admin.lectures')}</a>
        <a href="/admin/logout" className="text-red-600 whitespace-nowrap">{t('admin.logout')}</a>
      </nav>
      {children}
    </section>
  )
}


