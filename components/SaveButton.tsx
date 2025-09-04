'use client'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
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
  const router = useRouter()
  const { pending } = useFormStatus()
  const btnRef = useRef<HTMLButtonElement>(null)
  const [dirty, setDirty] = useState(false)
  const initialSnapshotRef = useRef<string>('')
  const lastSubmittedRef = useRef<number>(0)
  const ignoreChangesUntilTsRef = useRef<number>(0)
  const suspendDirtyRef = useRef<boolean>(false)

  const commitBaseline = useCallback(() => {
    const form = btnRef.current?.closest('form') as HTMLFormElement | null
    if (!form) return
    initialSnapshotRef.current = serializeForm(form)
    setDirty(false)
  }, [])

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
      // Игнорируем короткий всплеск событий изменений сразу после сохранения
      if (suspendDirtyRef.current) return
      if (Date.now() < ignoreChangesUntilTsRef.current) return
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
      // сразу после submit игнорируем изменения на более длительное время
      ignoreChangesUntilTsRef.current = Date.now() + 2200
    })
    const resume = () => { suspendDirtyRef.current = false }
    window.addEventListener('pointerdown', resume, { passive: true })
    window.addEventListener('keydown', resume, { passive: true })
    return () => {
      cancelAnimationFrame(raf)
      form.removeEventListener('input', onChange)
      form.removeEventListener('change', onChange)
      window.removeEventListener('pointerdown', resume)
      window.removeEventListener('keydown', resume)
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
      // и игнорируем события изменений в ближайшие ~2.2с (покрываем возможные перерисовки редактора)
      ignoreChangesUntilTsRef.current = Date.now() + 2200
      // до следующего пользовательского взаимодействия считаем форму «чистой»
      suspendDirtyRef.current = true
      // несколько последовательных фиксаций снимка формы, чтобы исключить ложные дельты
      setTimeout(commitBaseline, 50)
      setTimeout(commitBaseline, 600)
      setTimeout(commitBaseline, 1300)
      setTimeout(commitBaseline, 2100)
      // мягко обновим серверные компоненты, чтобы форма получила свежие данные
      try { router.refresh() } catch {}
    }
  }, [pending, commitBaseline, router])

  const disabled = useMemo(() => pending || !dirty, [pending, dirty])

  return (
    <button ref={btnRef} type="submit" disabled={disabled} className={className || 'bg-slate-900 text-white px-4 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed'}>
      {pending ? 'Сохранение…' : children}
    </button>
  )
}


