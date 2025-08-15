'use client'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useFormStatus } from 'react-dom'

type Props = {
  children?: string
  className?: string
}

function serializeForm(form: HTMLFormElement): string {
  const fd = new FormData(form)
  const entries: Array<[string, string]> = []
  for (const [k, v] of fd.entries()) {
    if (typeof v === 'string') entries.push([k, v])
    else entries.push([k, '[file]'])
  }
  entries.sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : a[1].localeCompare(b[1])))
  return JSON.stringify(entries)
}

export default function SaveButton({ children = 'Сохранить', className = '' }: Props) {
  const { pending } = useFormStatus()
  const btnRef = useRef<HTMLButtonElement>(null)
  const [dirty, setDirty] = useState(false)
  const initialSnapshotRef = useRef<string>('')
  const lastSubmittedRef = useRef<number>(0)

  const setInitialSnapshot = useCallback(() => {
    const form = btnRef.current?.closest('form') as HTMLFormElement | null
    if (!form) return
    initialSnapshotRef.current = serializeForm(form)
    setDirty(false)
  }, [])

  useEffect(() => {
    const form = btnRef.current?.closest('form') as HTMLFormElement | null
    if (!form) return
    // Инициализация снапшота по загрузке
    setInitialSnapshot()
    let raf = 0
    const onChange = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const current = serializeForm(form)
        setDirty(current !== initialSnapshotRef.current)
      })
    }
    form.addEventListener('input', onChange, { passive: true })
    form.addEventListener('change', onChange, { passive: true })
    form.addEventListener('submit', () => {
      lastSubmittedRef.current = Date.now()
    })
    return () => {
      cancelAnimationFrame(raf)
      form.removeEventListener('input', onChange)
      form.removeEventListener('change', onChange)
    }
  }, [setInitialSnapshot])

  // После завершения сабмита обновляем базовый снапшот
  const wasPending = useRef(false)
  useEffect(() => {
    if (pending) {
      wasPending.current = true
      return
    }
    if (wasPending.current) {
      wasPending.current = false
      // небольшой таймаут даёт форме применить новые defaultValue при редиректе или revalidate
      setTimeout(setInitialSnapshot, 50)
    }
  }, [pending, setInitialSnapshot])

  const disabled = useMemo(() => pending || !dirty, [pending, dirty])

  return (
    <button ref={btnRef} type="submit" disabled={disabled} className={className || 'bg-slate-900 text-white px-4 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed'}>
      {pending ? 'Сохранение…' : children}
    </button>
  )
}


