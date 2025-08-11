import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { getServerSession } from '@/lib/session'

export default async function AdminGalleriesPage() {
  const session = await getServerSession()
  if (!session.userId) redirect('/admin/login')

  const galleries = await prisma.gallery.findMany({ orderBy: [{ displayOrder: 'asc' }, { updatedAt: 'desc' }] })
  return (
    <div className="space-y-4">
      <a href="/admin/galleries/new" className="inline-block bg-slate-900 text-white px-4 py-2 rounded">Новая галерея</a>
      <ul className="divide-y">
        {galleries.map((g) => (
          <li key={g.id} className="py-3 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="font-medium truncate">{g.title}</div>
              <div className="text-sm text-slate-500 truncate">/{g.slug}</div>
            </div>
            <div className="flex items-center gap-2">
              <form action={moveUp}>
                <input type="hidden" name="id" defaultValue={g.id} />
                <button className="px-2 py-1 border rounded" title="Вверх">▲</button>
              </form>
              <form action={moveDown}>
                <input type="hidden" name="id" defaultValue={g.id} />
                <button className="px-2 py-1 border rounded" title="Вниз">▼</button>
              </form>
              <a href={`/admin/galleries/${g.id}`} className="underline">Редактировать</a>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

async function moveUp(formData: FormData) {
  'use server'
  const id = Number(formData.get('id'))
  const g = await prisma.gallery.findUnique({ where: { id } })
  if (!g) return
  const prev = await prisma.gallery.findFirst({
    where: { displayOrder: { lt: g.displayOrder } },
    orderBy: { displayOrder: 'desc' },
  })
  if (!prev) return
  await prisma.$transaction([
    prisma.gallery.update({ where: { id: g.id }, data: { displayOrder: prev.displayOrder } }),
    prisma.gallery.update({ where: { id: prev.id }, data: { displayOrder: g.displayOrder } }),
  ])
  redirect('/admin/galleries')
}

async function moveDown(formData: FormData) {
  'use server'
  const id = Number(formData.get('id'))
  const g = await prisma.gallery.findUnique({ where: { id } })
  if (!g) return
  const next = await prisma.gallery.findFirst({
    where: { displayOrder: { gt: g.displayOrder } },
    orderBy: { displayOrder: 'asc' },
  })
  if (!next) return
  await prisma.$transaction([
    prisma.gallery.update({ where: { id: g.id }, data: { displayOrder: next.displayOrder } }),
    prisma.gallery.update({ where: { id: next.id }, data: { displayOrder: g.displayOrder } }),
  ])
  redirect('/admin/galleries')
}


