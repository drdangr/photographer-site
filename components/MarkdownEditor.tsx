'use client'
import { useState, useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'
import rehypeRaw from 'rehype-raw'

type Props = {
  name: string
  defaultValue?: string
  label?: string
  placeholder?: string
}

export default function MarkdownEditor({ name, defaultValue = '', label, placeholder }: Props) {
  const [value, setValue] = useState<string>(defaultValue)

  const preview = useMemo(() => (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkBreaks]}
      rehypePlugins={[rehypeRaw]}
      components={{
        a: ({ node, ...props }) => <a {...props} target="_blank" rel="noopener noreferrer" />,
        img: ({ node, ...props }) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img {...props} alt={(props as any).alt || ''} className="max-w-full h-auto" />
        ),
      }}
    >
      {value || ''}
    </ReactMarkdown>
  ), [value])

  return (
    <div className="space-y-2">
      {label && <label className="block text-sm mb-1">{label}</label>}
      <textarea
        name={name}
        className="border rounded w-full p-2 h-40"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
      />
      <div className="text-sm text-slate-500">Предпросмотр</div>
      <div className="prose max-w-none border rounded p-3 bg-white">{preview}</div>
    </div>
  )
}


