'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import TextAlign from '@tiptap/extension-text-align'
import Image from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
// Списки идут из StarterKit; отдельные расширения не подключаем, чтобы избежать дублей
// Подсветку кода временно отключаем, оставляем стандартный CodeBlock из StarterKit
import Table from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableHeader from '@tiptap/extension-table-header'
import TableCell from '@tiptap/extension-table-cell'

type Props = {
  name: string
  defaultHtml?: string
  placeholder?: string
}

export default function RichEditor({ name, defaultHtml = '', placeholder }: Props) {
  const [html, setHtml] = useState<string>(defaultHtml)
  const hiddenRef = useRef<HTMLInputElement>(null)
  const editor = useEditor({
    content: defaultHtml,
    extensions: [
      // Базовые возможности
      StarterKit,
      Underline,
      Link.configure({
        openOnClick: true,
        autolink: true,
        linkOnPaste: true,
        validate: (href) => /^https?:\/\//i.test(href) || href.startsWith('/') || href.startsWith('mailto:') || href.startsWith('tel:'),
      }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Image.configure({
        inline: false,
        allowBase64: false,
        HTMLAttributes: { loading: 'lazy', style: 'display:block;max-width:100%;width:100%;height:auto;' },
      }),
      Placeholder.configure({ placeholder: placeholder || 'Введите текст…' }),
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    // во избежание SSR-гидрации с несовпадением DOM
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'prose max-w-none p-3 min-h-[220px] max-h-[65vh] overflow-y-auto border rounded focus:outline-none',
        'data-gramm': 'false',
        'data-gramm_editor': 'false',
        'data-enable-grammarly': 'false',
        spellCheck: 'false',
        autoCorrect: 'off',
        autoCapitalize: 'off',
      },
    },
    onUpdate: ({ editor }) => {
      setHtml(editor.getHTML())
      // Сигнализируем форме об изменении (важно для активации Save при удалении символов)
      setTimeout(() => {
        hiddenRef.current?.dispatchEvent(new Event('input', { bubbles: true }))
      }, 0)
    },
  })

  useEffect(() => {
    setHtml(editor?.getHTML() || defaultHtml)
  }, [editor, defaultHtml])

  const onImageUpload = useCallback(async () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return
      // 1) Получаем подписанный URL для прямой загрузки в Supabase Storage
      // Опциональный префикс для структурирования: lectures/, news/, clients/<userId>/, etc.
      let dynPrefix = ''
      if (typeof (window as any).__uploadPrefix === 'function') dynPrefix = (window as any).__uploadPrefix()
      else if (typeof (window as any).__uploadPrefix === 'string') dynPrefix = (window as any).__uploadPrefix
      const params = new URLSearchParams(dynPrefix ? { prefix: dynPrefix } : {})
      const metaRes = await fetch('/api/storage/signed-upload' + (params.toString() ? `?${params.toString()}` : ''), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: (file as any).name || 'image' })
      })
      if (!metaRes.ok) return
      const meta = await metaRes.json()
      // 2) Загружаем файл напрямую по signed URL
      const uploadRes = await fetch(meta.signedUrl, {
        method: 'PUT',
        headers: { 'x-upsert': 'true', 'content-type': (file as any).type || 'application/octet-stream', 'authorization': `Bearer ${meta.token}` },
        body: file,
      }).catch(() => null)
      // SDK signed upload Url use case: нужно использовать fetch к https://.../object/sign/...?
      if (!uploadRes || !uploadRes.ok) {
        // fallback: наш старый API загрузки
        const form = new FormData()
        form.append('file', file)
        const upParams = params.toString() ? `?${params.toString()}` : ''
        const res = await fetch('/api/upload' + upParams, { method: 'POST', body: form })
        if (!res.ok) return
        const data = await res.json()
        editor?.chain().focus().setImage({ src: data.url }).run()
        return
      }
      // 3) Используем publicUrl из ответа метаданных
      const url = meta.publicUrl as string
      if (url) editor?.chain().focus().setImage({ src: url }).run()
    }
    input.click()
  }, [editor])

  const onSetLink = useCallback(() => {
    const prev = editor?.getAttributes('link').href as string | undefined
    const url = window.prompt('Ссылка (можно относительный путь /galleries):', prev || '')
    if (url === null) return
    if (url === '') editor?.chain().focus().unsetLink().run()
    else editor?.chain().focus().setLink({ href: url.trim() }).run()
  }, [editor])

  const onUnsetFormatting = useCallback(() => {
    editor?.chain().focus().unsetAllMarks().clearNodes().run()
  }, [editor])

  return (
    <div className="space-y-2">
      <input ref={hiddenRef} type="hidden" name={name} value={html} readOnly />
      <div className="flex flex-wrap gap-2 text-sm">
        <button type="button" title="Жирный" className="px-2 py-1 border rounded" onClick={() => editor?.chain().focus().toggleBold().run()}>B</button>
        <button type="button" title="Курсив" className="px-2 py-1 border rounded" onClick={() => editor?.chain().focus().toggleItalic().run()}><i>I</i></button>
        <button type="button" title="Подчёркнутый" className="px-2 py-1 border rounded" onClick={() => editor?.chain().focus().toggleUnderline().run()}><u>U</u></button>
        <button type="button" title="Зачёркнутый" className="px-2 py-1 border rounded" onClick={() => editor?.chain().focus().toggleStrike().run()}>S</button>
        <span className="w-px h-5 bg-slate-300" />
        <button type="button" title="Заголовок H1" className="px-2 py-1 border rounded" onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}>H1</button>
        <button type="button" title="Заголовок H2" className="px-2 py-1 border rounded" onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}>H2</button>
        <button type="button" title="Заголовок H3" className="px-2 py-1 border rounded" onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}>H3</button>
        <span className="w-px h-5 bg-slate-300" />
        <button type="button" title="Маркированный список" className="px-2 py-1 border rounded" onClick={() => editor?.chain().focus().toggleBulletList().run()}>•</button>
        <button type="button" title="Нумерованный список" className="px-2 py-1 border rounded" onClick={() => editor?.chain().focus().toggleOrderedList().run()}>1.</button>
        <span className="w-px h-5 bg-slate-300" />
        <button type="button" title="Выровнять по левому краю" className="px-2 py-1 border rounded" onClick={() => editor?.chain().focus().setTextAlign('left').run()}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="3" y1="6" x2="15" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="13" y2="18" />
          </svg>
        </button>
        <button type="button" title="Выровнять по центру" className="px-2 py-1 border rounded" onClick={() => editor?.chain().focus().setTextAlign('center').run()}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="5" y1="6" x2="19" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="7" y1="18" x2="17" y2="18" />
          </svg>
        </button>
        <button type="button" title="Выровнять по правому краю" className="px-2 py-1 border rounded" onClick={() => editor?.chain().focus().setTextAlign('right').run()}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="9" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="11" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <span className="w-px h-5 bg-slate-300" />
        <button type="button" title="Ссылка" className="px-2 py-1 border rounded" onClick={onSetLink}>🔗</button>
        <button type="button" title="Убрать ссылку" className="px-2 py-1 border rounded" onClick={() => editor?.chain().focus().unsetLink().run()}>🔗✖</button>
        <button type="button" title="Изображение" className="px-2 py-1 border rounded" onClick={onImageUpload}>🖼️</button>
        <button type="button" title="Цитата" className="px-2 py-1 border rounded" onClick={() => editor?.chain().focus().toggleBlockquote().run()}>❝</button>
        <button type="button" title="Горизонтальная линия" className="px-2 py-1 border rounded" onClick={() => editor?.chain().focus().setHorizontalRule().run()}>⎯⎯⎯</button>
        <span className="w-px h-5 bg-slate-300" />
        <button type="button" title="Кодовый блок" className="px-2 py-1 border rounded" onClick={() => editor?.chain().focus().toggleCodeBlock().run()}>{'<>'}</button>
        <button type="button" title="Таблица" className="px-2 py-1 border rounded" onClick={() => editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}>▦</button>
        <button type="button" title="Добавить строку" className="px-2 py-1 border rounded" onClick={() => editor?.chain().focus().addRowAfter().run()}>＋R</button>
        <button type="button" title="Добавить колонку" className="px-2 py-1 border rounded" onClick={() => editor?.chain().focus().addColumnAfter().run()}>＋C</button>
        <button type="button" title="Удалить строку" className="px-2 py-1 border rounded" onClick={() => editor?.chain().focus().deleteRow().run()}>−R</button>
        <button type="button" title="Удалить колонку" className="px-2 py-1 border rounded" onClick={() => editor?.chain().focus().deleteColumn().run()}>−C</button>
        <button type="button" title="Удалить таблицу" className="px-2 py-1 border rounded" onClick={() => editor?.chain().focus().deleteTable().run()}>⌫▦</button>
        <span className="w-px h-5 bg-slate-300" />
        <button type="button" title="Отменить" className="px-2 py-1 border rounded" onClick={() => editor?.chain().focus().undo().run()}>↶</button>
        <button type="button" title="Повторить" className="px-2 py-1 border rounded" onClick={() => editor?.chain().focus().redo().run()}>↷</button>
        <button type="button" title="Очистить форматирование" className="px-2 py-1 border rounded" onClick={onUnsetFormatting}>✖</button>
      </div>
      <EditorContent editor={editor} />
    </div>
  )
}


