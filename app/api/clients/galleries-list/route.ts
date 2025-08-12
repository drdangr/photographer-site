import { supabaseAdmin } from '@/lib/supabaseServer'
import { getServerSession } from '@/lib/session'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const session = await getServerSession()
    const clientUserId = (session as any).clientUserId as number | undefined
    if (!clientUserId) {
      return new Response(JSON.stringify({ message: 'Unauthorized' }), { status: 401 })
    }

    const { data: galleries, error: gErr } = await supabaseAdmin
      .from('ClientGallery')
      .select('id,title,comment,clientUserId,updatedAt')
      .eq('clientUserId', clientUserId)
      .order('updatedAt', { ascending: false })
    if (gErr) throw gErr

    return new Response(JSON.stringify({ galleries }), {
      status: 200,
      headers: { 'content-type': 'application/json' }
    })
  } catch (e: any) {
    return new Response(JSON.stringify({ message: e.message || 'Server error' }), { status: 500 })
  }
}


