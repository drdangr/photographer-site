import { supabaseAdmin } from '@/lib/supabaseServer'
import { redirect } from 'next/navigation'
import { getServerSession } from '@/lib/session'
import { saveGallery, deleteGallery } from '../save'
import ImageInput from '@/components/ImageInput'
import MultiImageInput from '@/components/MultiImageInput'
import SaveButton from '@/components/SaveButton'

type Props = { params: { id: string } }

export default async function EditGalleryPage({ params }: Props) {
  const session = await getServerSession()
  if (!session.userId) redirect('/admin/login')

  const id = Number(params.id)
  const { data: gallery } = await supabaseAdmin.from('Gallery').select('*').eq('id', id).maybeSingle()
  if (!gallery) redirect('/admin/galleries')
  const { data: photos } = await supabaseAdmin.from('Photo').select('*').eq('galleryId', gallery.id).order('order', { ascending: true })

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <form action={saveGallery} className="space-y-4">
        <h2 className="text-xl font-semibold">Редактирование галереи</h2>
        <input type="hidden" name="id" defaultValue={gallery.id} />
        <div>
          <label className="block text-sm mb-1">Название</label>
          <input name="title" className="border rounded w-full p-2" defaultValue={gallery.title} required />
        </div>
        <div>
          <label className="block text-sm mb-1">Slug</label>
          <input name="slug" className="border rounded w-full p-2" defaultValue={gallery.slug} required />
        </div>
        <div>
          <label className="block text-sm mb-1">Описание</label>
          <textarea name="description" className="border rounded w-full p-2" defaultValue={gallery.description ?? ''} />
        </div>
        <div>
          <label className="block text-sm mb-1">Порядок отображения</label>
          <input name="displayOrder" type="number" className="border rounded w-40 p-2" defaultValue={gallery.displayOrder} />
        </div>
        <ImageInput name="coverUrl" label="Обложка (URL или загрузка)" defaultValue={gallery.coverUrl ?? ''} />
        <div className="space-y-2">
          <MultiImageInput name="photosJson" label="Добавить новые фото (URL или файлы)" />
          <div>
            <label className="block text-sm mb-1">ALT для новых фото (опционально)</label>
            <input name="alt" className="border rounded p-2 w-full md:w-96" />
          </div>
        </div>
        <div className="flex gap-3">
          <SaveButton />
          <button formAction={deleteGallery} className="text-red-600 border border-red-600 px-4 py-2 rounded">Удалить</button>
        </div>
      </form>

      <section>
        <h3 className="text-lg font-semibold mb-3">Фотографии</h3>

         {(photos || []).length === 0 ? (
          <div className="text-sm text-slate-500">Пока нет фотографий</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
             {(photos || []).map((p) => (
              <form key={p.id} action={deletePhoto} className="relative group border rounded overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.url} alt={p.alt ?? ''} className="w-full h-40 object-cover" />
                <input type="hidden" name="photoId" defaultValue={p.id} />
                <div className="absolute bottom-0 left-0 right-0 bg-black/40 text-white text-xs px-2 py-1 flex justify-between">
                  <span className="truncate mr-2">{p.alt ?? ''}</span>
                  <span>#{p.order}</span>
                </div>
                <button type="submit" title="Удалить"
                  className="absolute top-1 right-1 hidden group-hover:block bg-white/90 text-red-600 border border-red-600 rounded px-2 leading-none">
                  ×
                </button>
              </form>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

async function addPhotos(formData: FormData) {
  'use server'
  const galleryId = Number(formData.get('galleryId'))
  const photosJson = String(formData.get('photosJson') || '[]')
  const alt = String(formData.get('alt') || '') || null
  if (!galleryId) return
  let urls: string[] = []
  try {
    const parsed = JSON.parse(photosJson)
    if (Array.isArray(parsed)) urls = parsed.filter((u) => typeof u === 'string' && u.length > 0)
  } catch {}
  if (urls.length === 0) return
  const { data: maxRow } = await supabaseAdmin
    .from('Photo')
    .select('order')
    .eq('galleryId', galleryId)
    .order('order', { ascending: false })
    .limit(1)
    .maybeSingle()
  let order = ((maxRow?.order as number) ?? 0) + 1
  await supabaseAdmin.from('Photo').insert(urls.map((u) => ({ galleryId, url: u, alt, order: order++ })))
}

async function deletePhoto(formData: FormData) {
  'use server'
  const photoId = Number(formData.get('photoId'))
  if (!photoId) return
  // Удаляем без ошибки, даже если записи уже нет
  await supabaseAdmin.from('Photo').delete().eq('id', photoId).limit(1)
}


