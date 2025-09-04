'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { TextSelection } from 'prosemirror-state'
import { useEditor, EditorContent } from '@tiptap/react'
import { Node, mergeAttributes } from '@tiptap/core'
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

// Типизация пользовательской команды video для TipTap
declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    video: {
      setVideo: (
        options: { src: string; poster?: string } & Partial<Record<'loop' | 'autoplay' | 'muted' | 'playsinline' | 'controls', boolean>>
      ) => ReturnType
    }
  }
}

// Простейшее расширение для встраивания MP4-видео
const Video = Node.create({
  name: 'video',
  group: 'block',
  atom: true,
  selectable: true,
  draggable: true,
  addAttributes() {
    return {
      src: { default: null },
      poster: { default: null },
      loop: { default: true },
      autoplay: { default: true },
      muted: { default: true },
      playsinline: { default: true },
      controls: { default: false },
      style: { default: 'display:block;max-width:100%;width:100%;height:auto;margin:0;' },
      preload: { default: 'metadata' },
    }
  },
  parseHTML() {
    return [
      { tag: 'video' },
    ]
  },
  renderHTML({ HTMLAttributes }) {
    const attrs: Record<string, any> = { ...HTMLAttributes }
    // Булевы атрибуты — указываем как пустые
    if (attrs.loop) attrs.loop = ''
    if (attrs.autoplay) attrs.autoplay = ''
    if (attrs.muted) attrs.muted = ''
    if (attrs.playsinline) attrs.playsinline = ''
    if (attrs.controls) attrs.controls = ''
    return ['video', mergeAttributes(attrs)]
  },
  addCommands() {
    return {
      setVideo:
        (options: { src: string; poster?: string } & Partial<Record<'loop' | 'autoplay' | 'muted' | 'playsinline' | 'controls', boolean>>) =>
        ({ commands }) => {
          return commands.insertContent({ type: this.name, attrs: options })
        },
    }
  },
})

