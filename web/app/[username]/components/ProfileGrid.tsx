'use client'

import { useState, useTransition } from 'react'
import { removeWidget } from '@/app/actions/widgets'
import { BookCard1x1, BookCard1x2, BookCard2x1 } from './cards/BookCard'
import { MovieCard1x1, MovieCard2x1 } from './cards/MovieCard'
import { MusicCard1x1, MusicCard2x1 } from './cards/MusicCard'
import AddWidgetSheet from './AddWidgetSheet'

// ─── Types ────────────────────────────────────────────────────────────────────

type Item = {
  id: string
  title: string | null
  image_url: string | null
  type: string
  status: string | null
  metadata: Record<string, unknown>
}

type Collection = {
  id: string
  name: string
  type: string
  description: string | null
}

type Widget = {
  id: string
  widget_size: string
  widget_title: string | null
  item: Item | null
  collection: Collection | null
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SIZE_CLASSES: Record<string, string> = {
  '1x1': 'col-span-1 row-span-1',
  '1x2': 'col-span-1 row-span-2',
  '2x1': 'col-span-2 row-span-1',
}

const COLLECTION_TYPE_LABELS: Record<string, string> = {
  favorites: 'Favorites',
  collection: 'Collection',
  log: 'Log',
  blog: 'Blog',
}

// ─── Card content renderers ───────────────────────────────────────────────────

function renderItemContent(item: Item, size: '1x1' | '1x2' | '2x1') {
  if (item.type === 'book') {
    if (size === '1x1') return <BookCard1x1 item={item} />
    if (size === '1x2') return <BookCard1x2 item={item} />
    if (size === '2x1') return <BookCard2x1 item={item} />
  }
  if (item.type === 'movie') {
    if (size === '1x1') return <MovieCard1x1 item={item} />
    if (size === '2x1') return <MovieCard2x1 item={item} />
  }
  if (item.type === 'music') {
    if (size === '1x1') return <MusicCard1x1 item={item} />
    if (size === '2x1') return <MusicCard2x1 item={item} />
  }
  return (
    <div className="flex flex-col justify-end h-full">
      <p className="font-serif text-sm font-medium text-stone-900 line-clamp-2">{item.title}</p>
      <p className="font-mono text-[9px] text-stone-400 uppercase tracking-wider mt-0.5">{item.type}</p>
    </div>
  )
}

function renderCollectionContent(col: Collection) {
  return (
    <div className="flex flex-col justify-end h-full p-4">
      <p className="font-mono text-[9px] text-stone-400 uppercase tracking-wider mb-1">
        {COLLECTION_TYPE_LABELS[col.type] ?? col.type}
      </p>
      <p className="font-serif text-base font-semibold text-stone-900 leading-snug">{col.name}</p>
      {col.description && (
        <p className="font-mono text-[9px] text-stone-400 mt-0.5 line-clamp-1">{col.description}</p>
      )}
    </div>
  )
}

// ─── Widget card ──────────────────────────────────────────────────────────────

function WidgetCard({
  widget,
  editMode,
  onRemove,
  removing,
}: {
  widget: Widget
  editMode: boolean
  onRemove: () => void
  removing: boolean
}) {
  const sizeClass = SIZE_CLASSES[widget.widget_size] ?? 'col-span-1 row-span-1'
  const size = (widget.widget_size as '1x1' | '1x2' | '2x1') || '1x1'

  return (
    <div
      className={`${sizeClass} group relative bg-white rounded-[14px] border border-[#e0ddd8] overflow-hidden transition ${
        editMode ? 'ring-2 ring-stone-200' : ''
      }`}
    >
      {/* Optional widget title override */}
      {widget.widget_title && (
        <p className="relative z-10 font-mono text-[9px] text-stone-400 uppercase tracking-wider p-4 pb-0 truncate">
          {widget.widget_title}
        </p>
      )}

      {/* Content — fills the full card, templates handle their own padding */}
      <div className="absolute inset-0">
        {widget.item
          ? renderItemContent(widget.item, size)
          : widget.collection
          ? renderCollectionContent(widget.collection)
          : null}
      </div>

      {/* Remove button (edit mode) */}
      {editMode && (
        <button
          onClick={onRemove}
          disabled={removing}
          className="absolute top-2 right-2 z-10 w-6 h-6 rounded-full bg-white border border-red-100 flex items-center justify-center text-red-400 hover:bg-red-50 shadow-sm transition text-xs disabled:opacity-40"
        >
          {removing ? '…' : '×'}
        </button>
      )}
    </div>
  )
}

// ─── Profile grid ─────────────────────────────────────────────────────────────

export default function ProfileGrid({
  widgets,
  username,
  isOwner,
  collections,
  items,
}: {
  widgets: Widget[]
  username: string
  isOwner: boolean
  collections: { id: string; name: string; type: string }[]
  items: { id: string; title: string | null; type: string; image_url: string | null; status: string | null }[]
}) {
  const [editMode, setEditMode] = useState(false)
  const [showAddSheet, setShowAddSheet] = useState(false)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  function handleRemove(widgetId: string) {
    setRemovingId(widgetId)
    startTransition(async () => {
      await removeWidget(widgetId, username)
      setRemovingId(null)
    })
  }

  if (widgets.length === 0 && !editMode) {
    return (
      <div className="text-center py-24">
        {isOwner ? (
          <div>
            <p className="font-serif text-lg text-stone-400 mb-3">Your profile is empty.</p>
            <p className="font-mono text-xs text-stone-400">
              Add things to your{' '}
              <a href="/library" className="underline underline-offset-2 hover:text-stone-600">library</a>
              {' '}then pin them here.
            </p>
          </div>
        ) : (
          <p className="font-serif text-lg text-stone-400">Nothing here yet.</p>
        )}
      </div>
    )
  }

  return (
    <>
      {/* Edit mode toggle — owner only */}
      {isOwner && (
        <div className="flex justify-end mb-4">
          <button
            onClick={() => { setEditMode(e => !e); setShowAddSheet(false) }}
            className={`rounded-xl px-4 py-2 font-mono text-xs transition border ${
              editMode
                ? 'bg-stone-900 text-white border-stone-900'
                : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50 shadow-sm'
            }`}
          >
            {editMode ? 'Done' : 'Edit profile'}
          </button>
        </div>
      )}

      <div className="grid grid-cols-4 gap-3 auto-rows-[235px]">
        {widgets.map(widget => (
          <WidgetCard
            key={widget.id}
            widget={widget}
            editMode={editMode}
            onRemove={() => handleRemove(widget.id)}
            removing={removingId === widget.id}
          />
        ))}

        {/* "+" add tile — visible in edit mode */}
        {editMode && isOwner && (
          <button
            onClick={() => setShowAddSheet(true)}
            className="col-span-1 row-span-1 rounded-[14px] border-2 border-dashed border-stone-200 flex items-center justify-center text-stone-300 hover:border-stone-400 hover:text-stone-400 transition bg-transparent"
          >
            <span className="font-mono text-2xl leading-none">+</span>
          </button>
        )}
      </div>

      {/* AddWidgetSheet — controlled from the "+" tile */}
      {isOwner && (
        <AddWidgetSheet
          collections={collections}
          items={items}
          username={username}
          externalOpen={showAddSheet}
          onExternalClose={() => setShowAddSheet(false)}
        />
      )}
    </>
  )
}
