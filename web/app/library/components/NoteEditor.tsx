'use client'

import { useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { addItem } from '@/app/actions/items'

type SavedItem = {
  id: string
  title: string
  image_url: null
  type: 'note'
  status: null
  metadata: Record<string, unknown>
  collection_id: null
  created_at: string
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

function ToolbarButton({
  onClick,
  active,
  children,
}: {
  onClick: () => void
  active?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onMouseDown={e => { e.preventDefault(); onClick() }}
      className={`px-2 py-1 rounded font-mono text-[10px] transition ${
        active
          ? 'bg-stone-900 text-white'
          : 'text-stone-500 hover:bg-stone-100 hover:text-stone-900'
      }`}
    >
      {children}
    </button>
  )
}

export default function NoteEditor({
  username,
  onSave,
  onClose,
}: {
  username: string
  onSave: (item: SavedItem) => void
  onClose: () => void
}) {
  const [title, setTitle] = useState('')
  const [fullscreen, setFullscreen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: 'Start writing…' }),
    ],
    editorProps: {
      attributes: {
        class: 'note-editor-content outline-none min-h-[160px]',
      },
    },
  })

  async function handleSave() {
    if (!title.trim() || !editor) return
    const content = editor.getHTML()
    const excerpt = stripHtml(content).slice(0, 200)
    setSaving(true)
    setError('')
    const res = await addItem({
      type: 'note',
      title: title.trim(),
      image_url: null,
      external_id: `note-${Date.now()}`,
      status: null,
      metadata: { content, excerpt },
      username,
    })
    if (res?.error) {
      setError(res.error)
      setSaving(false)
      return
    }
    onSave({
      id: res.itemId!,
      title: title.trim(),
      image_url: null,
      type: 'note',
      status: null,
      metadata: { content, excerpt },
      collection_id: null,
      created_at: new Date().toISOString(),
    })
    setSaving(false)
  }

  const containerClass = fullscreen
    ? 'fixed inset-0 z-50 flex items-stretch justify-center bg-white'
    : 'fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4'

  const panelClass = fullscreen
    ? 'relative w-full h-full flex flex-col bg-white p-8 sm:p-16'
    : 'relative w-full sm:max-w-2xl bg-white rounded-t-3xl sm:rounded-2xl shadow-xl border border-[#e0ddd8] flex flex-col max-h-[90vh]'

  return (
    <>
      <style>{`
        .note-editor-content p { margin-bottom: 0.75em; }
        .note-editor-content h1 { font-family: var(--font-cormorant); font-size: 1.75rem; font-weight: 600; color: #1c1917; margin-bottom: 0.5em; line-height: 1.2; }
        .note-editor-content h2 { font-family: var(--font-cormorant); font-size: 1.35rem; font-weight: 600; color: #1c1917; margin-bottom: 0.5em; line-height: 1.3; }
        .note-editor-content ul { list-style-type: disc; padding-left: 1.4em; margin-bottom: 0.75em; }
        .note-editor-content ol { list-style-type: decimal; padding-left: 1.4em; margin-bottom: 0.75em; }
        .note-editor-content li { margin-bottom: 0.25em; }
        .note-editor-content strong { font-weight: 600; }
        .note-editor-content em { font-style: italic; }
        .note-editor-content p.is-editor-empty:first-child::before { content: attr(data-placeholder); color: #d6d3d1; pointer-events: none; float: left; height: 0; }
      `}</style>

      <div className={containerClass}>
        {!fullscreen && <div className="absolute inset-0 bg-black/20" onClick={onClose} />}

        <div className={panelClass}>
          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-5 pb-3 shrink-0">
            <h2 className="font-serif text-xl font-semibold text-stone-900">New note</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setFullscreen(f => !f)}
                className="font-mono text-[10px] text-stone-400 hover:text-stone-700 transition px-2 py-1 rounded hover:bg-stone-100"
              >
                {fullscreen ? 'Exit fullscreen' : 'Fullscreen'}
              </button>
              <button onClick={onClose} className="font-mono text-xs text-stone-400 hover:text-stone-600">Close</button>
            </div>
          </div>

          {/* Title */}
          <div className="px-6 pb-3 shrink-0">
            <input
              autoFocus
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Title"
              className="w-full font-serif text-2xl font-semibold text-stone-900 placeholder:text-stone-300 focus:outline-none bg-transparent"
            />
          </div>

          {/* Toolbar */}
          <div className="flex items-center gap-0.5 px-5 py-2 border-y border-stone-100 shrink-0">
            <ToolbarButton onClick={() => editor?.chain().focus().toggleBold().run()} active={editor?.isActive('bold')}>B</ToolbarButton>
            <ToolbarButton onClick={() => editor?.chain().focus().toggleItalic().run()} active={editor?.isActive('italic')}><em>I</em></ToolbarButton>
            <span className="w-px h-4 bg-stone-200 mx-1" />
            <ToolbarButton onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()} active={editor?.isActive('heading', { level: 1 })}>H1</ToolbarButton>
            <ToolbarButton onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()} active={editor?.isActive('heading', { level: 2 })}>H2</ToolbarButton>
            <span className="w-px h-4 bg-stone-200 mx-1" />
            <ToolbarButton onClick={() => editor?.chain().focus().toggleBulletList().run()} active={editor?.isActive('bulletList')}>• List</ToolbarButton>
            <ToolbarButton onClick={() => editor?.chain().focus().toggleOrderedList().run()} active={editor?.isActive('orderedList')}>1. List</ToolbarButton>
          </div>

          {/* Editor */}
          <div className="flex-1 overflow-y-auto px-6 py-4 font-serif text-base text-stone-800">
            <EditorContent editor={editor} />
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-stone-100 flex items-center justify-between shrink-0">
            {error
              ? <p className="font-mono text-xs text-red-500">{error}</p>
              : <span />
            }
            <button
              onClick={handleSave}
              disabled={saving || !title.trim()}
              className="rounded-xl bg-stone-900 px-5 py-2.5 font-mono text-xs text-white hover:bg-stone-700 disabled:opacity-40 transition"
            >
              {saving ? 'Saving…' : 'Save note'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
