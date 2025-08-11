import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'

export async function saveGallery(formData: FormData) {
  'use server'
  const id = Number(formData.get('id') || 0)
  const title = String(formData.get('title') || '')
  const slug = String(formData.get('slug') || '')
  const description = String(formData.get('description') || '') || null
  const coverUrl = String(formData.get('coverUrl') || '') || null
  const photosJson = String(formData.get('photosJson') || '[]')
  const alt = String(formData.get('alt') || '') || null
  const displayOrderRaw = formData.get('displayOrder')
  const displayOrder = displayOrderRaw !== null && displayOrderRaw !== '' ? Number(displayOrderRaw) : undefined

  if (!title || !slug) return

  // Create or update gallery
  const gallery = id
    ? await prisma.gallery.update({ where: { id }, data: { title, slug, description, coverUrl, ...(displayOrder !== undefined ? { displayOrder } : {}) } })
    : await prisma.gallery.create({ data: { title, slug, description, coverUrl, displayOrder: displayOrder ?? 0 } })

  // Optionally add photos in bulk when provided
  if (photosJson) {
    try {
      const parsed = JSON.parse(photosJson)
      if (Array.isArray(parsed) && parsed.length > 0) {
        const existingMax = await prisma.photo.aggregate({ where: { galleryId: gallery.id }, _max: { order: true } })
        let order = (existingMax._max.order ?? 0) + 1
        const urls: string[] = parsed.filter((u) => typeof u === 'string' && u.length > 0)
        if (urls.length > 0) {
          await prisma.photo.createMany({
            data: urls.map((u) => ({ galleryId: gallery.id, url: u, alt, order: order++ })),
          })
        }
      }
    } catch {
      // ignore malformed photosJson
    }
  }

  redirect(`/admin/galleries/${gallery.id}`)
}

export async function deleteGallery(formData: FormData) {
  'use server'
  const id = Number(formData.get('id'))
  if (!id) return
  await prisma.gallery.delete({ where: { id } })
  redirect('/admin/galleries')
}


