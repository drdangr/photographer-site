import { redirect } from 'next/navigation'
import { getServerSession } from '@/lib/session'

export default async function AdminIndex() {
  const session = await getServerSession()
  if (!session.userId) {
    redirect('/admin/login')
  }
  return (
    <div className="space-y-4">
      <p>Добро пожаловать в панель управления.</p>
      <ul className="list-disc pl-5 text-slate-700">
        <li>Редактируйте профиль автора</li>
        <li>Создавайте и обновляйте галереи</li>
        <li>Управляйте услугами и обучением</li>
      </ul>
    </div>
  )
}


