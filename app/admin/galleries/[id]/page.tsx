import { supabaseAdmin } from '@/lib/supabaseServer'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getServerSession } from '@/lib/session'
import { saveGallery, deleteGallery } from '../save'
import ImageInput from '@/components/ImageInput'
import MultiImageInput from '@/components/MultiImageInput'
import SaveButton from '@/components/SaveButton'
import { isYouTubeUrl, parseYouTubeId, youtubeThumbUrl } from '@/lib/youtube'
import { revalidatePath as _revalidate } from 'next/cache'

type Props = { params: { id: string } }

export default async function EditGalleryPage({ params }: Props) {
  const session = await getServerSession()
  if (!session.userId) redirect('/admin/login')
  const locale = (await import('next/headers')).cookies().get('locale')?.value as 'ru' | 'uk' | 'en' | undefined || 'ru'

  const id = Number(params.id)
  const { data: gallery } = await supabaseAdmin.from('Gallery').select('*').eq('id', id).maybeSingle()
  if (!gallery) redirect('/admin/galleries')
  const { data: photos } = await supabaseAdmin.from('Photo').select('*').eq('galleryId', gallery.id).order('order', { ascending: true })

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <form action={saveGallery} className="space-y-4">
        <h2 className="text-xl font-semibold">Редактирование галереи</h2>
        <input type="hidden" name="id" defaultValue={gallery.id} />
        <input type="hidden" name="_locale" defaultValue={locale} />
        <div>
          <label className="block text-sm mb-1">Название</label>
          <input name="title" className="border rounded w-full p-2" defaultValue={(locale==='uk'?(gallery as any).titleUk: locale==='en'?(gallery as any).titleEn: (gallery as any).title) || ''} required />
        </div>
        <div>
          <label className="block text-sm mb-1">Slug</label>
          <input name="slug" className="border rounded w-full p-2" defaultValue={gallery.slug} required />
        </div>
        <div>
          <label className="block text-sm mb-1">Описание</label>
          <textarea name="description" className="border rounded w-full p-2" defaultValue={(locale==='uk'?(gallery as any).descriptionUk: locale==='en'?(gallery as any).descriptionEn: (gallery as any).description) ?? ''} />
        </div>
        <div>
          <label className="block text-sm mb-1">Порядок отображения</label>
          <input name="displayOrder" type="number" className="border rounded w-40 p-2" defaultValue={gallery.displayOrder} />
        </div>
        {/* galleries/YYYY/MM/DD/<slug>/covers */}
        <script dangerouslySetInnerHTML={{ __html: `window.__uploadCoverPrefix=()=>{const slug=document.querySelector('input[name=\\"slug\\"]')?.value?.trim()||'no-slug';const d=new Date();const y=d.getFullYear(),m=(''+(d.getMonth()+1)).padStart(2,'0'),day=(''+d.getDate()).padStart(2,'0');return 'galleries/'+y+'/'+m+'/'+day+'/'+slug+'/covers'}` }} />
        <ImageInput name="coverUrl" label="Обложка (URL или загрузка)" defaultValue={gallery.coverUrl ?? ''} />
        <div className="space-y-2">
          {/* galleries/YYYY/MM/DD/<slug>/pictures */}
          <script dangerouslySetInnerHTML={{ __html: `window.__uploadPrefix=()=>{const slug=document.querySelector('input[name=\\"slug\\"]')?.value?.trim()||'no-slug';const d=new Date();const y=d.getFullYear(),m=(''+(d.getMonth()+1)).padStart(2,'0'),day=(''+d.getDate()).padStart(2,'0');return 'galleries/'+y+'/'+m+'/'+day+'/'+slug+'/pictures'}` }} />
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
              <form key={p.id} action={updatePhotoAlt} className="relative group border rounded overflow-hidden p-0">
                <button type="submit" formAction={updatePhotoAlt} className="hidden" aria-hidden="true" />
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={(isYouTubeUrl(p.url) && parseYouTubeId(p.url)) ? youtubeThumbUrl(parseYouTubeId(p.url) as string) : p.url}
                    alt={p.alt ?? ''}
                    className="w-full h-40 object-cover"
                  />
                  {isYouTubeUrl(p.url) && (
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                      <span className="inline-block bg-black/50 text-white rounded-full w-8 h-8 text-center leading-8">▶</span>
                    </div>
                  )}
                  <button
                    type="submit"
                    title="Удалить"
                    formAction={deletePhoto}
                    className="absolute top-1 right-1 hidden group-hover:block bg-white/90 text-red-600 border border-red-600 rounded px-2 leading-none"
                  >
                    ×
                  </button>
                </div>
                <input type="hidden" name="photoId" defaultValue={p.id} />
                <div className="p-2 bg-white">
                  <input
                    name="alt"
                    defaultValue={p.alt ?? ''}
                    placeholder="ALT"
                    className="border rounded p-1 w-full text-xs"
                  />
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-slate-600">#{p.order}</span>
                  </div>
                </div>
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
  // Читаем URL до удаления записи
  const { data: photo } = await supabaseAdmin.from('Photo').select('url, galleryId').eq('id', photoId).maybeSingle()
  await supabaseAdmin.from('Photo').delete().eq('id', photoId).limit(1)
  // Пытаемся удалить файл из Storage
  try {
    if (photo?.url) {
      const m = String(photo.url).match(/\/object\/public\/(.*?)\/(.*)$/)
      const bucket = m?.[1]
      const path = m?.[2]
      if (bucket && path) {
        const { createClient } = await import('@supabase/supabase-js')
        const client = createClient(process.env.SUPABASE_URL as string, (process.env.SUPABASE_SERVICE_ROLE_KEY as string) || (process.env.SUPABASE_ANON_KEY as string))
        await client.storage.from(bucket).remove([path])
      }
    }
  } catch {}
  if (photo?.galleryId) {
    revalidatePath(`/admin/galleries/${photo.galleryId}`)
    redirect(`/admin/galleries/${photo.galleryId}`)
  }
}

async function updatePhotoAlt(formData: FormData) {
  'use server'
  const photoId = Number(formData.get('photoId'))
  const alt = String(formData.get('alt') || '') || null
  if (!photoId) return
  await supabaseAdmin.from('Photo').update({ alt }).eq('id', photoId).limit(1)
  const { data: photo } = await supabaseAdmin.from('Photo').select('galleryId').eq('id', photoId).maybeSingle()
  if (photo?.galleryId) {
    revalidatePath(`/admin/galleries/${photo.galleryId}`)
    redirect(`/admin/galleries/${photo.galleryId}`)
  }
}


