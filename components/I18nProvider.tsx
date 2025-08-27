'use client'
import { createContext, useContext } from 'react'

export type Locale = 'ru' | 'uk' | 'en'

export type Dictionary = Record<string, any>

type Ctx = {
  locale: Locale
  t: (path: string, fallback?: string) => string
}

const I18nContext = createContext<Ctx>({
  locale: 'ru',
  t: (path: string, fallback?: string) => fallback ?? path,
})

export function I18nProvider({ locale, dict, children }: { locale: Locale; dict: Dictionary; children: React.ReactNode }) {
  const t = (path: string, fallback?: string) => {
    const parts = path.split('.')
    let cur: any = dict
    for (const p of parts) {
      if (cur && typeof cur === 'object' && p in cur) cur = cur[p]
      else return fallback ?? path
    }
    return typeof cur === 'string' ? cur : (fallback ?? path)
  }
  return (
    <I18nContext.Provider value={{ locale, t }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  return useContext(I18nContext)
}


