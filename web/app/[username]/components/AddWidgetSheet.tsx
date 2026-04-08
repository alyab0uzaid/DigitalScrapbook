'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { addWidget } from '@/app/actions/widgets'
import { BookCard1x1, BookCard1x2, BookCard2x1 } from './cards/BookCard'
import { MovieCard1x1, MovieCard2x1 } from './cards/MovieCard'
import { MusicCard1x1, MusicCard2x1 } from './cards/MusicCard'
import { PhotoCard } from './cards/PhotoCard'
import { LinkCard1x1, LinkCard2x1 } from './cards/LinkCard'
import { NoteCard1x1, NoteCard1x2, NoteCard2x1 } from './cards/NoteCard'
import { ItemCard1x1, ItemCard2x1 } from './cards/ItemCard'
import { ContentTypeCard1x1, ContentTypeCard1x2, ContentTypeCard2x1 } from './cards/ContentTypeCard'
import { CollectionCard1x1, CollectionCard2x1 } from './cards/CollectionCard'

type Collection = {
  id: string
  name: string
  type: string
}

type Item = {
  id: string
  title: string | null
  type: string
  image_url: string | null
  status: string | null
  metadata?: Record<string, unknown> | null
}

type WidgetSize = '1x1' | '1x2' | '2x1' | '2x2'

const SIZE_OPTIONS: { value: WidgetSize }[] = [
  { value: '1x1' },
  { value: '2x1' },
  { value: '1x2' },
]

const CONTENT_TYPES: { type: string; label: string }[] = [
  { type: 'book',  label: 'Reads' },
  { type: 'movie', label: 'Flicks' },
  { type: 'music', label: 'Music' },
  { type: 'photo', label: 'Photos' },
  { type: 'link',  label: 'Links' },
  { type: 'note',  label: 'Notes' },
  { type: 'item',  label: 'Items' },
]

// ── Preview rendering ──────────────────────────────────────────────────────────
// We render cards at "full" grid size, then CSS-scale them down to fit
// a fixed-height container — so the preview looks exactly like the real widget.

const RENDER_W = 230   // base cell width (≈ desktop grid column)
const RENDER_H = 235   // base cell height (≈ desktop grid row)
const RENDER_GAP = 12  // gap between cells
const PREVIEW_H = 220  // fixed container height — never changes
const PREVIEW_MAX_W = 320 // max scale-to width

function renderDims(size: WidgetSize) {
  switch (size) {
    case '1x1': return { w: RENDER_W,                    h: RENDER_H }
    case '2x1': return { w: RENDER_W * 2 + RENDER_GAP,  h: RENDER_H }
    case '1x2': return { w: RENDER_W,                    h: RENDER_H * 2 + RENDER_GAP }
    case '2x2': return { w: RENDER_W * 2 + RENDER_GAP,  h: RENDER_H * 2 + RENDER_GAP }
  }
}

function getScale(size: WidgetSize) {
  const { w, h } = renderDims(size)
  return Math.min(PREVIEW_MAX_W / w, PREVIEW_H / h, 0.95)
}

