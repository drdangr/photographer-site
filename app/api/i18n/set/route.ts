import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'

export async function POST(req: NextRequest) {
  const form = await req.formData()
  const locale = String(form.get('locale') || 'ru')
  const valid = ['ru', 'uk', 'en']
  const lng = valid.includes(locale) ? locale : 'ru'
  cookies().set('locale', lng, { path: '/', httpOnly: false, sameSite: 'lax', maxAge: 60 * 60 * 24 * 365 })
  return new Response(null, { status: 302, headers: { Location: req.headers.get('referer') || '/' } })
}


