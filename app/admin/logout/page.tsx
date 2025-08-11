"use client"
import { useEffect } from 'react'

export default function LogoutPage() {
  useEffect(() => {
    fetch('/api/auth/logout', { method: 'POST' }).finally(() => {
      window.location.href = '/admin/login'
    })
  }, [])
  return <p>Выход…</p>
}