// Actual card content — renders the same component as on the real profile
function PreviewCardContent({
  size,
  selectedType,
  selectedItem,
  selectedCollection,
  items,
  collections,
}: {
  size: WidgetSize
  selectedType: string | null
  selectedItem: string | null
  selectedCollection: string | null
  items: Item[]
  collections: Collection[]
}) {
  // Type-based widget (ContentTypeCard)
  if (selectedType) {
    const typeItems = items.filter(i => i.type === selectedType)
    if (size === '1x1') return <ContentTypeCard1x1 itemType={selectedType} items={typeItems} />
    if (size === '1x2') return <ContentTypeCard1x2 itemType={selectedType} items={typeItems} />
    return <ContentTypeCard2x1 itemType={selectedType} items={typeItems} />
  }

  // Single item widget
  if (selectedItem) {
    const raw = items.find(i => i.id === selectedItem)
    if (!raw) return null
    const item = { ...raw, metadata: (raw.metadata as Record<string, unknown>) ?? {} }

    if (item.type === 'book') {
      if (size === '1x1') return <BookCard1x1 item={item} />
      if (size === '1x2') return <BookCard1x2 item={item} />
      return <BookCard2x1 item={item} />
    }
    if (item.type === 'movie') {
      if (size === '2x1') return <MovieCard2x1 item={item} />
      return <MovieCard1x1 item={item} />
    }
    if (item.type === 'music') {
      if (size === '2x1') return <MusicCard2x1 item={item} />
      return <MusicCard1x1 item={item} />
    }
    if (item.type === 'photo') return <PhotoCard item={item} />
    if (item.type === 'link') {
      if (size === '2x1') return <LinkCard2x1 item={item} />
      return <LinkCard1x1 item={item} />
    }
    if (item.type === 'note') {
      if (size === '1x1') return <NoteCard1x1 item={item} />
      if (size === '1x2') return <NoteCard1x2 item={item} />
      return <NoteCard2x1 item={item} />
    }
    if (item.type === 'item') {
      if (size === '2x1') return <ItemCard2x1 item={item} />
      return <ItemCard1x1 item={item} />
    }
    // Generic fallback
    return (
      <div className="absolute inset-0 flex flex-col justify-end p-4">
        <p className="font-serif text-sm font-medium text-stone-900 line-clamp-2">{item.title}</p>
        <p className="font-mono text-[9px] text-stone-400 uppercase tracking-wider mt-0.5">{item.type}</p>
      </div>
    )
  }

  // Collection widget
  if (selectedCollection) {
    const col = collections.find(c => c.id === selectedCollection)
    if (!col) return null
    const fullCol = { ...col, description: null, collection_items: [] }
    if (size === '2x1') return <CollectionCard2x1 collection={fullCol} />
    return <CollectionCard1x1 collection={fullCol} />
  }

  // Empty state skeleton
  return (
    <div className="absolute inset-0 flex flex-col justify-between p-5">
      <div className="w-2/5 h-2 rounded-full bg-stone-200" />
      <div className="space-y-2">
        <div className="w-3/4 h-2.5 rounded-full bg-stone-200" />
        <div className="w-1/2 h-2 rounded-full bg-stone-200" />
      </div>
    </div>
  )
}

