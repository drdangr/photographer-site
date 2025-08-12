export const dynamic = 'force-dynamic'

export default function ClientsLanding() {
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">Для клиентов и учеников</h1>
      <p>Войдите, чтобы просматривать и редактировать ваши персональные галереи, загружать материалы и оставлять комментарии.</p>
      <a href="/clients/login" className="inline-block bg-slate-900 text-white px-4 py-2 rounded">Войти</a>
    </section>
  )
}


