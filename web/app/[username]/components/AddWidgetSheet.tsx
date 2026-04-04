'use client'

import { useState, useTransition } from 'react'
import Image from 'next/image'
import { addWidget } from '@/app/actions/widgets'

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
}

type WidgetSize = '1x1' | '1x2' | '2x1' | '2x2'

const SIZE_OPTIONS: { value: WidgetSize; label: string }[] = [
  { value: '1x1', label: '1×1' },
  { value: '2x1', label: '2×1' },
  { value: '1x2', label: '1×2' },
  { value: '2x2', label: '2×2' },
]

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

  const [tab, setTab] = useState<'collections' | 'items'>('collections')
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null)
  const [selectedItem, setSelectedItem] = useState<string | null>(null)
  const [size, setSize] = useState<WidgetSize>('1x1')
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleOpen() {
    setSelectedCollection(null)
    setSelectedItem(null)
    setSize('1x1')
    setError('')
    if (!controlled) setInternalOpen(true)
  }

  function handleClose() {
    if (controlled) onExternalClose?.()
    else setInternalOpen(false)
  }

  function handleAdd() {
    if (!selectedCollection && !selectedItem) return
    setError('')
    startTransition(async () => {
      const result = await addWidget({
        collectionId: selectedCollection,
        itemId: selectedItem,
        widgetSize: size,
        username,
      })
      if (result?.error) setError(result.error)
      else handleClose()
    })
  }

  const hasSelection = selectedCollection || selectedItem

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
          <div className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl shadow-xl border border-[#e0ddd8] p-6 pb-8">

            <div className="flex items-center justify-between mb-5">
              <h2 className="font-serif text-xl font-semibold text-stone-900">Add to profile</h2>
              <button onClick={handleClose} className="font-mono text-xs text-stone-400 hover:text-stone-600">Close</button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-5 bg-stone-100 rounded-lg p-1">
              {(['collections', 'items'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => { setTab(t); setSelectedCollection(null); setSelectedItem(null) }}
                  className={`flex-1 py-1.5 rounded-md font-mono text-xs transition capitalize ${tab === t ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500'}`}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Collections */}
            {tab === 'collections' && (
              <div className="flex flex-col gap-2 max-h-52 overflow-y-auto mb-5">
                {collections.length === 0 && (
                  <p className="font-mono text-xs text-stone-400 text-center py-6">No collections yet.</p>
                )}
                {collections.map(c => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCollection(c.id === selectedCollection ? null : c.id)}
                    className={`flex items-center gap-3 rounded-xl border p-3 text-left transition ${selectedCollection === c.id ? 'border-stone-900 bg-stone-50' : 'border-stone-100 hover:border-stone-200'}`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-serif text-sm font-medium text-stone-900 truncate">{c.name}</p>
                      <p className="font-mono text-[9px] text-stone-400 uppercase tracking-wide mt-0.5">{c.type}</p>
                    </div>
                    {selectedCollection === c.id && (
                      <span className="font-mono text-xs text-stone-900">✓</span>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Items */}
            {tab === 'items' && (
              <div className="flex flex-col gap-2 max-h-52 overflow-y-auto mb-5">
                {items.filter(item => item.type !== 'place').length === 0 && (
                  <p className="font-mono text-xs text-stone-400 text-center py-6">No items yet.</p>
                )}
                {items.filter(item => item.type !== 'place').map(item => (
                  <button
                    key={item.id}
                    onClick={() => setSelectedItem(item.id === selectedItem ? null : item.id)}
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
                    {selectedItem === item.id && (
                      <span className="font-mono text-xs text-stone-900">✓</span>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Size picker */}
            {hasSelection && (
              <div className="mb-5">
                <p className="font-mono text-xs text-stone-500 uppercase tracking-wider mb-2">Widget size</p>
                <div className="flex gap-2">
                  {SIZE_OPTIONS.filter(s => {
                    if (!selectedItem) {
                      const colType = collections.find(c => c.id === selectedCollection)?.type
                      if (colType === 'map') return s.value === '2x1' || s.value === '2x2'
                      return s.value !== '2x2' // other collections: no 2x2
                    }
                    const itemType = items.find(i => i.id === selectedItem)?.type
                    if (itemType === 'photo') return true
                    if (itemType === 'link') return s.value === '1x1' || s.value === '2x1'
                    if (itemType === 'note') return s.value !== '2x2'
                    if (itemType === 'item') return s.value === '1x1' || s.value === '2x1'
                    if (itemType === 'book' || itemType === 'movie' || itemType === 'music') {
                      return s.value !== '1x2' && s.value !== '2x2'
                    }
                    return s.value !== '2x2'
                  }).map(s => (
                    <button
                      key={s.value}
                      onClick={() => setSize(s.value)}
                      className={`flex-1 py-2.5 rounded-xl border font-mono text-xs transition ${size === s.value ? 'border-stone-900 bg-stone-50 text-stone-900' : 'border-stone-200 text-stone-500 hover:border-stone-300'}`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {error && <p className="font-mono text-xs text-red-500 mb-3">{error}</p>}

            <button
              onClick={handleAdd}
              disabled={!hasSelection || isPending}
              className="w-full rounded-xl bg-stone-900 px-4 py-3 font-mono text-xs text-white hover:bg-stone-700 disabled:opacity-40 transition"
            >
              {isPending ? 'Adding…' : 'Add to profile'}
            </button>
          </div>
        </div>
      )}
    </>
  )
}
