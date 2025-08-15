export function normalizeSlug(input: string): string {
  const value = String(input || '')
    .trim()
    .toLowerCase()
    // кириллица → латиница (простая транслитерация)
    .replace(/а/g, 'a').replace(/б/g, 'b').replace(/в/g, 'v')
    .replace(/г/g, 'g').replace(/д/g, 'd').replace(/е/g, 'e').replace(/ё/g, 'e')
    .replace(/ж/g, 'zh').replace(/з/g, 'z').replace(/и/g, 'i').replace(/й/g, 'i')
    .replace(/к/g, 'k').replace(/л/g, 'l').replace(/м/g, 'm').replace(/н/g, 'n')
    .replace(/о/g, 'o').replace(/п/g, 'p').replace(/р/g, 'r').replace(/с/g, 's')
    .replace(/т/g, 't').replace(/у/g, 'u').replace(/ф/g, 'f').replace(/х/g, 'h')
    .replace(/ц/g, 'c').replace(/ч/g, 'ch').replace(/ш/g, 'sh').replace(/щ/g, 'sch')
    .replace(/ъ/g, '').replace(/ы/g, 'y').replace(/ь/g, '')
    .replace(/э/g, 'e').replace(/ю/g, 'yu').replace(/я/g, 'ya')
    // замена разделителей на тире
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
  return value || 'item'
}


