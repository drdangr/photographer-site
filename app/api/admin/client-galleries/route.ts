import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { supabaseAdmin } from '@/lib/supabaseServer'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  try {
    // Prefer Authorization header (client passes access_token), fallback to cookies
    const token = request.headers.get('authorization')
    let user: any = null
    if (token && token.toLowerCase().startsWith('bearer ')) {
      const jwt = token.slice(7)
      const { data: u, error: uErr } = await supabaseAdmin.auth.getUser(jwt)
      if (uErr) throw uErr
      user = u?.user
    }
    if (!user) {
      const supa = createRouteHandlerClient({ cookies: () => cookies() })
      const { data, error: aErr } = await supa.auth.getUser()
      if (aErr) throw aErr
      user = data?.user
    }
    if (!user) return new Response(JSON.stringify({ message: 'Unauthorized' }), { status: 401 })

    const isAdmin = (user as any)?.app_metadata?.role === 'admin'
    if (!isAdmin) return new Response(JSON.stringify({ message: 'Forbidden' }), { status: 403 })

    // All client galleries
    const { data: galleries, error: gErr } = await supabaseAdmin
      .from('ClientGallery')
      .select('id,title,comment,clientUserId,updatedAt')
      .order('updatedAt', { ascending: false })
    if (gErr) throw gErr

    // Get emails via Admin API (service role)
    let emailsById: Record<string, string> = {}
    const list = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 })
    for (const u of list.data?.users || []) {
      if (u.id) emailsById[u.id] = u.email || ''
    }

    const photosByGallery: Record<number, { client: any[]; author: any[] }> = {}
    for (const g of galleries || []) {
      const [cp, ap] = await Promise.all([
        supabaseAdmin.from('ClientPhoto').select('id,url,uploadComment').eq('clientGalleryId', g.id).order('order', { ascending: true }),
        supabaseAdmin.from('ClientAuthorPhoto').select('id,url,authorComment').eq('clientGalleryId', g.id).order('order', { ascending: true })
      ])
      photosByGallery[g.id] = {
        client: (cp.data as any) || [],
        author: (ap.data as any) || []
      }
    }

    const result = {
      galleries: (galleries || []).map((g: any) => ({ ...g, ownerEmail: emailsById[g.clientUserId] || null })),
      photosByGallery
    }
    return new Response(JSON.stringify(result), { status: 200, headers: { 'content-type': 'application/json' } })
  } catch (e: any) {
    return new Response(JSON.stringify({ message: e.message || 'Server error', stack: e.stack }), { status: 500, headers: { 'content-type': 'application/json' } })
  }
}


