'use client'
import { useCallback } from 'react'

type Props = { currentLocale: 'ru' | 'uk' | 'en' }

export default function LangSwitcher({ currentLocale }: Props) {
  const onChange = useCallback(async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const locale = e.target.value
    const fd = new FormData()
    fd.append('locale', locale)
    try {
      await fetch('/api/i18n/set', { method: 'POST', body: fd, credentials: 'same-origin' })
    } catch {}
    // Перезагружаем страницу, чтобы серверные компоненты перечитали словари
    window.location.reload()
  }, [])

  return (
    <select name="locale" defaultValue={currentLocale} onChange={onChange} className="border rounded p-1">
      <option value="uk">Українська</option>
      <option value="ru">Русский</option>
      <option value="en">English</option>
    </select>
  )
}


