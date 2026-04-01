'use client'

import { useState, useTransition } from 'react'
import Image from 'next/image'
import { updateCollection, deleteCollection } from '@/app/actions/collections'
import { addItemToCollection, deleteItem } from '@/app/actions/items'

type Item = {
  id: string
  title: string | null
  image_url: string | null
  type: string
  metadata: Record<string, unknown>
}

type LibraryItem = {
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
  description: string | null
  type: string
}

const TYPE_LABELS: Record<string, string> = {
  book: 'Book',
  movie: 'Movie',
  music: 'Music',
  photo: 'Photo',
}

export default function EditCollectionModal({
  collection,
  items,
  libraryItems = [],
  username,
  onClose,
}: {
  collection: Collection
  items: Item[]
  libraryItems?: LibraryItem[]
  username: string
  onClose: () => void
}) {
  const [tab, setTab] = useState<'details' | 'items'>('items')
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()
  const [localItems, setLocalItems] = useState(items)
  const [deleting, setDeleting] = useState(false)
  const [addingId, setAddingId] = useState<string | null>(null)
  const [removingId, setRemovingId] = useState<string | null>(null)

  // Library items not already in this collection
  const availableLibraryItems = libraryItems.filter(
    li => !localItems.some(ci => ci.id === li.id)
  )

  function handleDetailsSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await updateCollection(collection.id, formData, username)
      if (result?.error) setError(result.error)
      else onClose()
    })
  }

  function handleDelete() {
    if (!confirm('Delete this collection?')) return
    setDeleting(true)
    startTransition(async () => {
      await deleteCollection(collection.id, username)
      onClose()
    })
  }

  // Add from library (existing item)
  async function handleAddFromLibrary(libraryItem: LibraryItem) {
    setAddingId(libraryItem.id)
    const res = await addItemToCollection(libraryItem.id, collection.id, username)
    if (!res?.error) {
      setLocalItems(prev => [...prev, {
        id: libraryItem.id,
        title: libraryItem.title,
        image_url: libraryItem.image_url,
        type: libraryItem.type,
        metadata: libraryItem.metadata,
      }])
    }
    setAddingId(null)
  }

  async function handleRemove(item: Item) {
    setRemovingId(item.id)
    await deleteItem(item.id, username)
    setLocalItems(prev => prev.filter(i => i.id !== item.id))
    setRemovingId(null)
  }

  function renderItemsTab() {
    return (
      <div className="flex flex-col gap-4 overflow-hidden flex-1">
        {localItems.length > 0 && (
          <div className="flex flex-col gap-1.5 shrink-0">
            <p className="font-mono text-[9px] text-stone-400 uppercase tracking-wider">In this collection</p>
            <div className="flex flex-col gap-1.5">
              {localItems.map(item => (
                <div key={item.id} className="flex items-center gap-3 rounded-xl border border-stone-100 p-2.5">
                  {item.image_url ? (
                    <Image src={item.image_url} alt={item.title ?? ''} width={28} height={40} className="rounded object-cover shrink-0" />
                  ) : (
                    <div className="w-7 h-10 rounded bg-stone-100 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-serif text-sm text-stone-800 truncate">{item.title}</p>
                    <p className="font-mono text-[9px] text-stone-400 uppercase">{TYPE_LABELS[item.type] ?? item.type}</p>
                  </div>
                  <button
                    onClick={() => handleRemove(item)}
                    disabled={removingId === item.id}
                    className="shrink-0 text-stone-300 hover:text-red-400 disabled:opacity-40 transition text-lg leading-none"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-1.5 overflow-y-auto flex-1">
          {availableLibraryItems.length === 0 ? (
            <p className="font-mono text-xs text-stone-400 text-center py-6">
              {libraryItems.length === 0 ? 'Your library is empty.' : 'All library items are already in this collection.'}
            </p>
          ) : (
            <>
              <p className="font-mono text-[9px] text-stone-400 uppercase tracking-wider shrink-0">From library</p>
              {availableLibraryItems.map(item => (
                <div key={item.id} className="flex items-center gap-3 rounded-xl border border-stone-100 p-2.5">
                  {item.image_url ? (
                    <Image src={item.image_url} alt={item.title ?? ''} width={28} height={40} className="rounded object-cover shrink-0" />
                  ) : (
                    <div className="w-7 h-10 rounded bg-stone-100 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-serif text-sm text-stone-800 truncate">{item.title}</p>
                    <p className="font-mono text-[9px] text-stone-400 uppercase">{TYPE_LABELS[item.type] ?? item.type}</p>
                  </div>
                  <button
                    onClick={() => handleAddFromLibrary(item)}
                    disabled={addingId === item.id}
                    className="shrink-0 rounded-xl border border-stone-200 px-3 py-1 font-mono text-xs text-stone-600 hover:bg-stone-50 disabled:opacity-40 transition"
                  >
                    {addingId === item.id ? '…' : 'Add'}
                  </button>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl border border-[#e0ddd8] p-7 max-h-[90vh] flex flex-col">

        <div className="flex items-center justify-between mb-5 shrink-0">
          <h2 className="font-serif text-lg font-semibold text-stone-900 truncate pr-4">{collection.name}</h2>
          <button onClick={onClose} className="font-mono text-xs text-stone-400 hover:text-stone-600">Close</button>
        </div>

        {/* Main tabs */}
        <div className="flex gap-1 mb-5 bg-stone-100 rounded-lg p-1 shrink-0">
          {(['items', 'details'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-1.5 rounded-md font-mono text-xs transition capitalize ${tab === t ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500'}`}
            >
              {t === 'items'
                ? `Items${localItems.length > 0 ? ' (' + localItems.length + ')' : ''}`
                : 'Details'}
            </button>
          ))}
        </div>

        {/* ── Items tab ─────────────────────────────────────────────────── */}
        {tab === 'items' && renderItemsTab()}

        {/* ── Details tab ───────────────────────────────────────────────── */}
        {tab === 'details' && (
          <form onSubmit={handleDetailsSubmit} className="flex flex-col gap-4 flex-1">
            <div className="flex flex-col gap-1.5">
              <label className="font-mono text-xs text-stone-500 uppercase tracking-wider">Name</label>
              <input
                name="name"
                required
                defaultValue={collection.name}
                className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 font-serif text-base text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900 transition"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-mono text-xs text-stone-500 uppercase tracking-wider">
                Description <span className="normal-case text-stone-300">(optional)</span>
              </label>
              <input
                name="description"
                defaultValue={collection.description ?? ''}
                className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 font-serif text-base text-stone-900 placeholder:text-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-900 transition"
                placeholder="A short description"
              />
            </div>

            {error && <p className="font-mono text-xs text-red-500">{error}</p>}

            <div className="flex gap-2 mt-auto pt-2">
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="rounded-xl border border-red-100 px-4 py-2.5 font-mono text-xs text-red-400 hover:bg-red-50 disabled:opacity-40 transition"
              >
                {deleting ? '…' : 'Delete'}
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="flex-1 rounded-xl bg-stone-900 px-4 py-2.5 font-mono text-xs text-white hover:bg-stone-700 disabled:opacity-50 transition"
              >
                {isPending ? 'Saving…' : 'Save'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
