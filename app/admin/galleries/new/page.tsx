import { redirect } from 'next/navigation'
import { getServerSession } from '@/lib/session'
import { saveGallery } from '../../galleries/save'
import ImageInput from '@/components/ImageInput'
import MultiImageInput from '@/components/MultiImageInput'
import SaveButton from '@/components/SaveButton'

export default async function NewGalleryPage() {
  const session = await getServerSession()
  if (!session.userId) redirect('/admin/login')

  return (
    <form action={saveGallery} className="max-w-2xl space-y-4">
      <h2 className="text-xl font-semibold">Новая галерея</h2>
      <div>
        <label className="block text-sm mb-1">Название</label>
        <input name="title" className="border rounded w-full p-2" required />
      </div>
      <div>
        <label className="block text-sm mb-1">Slug</label>
        <input name="slug" className="border rounded w-full p-2" placeholder="eng-slug" required />
      </div>
      <div>
        <label className="block text-sm mb-1">Описание</label>
        <textarea name="description" className="border rounded w-full p-2" />
      </div>
      <div>
        <label className="block text-sm mb-1">Порядок отображения</label>
        <input name="displayOrder" type="number" className="border rounded w-40 p-2" defaultValue={0} />
      </div>
      {/* galleries/YYYY/MM/DD/<slug>/covers */}
      <script dangerouslySetInnerHTML={{ __html: `window.__uploadCoverPrefix=()=>{const slug=document.querySelector('input[name=\\"slug\\"]')?.value?.trim()||'no-slug';const d=new Date();const y=d.getFullYear(),m=(''+(d.getMonth()+1)).padStart(2,'0'),day=(''+d.getDate()).padStart(2,'0');return 'galleries/'+y+'/'+m+'/'+day+'/'+slug+'/covers'}` }} />
      <ImageInput name="coverUrl" label="Обложка (URL или загрузка)" />
      {/* galleries/YYYY/MM/DD/<slug>/pictures */}
      <script dangerouslySetInnerHTML={{ __html: `window.__uploadPrefix=()=>{const slug=document.querySelector('input[name=\\"slug\\"]')?.value?.trim()||'no-slug';const d=new Date();const y=d.getFullYear(),m=(''+(d.getMonth()+1)).padStart(2,'0'),day=(''+d.getDate()).padStart(2,'0');return 'galleries/'+y+'/'+m+'/'+day+'/'+slug+'/pictures'}` }} />
      <MultiImageInput name="photosJson" label="Фото для галереи (URL или файлы)" />
      <div>
        <label className="block text-sm mb-1">ALT для фото (опционально)</label>
        <input name="alt" className="border rounded w-full p-2 md:w-96" />
      </div>
      <SaveButton>Создать</SaveButton>
    </form>
  )
}


