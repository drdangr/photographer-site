import { MetadataRoute } from 'next'
import { supabase } from '@/lib/supabase'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://www.stepanov.website'

  // Получаем галереи
  const { data: galleries } = await supabase
    .from('Gallery')
    .select('id, slug, updated_at')
    .eq('is_public', true)

  // Получаем лекции
  const { data: lectures } = await supabase
    .from('Lecture')
    .select('id, slug, updated_at')
    .eq('is_public', true)

  // Получаем новости
  const { data: news } = await supabase
    .from('News')
    .select('id, slug, updated_at')
    .eq('is_public', true)

  const staticPages = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 1,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/galleries`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/services`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/education`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/lectures`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/news`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
  ]

  const dynamicPages = [
    ...(galleries?.map((gallery) => ({
      url: `${baseUrl}/galleries/${gallery.slug}`,
      lastModified: new Date(gallery.updated_at),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    })) || []),
    ...(lectures?.map((lecture) => ({
      url: `${baseUrl}/lectures/${lecture.slug}`,
      lastModified: new Date(lecture.updated_at),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })) || []),
    ...(news?.map((newsItem) => ({
      url: `${baseUrl}/news/${newsItem.slug}`,
      lastModified: new Date(newsItem.updated_at),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })) || []),
  ]

  return [...staticPages, ...dynamicPages]
}