// Fixed-size container with CSS-scaled card inside
function ScaledPreview({
  size,
  children,
}: {
  size: WidgetSize
  children: React.ReactNode
}) {
  const { w, h } = renderDims(size)
  const scale = getScale(size)
  const scaledW = Math.round(w * scale)
  const scaledH = Math.round(h * scale)

  return (
    // Outer: occupies scaled visual dimensions in layout
    <div style={{ width: scaledW, height: scaledH, position: 'relative', flexShrink: 0 }}>
      {/* Inner: full render size, scaled via transform-origin top-left */}
      <div
        style={{
          width: w,
          height: h,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          position: 'absolute',
          top: 0,
          left: 0,
        }}
        className="rounded-xl overflow-hidden bg-stone-50 shadow-md"
      >
        {children}
      </div>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function AddWidgetSheet({
  collections,
  items,
  username,
  externalOpen,
  onExternalClose,
}: {
  collections: Collection[]
  items: Item[]
  username: string
  externalOpen?: boolean
  onExternalClose?: () => void
}) {
  const controlled = externalOpen !== undefined
  const [internalOpen, setInternalOpen] = useState(false)
  const open = controlled ? externalOpen : internalOpen

  const [tab, setTab] = useState<'types' | 'collections' | 'items'>('types')
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null)
  const [selectedItem, setSelectedItem] = useState<string | null>(null)
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [size, setSize] = useState<WidgetSize>('1x1')
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleOpen() {
    setSelectedCollection(null)
    setSelectedItem(null)
    setSelectedType(null)
    setSize('1x1')
    setError('')
    if (!controlled) setInternalOpen(true)
  }

  function handleClose() {
    if (controlled) onExternalClose?.()
    else setInternalOpen(false)
  }

  function handleTabChange(t: typeof tab) {
    setTab(t)
    setSelectedCollection(null)
    setSelectedItem(null)
    setSelectedType(null)
  }

  function handleAdd() {
    if (!selectedCollection && !selectedItem && !selectedType) return
    setError('')
    startTransition(async () => {
      const result = await addWidget({
        collectionId: selectedCollection,
        itemId: selectedItem,
        itemType: selectedType,
        widgetSize: size,
        username,
      })
      if (result?.error) setError(result.error)
      else { handleClose(); router.refresh() }
    })
  }

  const hasSelection = selectedCollection || selectedItem || selectedType

  const availableTypes = CONTENT_TYPES.filter(ct =>
    items.some(i => i.type === ct.type)
  )

  const availableSizes = SIZE_OPTIONS.filter(s => {
    if (selectedType) {
      if (selectedType === 'photo') return true
      if (selectedType === 'note') return s.value !== '2x2'
      return s.value === '1x1' || s.value === '2x1' || s.value === '1x2'
    }
    if (selectedItem) {
      const itemType = items.find(i => i.id === selectedItem)?.type
      if (itemType === 'photo') return true
      if (itemType === 'link') return s.value === '1x1' || s.value === '2x1'
      if (itemType === 'note') return s.value !== '2x2'
      if (itemType === 'item') return s.value === '1x1' || s.value === '2x1'
      if (itemType === 'book' || itemType === 'movie' || itemType === 'music') {
        return s.value !== '1x2' && s.value !== '2x2'
      }
      return s.value !== '2x2'
    }
    if (selectedCollection) {
      const colType = collections.find(c => c.id === selectedCollection)?.type
      if (colType === 'map') return s.value === '2x1' || s.value === '2x2'
      return s.value !== '2x2'
    }
    return s.value !== '2x2'
  })

  function selectAndResetSize(fn: () => void) {
    fn()
    setSize('1x1')
  }

  const validSize = availableSizes.find(s => s.value === size)?.value ?? availableSizes[0]?.value ?? '1x1'

  return (
    <>
      {!controlled && (
        <button
          onClick={handleOpen}
          className="flex items-center gap-1.5 rounded-xl bg-stone-900 px-4 py-2 font-mono text-xs text-white hover:bg-stone-700 transition"
        >
          + Add to profile
        </button>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-black/20" onClick={handleClose} />
          <div className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl shadow-xl border border-[#e0ddd8] pb-8 overflow-hidden">

            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-6 mb-5">
              <h2 className="font-serif text-xl font-semibold text-stone-900">Add to profile</h2>
              <button onClick={handleClose} className="font-mono text-xs text-stone-400 hover:text-stone-600">Close</button>
            </div>

            {/* ── Live widget preview — always fixed height ── */}
            <div className="px-6 mb-5">
              <div
                className="flex flex-col items-center justify-center gap-3 py-4 bg-stone-50 rounded-2xl"
                style={{ minHeight: PREVIEW_H + 52 }}
              >
                {/* Fixed-height centering row */}
                <div
                  className="flex items-center justify-center"
                  style={{ height: PREVIEW_H, width: '100%' }}
                >
                  <ScaledPreview size={validSize}>
                    <PreviewCardContent
                      size={validSize}
                      selectedType={selectedType}
                      selectedItem={selectedItem}
                      selectedCollection={selectedCollection}
                      items={items}
                      collections={collections}
                    />
                  </ScaledPreview>
                </div>

                {/* Size pills */}
                <div className="flex items-center gap-1.5">
                  {availableSizes.map(s => (
                    <button
                      key={s.value}
                      onClick={() => setSize(s.value)}
                      className={`transition-all font-mono text-[9px] px-2.5 py-1 rounded-full ${
                        validSize === s.value
                          ? 'bg-stone-900 text-white'
                          : 'bg-white border border-stone-200 text-stone-500 hover:border-stone-300'
                      }`}
                    >
                      {s.value}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mx-6 mb-4 bg-stone-100 rounded-lg p-1">
              {(['types', 'collections', 'items'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => handleTabChange(t)}
                  className={`flex-1 py-1.5 rounded-md font-mono text-xs transition capitalize ${tab === t ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500'}`}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Types tab */}
            {tab === 'types' && (
              <div className="flex flex-col gap-2 max-h-44 overflow-y-auto px-6 mb-5">
                {availableTypes.length === 0 && (
                  <p className="font-mono text-xs text-stone-400 text-center py-6">No items in your library yet.</p>
                )}
                {availableTypes.map(ct => {
                  const count = items.filter(i => i.type === ct.type).length
                  return (
                    <button
                      key={ct.type}
                      onClick={() => selectAndResetSize(() => setSelectedType(ct.type === selectedType ? null : ct.type))}
                      className={`flex items-center gap-3 rounded-xl border p-3 text-left transition ${selectedType === ct.type ? 'border-stone-900 bg-stone-50' : 'border-stone-100 hover:border-stone-200'}`}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-serif text-sm font-medium text-stone-900">{ct.label}</p>
                        <p className="font-mono text-[9px] text-stone-400 mt-0.5">{count} items</p>
                      </div>
                      {selectedType === ct.type && <span className="font-mono text-xs text-stone-900">✓</span>}
                    </button>
                  )
                })}
              </div>
            )}

            {/* Collections tab */}
            {tab === 'collections' && (
              <div className="flex flex-col gap-2 max-h-44 overflow-y-auto px-6 mb-5">
                {collections.length === 0 && (
                  <p className="font-mono text-xs text-stone-400 text-center py-6">No collections yet.</p>
                )}
                {collections.map(c => (
                  <button
                    key={c.id}
                    onClick={() => selectAndResetSize(() => setSelectedCollection(c.id === selectedCollection ? null : c.id))}
                    className={`flex items-center gap-3 rounded-xl border p-3 text-left transition ${selectedCollection === c.id ? 'border-stone-900 bg-stone-50' : 'border-stone-100 hover:border-stone-200'}`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-serif text-sm font-medium text-stone-900 truncate">{c.name}</p>
                      <p className="font-mono text-[9px] text-stone-400 uppercase tracking-wide mt-0.5">{c.type}</p>
                    </div>
                    {selectedCollection === c.id && <span className="font-mono text-xs text-stone-900">✓</span>}
                  </button>
                ))}
              </div>
            )}

            {/* Items tab */}
            {tab === 'items' && (
              <div className="flex flex-col gap-2 max-h-44 overflow-y-auto px-6 mb-5">
                {items.filter(item => item.type !== 'place').length === 0 && (
                  <p className="font-mono text-xs text-stone-400 text-center py-6">No items yet.</p>
                )}
                {items.filter(item => item.type !== 'place').map(item => (
                  <button
                    key={item.id}
                    onClick={() => selectAndResetSize(() => setSelectedItem(item.id === selectedItem ? null : item.id))}
                    className={`flex items-center gap-3 rounded-xl border p-3 text-left transition ${selectedItem === item.id ? 'border-stone-900 bg-stone-50' : 'border-stone-100 hover:border-stone-200'}`}
                  >
                    {item.image_url ? (
                      <Image src={item.image_url} alt={item.title ?? ''} width={28} height={42} className="rounded object-cover shrink-0" />
                    ) : (
                      <div className="w-7 h-10 rounded bg-stone-100 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-serif text-sm font-medium text-stone-900 truncate">{item.title}</p>
                      <p className="font-mono text-[9px] text-stone-400 uppercase tracking-wide mt-0.5">{item.type}</p>
                    </div>
                    {selectedItem === item.id && <span className="font-mono text-xs text-stone-900">✓</span>}
                  </button>
                ))}
              </div>
            )}

            {error && <p className="font-mono text-xs text-red-500 mx-6 mb-3">{error}</p>}

            <div className="px-6">
              <button
                onClick={handleAdd}
                disabled={!hasSelection || isPending}
                className="w-full rounded-xl bg-stone-900 px-4 py-3 font-mono text-xs text-white hover:bg-stone-700 disabled:opacity-40 transition"
              >
                {isPending ? 'Adding…' : 'Add to profile'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
