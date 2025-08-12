'use client'
import { useEffect } from 'react'
import { getSupabaseBrowser } from '@/lib/supabaseBrowser'

export default function ClientLogoutPage() {
  useEffect(() => {
    const s = getSupabaseBrowser()
    s.auth.signOut().finally(() => {
      window.location.href = '/clients/login'
    })
  }, [])
  return <p>Выход…</p>
}


