import type { ReactNode } from 'react'

export default function ClientsLayout({ children }: { children: ReactNode }) {
  return (
    <section>
      <h1 className="text-2xl font-semibold mb-6">Портал клиента</h1>
      <nav className="mb-6 space-x-4">
        <a href="/clients" className="underline">Главная</a>
        <a href="/clients/galleries">Мои галереи</a>
        <a href="/clients/logout" className="text-red-600">Выйти</a>
      </nav>
      {children}
    </section>
  )
}