export default function RichEditor({ name, defaultHtml = '', placeholder }: Props) {
  const [html, setHtml] = useState<string>(defaultHtml)
  const hiddenRef = useRef<HTMLInputElement>(null)
  const [showFind, setShowFind] = useState(false)
  const [findText, setFindText] = useState('')
  const [replaceText, setReplaceText] = useState('')
  const [matchCase, setMatchCase] = useState(false)
  const editor = useEditor({
    content: defaultHtml,
    extensions: [
      // Базовые возможности
      StarterKit,
      Video,
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

  const onVideoUpload = useCallback(async () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'video/mp4,video/*'
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return
      let dynPrefix = ''
      if (typeof (window as any).__uploadPrefix === 'function') dynPrefix = (window as any).__uploadPrefix()
      else if (typeof (window as any).__uploadPrefix === 'string') dynPrefix = (window as any).__uploadPrefix
      const params = new URLSearchParams(dynPrefix ? { prefix: dynPrefix } : {})
      const metaRes = await fetch('/api/storage/signed-upload' + (params.toString() ? `?${params.toString()}` : ''), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: (file as any).name || 'video.mp4' })
      })
      if (!metaRes.ok) return
      const meta = await metaRes.json()
      const uploadRes = await fetch(meta.signedUrl, {
        method: 'PUT',
        headers: { 'x-upsert': 'true', 'content-type': (file as any).type || 'application/octet-stream', 'authorization': `Bearer ${meta.token}` },
        body: file,
      }).catch(() => null)
      if (!uploadRes || !uploadRes.ok) {
        const form = new FormData()
        form.append('file', file)
        const upParams = params.toString() ? `?${params.toString()}` : ''
        const res = await fetch('/api/upload' + upParams, { method: 'POST', body: form })
        if (!res.ok) return
        const data = await res.json()
        editor?.chain().focus().setVideo({ src: data.url, loop: true, autoplay: true, muted: true, playsinline: true }).run()
        return
      }
      const url = meta.publicUrl as string
      if (url) editor?.chain().focus().setVideo({ src: url, loop: true, autoplay: true, muted: true, playsinline: true }).run()
    }
    input.click()
  }, [editor])

  const onVideoFromUrl = useCallback(() => {
    const url = window.prompt('MP4 URL (можно относительный путь):', '')
    if (!url) return
    const v = url.trim()
    if (!/^https?:\/\//i.test(v) && !v.startsWith('/')) return
    editor?.chain().focus().setVideo({ src: v, loop: true, autoplay: true, muted: true, playsinline: true }).run()
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

  const onCleanupBreaks = useCallback(() => {
    if (!editor) return
    // A) Удаляем подряд идущие пустые параграфы на уровне узлов документа
    const toDelete: Array<{ from: number; to: number }> = []
    let run: Array<{ from: number; to: number }> = []
    const flush = () => {
      if (run.length > 1) {
        // оставляем один пустой параграф, остальные удаляем
        for (let i = 1; i < run.length; i++) toDelete.push(run[i])
      }
      run = []
    }
    const isEmptyPara = (node: any) => (node?.type?.name === 'paragraph') && ((node.textContent || '').replace(/\u00A0/g, ' ').trim() === '')
    editor.state.doc.descendants((node: any, pos: number) => {
      if (node?.type?.name === 'paragraph') {
        if (isEmptyPara(node)) run.push({ from: pos, to: pos + node.nodeSize })
        else flush()
      } else if (node.isBlock) {
        flush()
      }
      return true
    })
    flush()
    if (toDelete.length > 0) {
      let tr = editor.state.tr
      for (let i = toDelete.length - 1; i >= 0; i--) tr = tr.deleteRange(toDelete[i].from, toDelete[i].to)
      editor.view.dispatch(tr)
    }
    // B) Схлопываем множественные <br> внутри параграфов через HTML-представление
    const htmlBefore = editor.getHTML()
    let html = htmlBefore
    html = html.replace(/(<br\s*\/?>(?:\s|&nbsp;)*){2,}/gi, '<br />')
    if (html !== htmlBefore) editor.commands.setContent(html, true)
  }, [editor])

  // Поиск всех вхождений (позиции в документе)
  const collectMatches = useCallback((query: string): Array<{ from: number; to: number }> => {
    const matches: Array<{ from: number; to: number }> = []
    if (!editor || !query) return matches
    const q = matchCase ? query : query.toLowerCase()
    const doc = editor.state.doc
    doc.descendants((node: any, pos: number) => {
      if (node.isText) {
        const src: string = node.text || ''
        const text = matchCase ? src : src.toLowerCase()
        let start = 0
        while (true) {
          const idx = text.indexOf(q, start)
          if (idx === -1) break
          const from = pos + idx
          const to = from + query.length
          matches.push({ from, to })
          start = idx + Math.max(1, query.length)
        }
      }
      return true
    })
    return matches
  }, [editor, matchCase])

  const findNext = useCallback(() => {
    if (!editor) return
    const query = findText
    if (!query) return
    const all = collectMatches(query)
    if (all.length === 0) return
    const after = editor.state.selection.to
    const next = all.find((m) => m.from >= after) || all[0]
    const tr = editor.state.tr.setSelection(TextSelection.create(editor.state.doc, next.from, next.to)).scrollIntoView()
    editor.view.dispatch(tr)
  }, [editor, findText, collectMatches])

  const replaceOne = useCallback(() => {
    if (!editor) return
    const query = findText
    if (!query) return
    const sel = editor.state.selection
    if (sel.empty) {
      findNext()
      return
    }
    const selected = editor.state.doc.textBetween(sel.from, sel.to, '\n', '\n')
    const ok = matchCase ? selected === query : selected.toLowerCase() === query.toLowerCase()
    if (!ok) {
      findNext()
      return
    }
    const tr = editor.state.tr.insertText(replaceText, sel.from, sel.to)
    editor.view.dispatch(tr)
    // Переходим к следующему вхождению
    setTimeout(findNext, 0)
  }, [editor, findText, replaceText, matchCase, findNext])

  const replaceAll = useCallback(() => {
    if (!editor) return
    const query = findText
    if (!query) return
    const all = collectMatches(query)
    if (all.length === 0) return
    let tr = editor.state.tr
    for (let i = all.length - 1; i >= 0; i--) {
      tr = tr.insertText(replaceText, all[i].from, all[i].to)
    }
    editor.view.dispatch(tr)
  }, [editor, findText, replaceText, collectMatches])

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
        <button type="button" title="Найти / заменить" className="px-2 py-1 border rounded" onClick={() => setShowFind((v) => !v)}>🔎⇄</button>
        <button type="button" title="Ссылка" className="px-2 py-1 border rounded" onClick={onSetLink}>🔗</button>
        <button type="button" title="Убрать ссылку" className="px-2 py-1 border rounded" onClick={() => editor?.chain().focus().unsetLink().run()}>🔗✖</button>
        <button type="button" title="Изображение" className="px-2 py-1 border rounded" onClick={onImageUpload}>🖼️</button>
        <button type="button" title="Видео (файл)" className="px-2 py-1 border rounded" onClick={onVideoUpload}>🎬</button>
        <button type="button" title="Видео по URL" className="px-2 py-1 border rounded" onClick={onVideoFromUrl}>▶</button>
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
        <button type="button" title="Убрать лишние переносы строк" className="px-2 py-1 border rounded" onClick={onCleanupBreaks}>🧹</button>
        <button type="button" title="Очистить форматирование" className="px-2 py-1 border rounded" onClick={onUnsetFormatting}>✖</button>
      </div>
      {showFind && (
        <div className="flex flex-wrap items-center gap-2 text-sm p-2 border rounded bg-slate-50">
          <input
            className="border rounded p-1"
            placeholder="Найти..."
            value={findText}
            onChange={(e) => setFindText(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); findNext() } }}
          />
          <input
            className="border rounded p-1"
            placeholder="Заменить на..."
            value={replaceText}
            onChange={(e) => setReplaceText(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); replaceOne() } }}
          />
          <label className="flex items-center gap-1 ml-2"><input type="checkbox" checked={matchCase} onChange={(e) => setMatchCase(e.target.checked)} />Регистр</label>
          <span className="w-px h-5 bg-slate-300" />
          <button type="button" className="px-2 py-1 border rounded" onClick={findNext}>Найти</button>
          <button type="button" className="px-2 py-1 border rounded" onClick={replaceOne}>Заменить</button>
          <button type="button" className="px-2 py-1 border rounded" onClick={replaceAll}>Заменить все</button>
          <button type="button" className="px-2 py-1 border rounded" onClick={() => setShowFind(false)}>×</button>
        </div>
      )}
      <EditorContent editor={editor} />
    </div>
  )
}


