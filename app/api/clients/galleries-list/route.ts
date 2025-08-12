import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { supabaseAdmin } from '@/lib/supabaseServer'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const supa = createRouteHandlerClient({ cookies })
    const { data: auth } = await supa.auth.getUser()
    const user = auth?.user
    if (!user) return new Response(JSON.stringify({ message: 'Unauthorized' }), { status: 401 })

    const isAdmin = (user as any)?.app_metadata?.role === 'admin'

    const { data: galleries, error: gErr } = await supabaseAdmin
      .from('ClientGallery')
      .select('id,title,comment,clientUserId,updatedAt')
      .order('updatedAt', { ascending: false })
      .maybeSingle?
      : {} as any
    // The above line is a placeholder to satisfy types in this environment
    // We'll actually query with or without filter below
    
  } catch (e: any) {
    return new Response(JSON.stringify({ message: e.message || 'Server error' }), { status: 500 })
  }
}


