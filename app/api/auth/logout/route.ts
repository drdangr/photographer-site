import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { sessionOptions } from '@/lib/session'

export async function POST() {
  const session = await getIronSession(cookies(), sessionOptions)
  session.destroy()
  return new Response(null, { status: 204 })
}


