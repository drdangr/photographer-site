'use client'
import { useCallback, useEffect, useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import TextAlign from '@tiptap/extension-text-align'
import Image from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import BulletList from '@tiptap/extension-bullet-list'
import OrderedList from '@tiptap/extension-ordered-list'
import ListItem from '@tiptap/extension-list-item'
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
  const editor = useEditor({
    content: defaultHtml,
    extensions: [
      // Базовые возможности + списки
      StarterKit.configure({
        bulletList: true,
        orderedList: true,
      }),
      BulletList,
      OrderedList,
      ListItem,
      Underline,
      Link.configure({
        openOnClick: true,
        autolink: true,
        linkOnPaste: true,
        validate: (href) => /^https?:\/\//i.test(href) || href.startsWith('/') || href.startsWith('mailto:') || href.startsWith('tel:'),
      }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Image.configure({ inline: false, allowBase64: false }),
      Placeholder.configure({ placeholder: placeholder || 'Введите текст…' }),
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    editorProps: {
      attributes: {
        class: 'prose max-w-none p-3 min-h-[220px] border rounded focus:outline-none',
      },
    },
    onUpdate: ({ editor }) => {
      setHtml(editor.getHTML())
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
      const form = new FormData()
      form.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: form })
      if (!res.ok) return
      const data = await res.json()
      const url = data.url as string
      editor?.chain().focus().setImage({ src: url }).run()
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
      <input type="hidden" name={name} value={html} readOnly />
      <div className="flex flex-wrap gap-2 text-sm">
        <button type="button" className="px-2 py-1 border rounded" onClick={() => editor?.chain().focus().toggleBold().run()}>B</button>
        <button type="button" className="px-2 py-1 border rounded" onClick={() => editor?.chain().focus().toggleItalic().run()}><i>I</i></button>
        <button type="button" className="px-2 py-1 border rounded" onClick={() => editor?.chain().focus().toggleUnderline().run()}><u>U</u></button>
        <button type="button" className="px-2 py-1 border rounded" onClick={() => editor?.chain().focus().toggleStrike().run()}>S</button>
        <span className="w-px h-5 bg-slate-300" />
        <button type="button" className="px-2 py-1 border rounded" onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}>H1</button>
        <button type="button" className="px-2 py-1 border rounded" onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}>H2</button>
        <button type="button" className="px-2 py-1 border rounded" onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}>H3</button>
        <span className="w-px h-5 bg-slate-300" />
        <button type="button" className="px-2 py-1 border rounded" onClick={() => editor?.chain().focus().toggleBulletList().run()}>• Список</button>
        <button type="button" className="px-2 py-1 border rounded" onClick={() => editor?.chain().focus().toggleOrderedList().run()}>1. Список</button>
        <span className="w-px h-5 bg-slate-300" />
        <button type="button" className="px-2 py-1 border rounded" onClick={() => editor?.chain().focus().setTextAlign('left').run()}>Left</button>
        <button type="button" className="px-2 py-1 border rounded" onClick={() => editor?.chain().focus().setTextAlign('center').run()}>Center</button>
        <button type="button" className="px-2 py-1 border rounded" onClick={() => editor?.chain().focus().setTextAlign('right').run()}>Right</button>
        <span className="w-px h-5 bg-slate-300" />
        <button type="button" className="px-2 py-1 border rounded" onClick={onSetLink}>Link</button>
        <button type="button" className="px-2 py-1 border rounded" onClick={() => editor?.chain().focus().unsetLink().run()}>Unlink</button>
        <button type="button" className="px-2 py-1 border rounded" onClick={onImageUpload}>Image</button>
        <button type="button" className="px-2 py-1 border rounded" onClick={() => editor?.chain().focus().toggleBlockquote().run()}>Quote</button>
        <button type="button" className="px-2 py-1 border rounded" onClick={() => editor?.chain().focus().setHorizontalRule().run()}>HR</button>
        <span className="w-px h-5 bg-slate-300" />
        <button type="button" className="px-2 py-1 border rounded" onClick={() => editor?.chain().focus().toggleCodeBlock().run()}>Code</button>
        <button type="button" className="px-2 py-1 border rounded" onClick={() => editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}>Table</button>
        <button type="button" className="px-2 py-1 border rounded" onClick={() => editor?.chain().focus().addRowAfter().run()}>+Row</button>
        <button type="button" className="px-2 py-1 border rounded" onClick={() => editor?.chain().focus().addColumnAfter().run()}>+Col</button>
        <button type="button" className="px-2 py-1 border rounded" onClick={() => editor?.chain().focus().deleteRow().run()}>-Row</button>
        <button type="button" className="px-2 py-1 border rounded" onClick={() => editor?.chain().focus().deleteColumn().run()}>-Col</button>
        <button type="button" className="px-2 py-1 border rounded" onClick={() => editor?.chain().focus().deleteTable().run()}>DelTbl</button>
        <span className="w-px h-5 bg-slate-300" />
        <button type="button" className="px-2 py-1 border rounded" onClick={() => editor?.chain().focus().undo().run()}>Undo</button>
        <button type="button" className="px-2 py-1 border rounded" onClick={() => editor?.chain().focus().redo().run()}>Redo</button>
        <button type="button" className="px-2 py-1 border rounded" onClick={onUnsetFormatting}>Clear</button>
      </div>
      <EditorContent editor={editor} />
    </div>
  )
}


