import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const cookieLng = req.cookies.get('locale')?.value
  const url = req.nextUrl
  if (cookieLng && url.locale !== cookieLng) {
    // Устанавливаем атрибут lang в HTML через заголовок, Next сам подставит
    res.headers.set('x-locale', cookieLng)
  }
  return res
}


