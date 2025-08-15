'use client'
import { useCallback } from 'react'

type Props = {
  children?: React.ReactNode
  message?: string
  className?: string
}

export default function ConfirmButton({ children = 'Удалить', message = 'Точно удалить?', className = 'text-red-600' }: Props) {
  const onClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    if (!window.confirm(message)) {
      e.preventDefault()
      e.stopPropagation()
    }
  }, [message])

  return (
    <button className={className} onClick={onClick}>{children}</button>
  )
}


