import { supabase } from '@/lib/supabase'

export async function GET() {
  const baseUrl = 'https://www.stepanov.website'

  const [{ data: news }, { data: lectures }] = await Promise.all([
    supabase
      .from('News')
      .select('id, slug, title, description, updated_at, is_public')
      .eq('is_public', true)
      .order('updated_at', { ascending: false })
      .limit(20),
    supabase
      .from('Lecture')
      .select('id, slug, title, description, updated_at, is_public')
      .eq('is_public', true)
      .order('updated_at', { ascending: false })
      .limit(20),
  ])

  const items = [
    ...(news?.map((item) => ({
      title: item.title,
      link: `${baseUrl}/news/${item.slug}`,
      description: item.description || '',
      pubDate: new Date(item.updated_at).toUTCString(),
      category: 'Новости',
    })) || []),
    ...(lectures?.map((item) => ({
      title: item.title,
      link: `${baseUrl}/lectures/${item.slug}`,
      description: item.description || '',
      pubDate: new Date(item.updated_at).toUTCString(),
      category: 'Лекции',
    })) || []),
  ].sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime())

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>Степанов Алексей Валерьевич - Новости и Лекции</title>
    <link>${baseUrl}</link>
    <description>Новости, лекции и статьи о фотографии от Алексея Степанова</description>
    <language>ru-ru</language>
    <copyright>© 2025 Алексей Степанов</copyright>
    <image>
      <url>https://ejdyesmdailkdbdljaal.supabase.co/storage/v1/object/public/public-images/2025/08/17/1755428777608-img_9193.jpg</url>
      <title>Степанов Алексей Валерьевич</title>
      <link>${baseUrl}</link>
    </image>
    ${items
      .map(
        (item) => `
    <item>
      <title>${escapeXml(item.title)}</title>
      <link>${item.link}</link>
      <guid>${item.link}</guid>
      <description>${escapeXml(item.description)}</description>
      <category>${item.category}</category>
      <pubDate>${item.pubDate}</pubDate>
    </item>
    `
      )
      .join('')}
  </channel>
</rss>`

  return new Response(rss, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
    },
  })
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}
