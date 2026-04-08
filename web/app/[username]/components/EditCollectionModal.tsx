'use client'

import { useState, useTransition } from 'react'
import Image from 'next/image'
import { updateCollection, deleteCollection } from '@/app/actions/collections'
import { addItemToCollection, removeItemFromCollection } from '@/app/actions/items'

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
  book: 'Read', movie: 'Flick', music: 'Music', photo: 'Photo',
  link: 'Link', note: 'Note', item: 'Item', place: 'Place',
}

export default function EditCollectionModal({
  collection,
  libraryItems = [],
  initialItemIds = [],
  username,
  onClose,
  onItemAdded,
  onItemRemoved,
}: {
  collection: Collection
  libraryItems?: LibraryItem[]
  initialItemIds?: string[]
  username: string
  onClose: () => void
  onItemAdded?: (collectionId: string, itemId: string) => void
  onItemRemoved?: (collectionId: string, itemId: string) => void
}) {
  const [view, setView] = useState<'items' | 'details'>('items')
  const [localItemIds, setLocalItemIds] = useState<Set<string>>(new Set(initialItemIds))
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()
  const [deleting, setDeleting] = useState(false)

  const eligibleItems = libraryItems.filter(i => i.type !== 'place')
  const inCollection = eligibleItems.filter(i => localItemIds.has(i.id))
  const notInCollection = eligibleItems.filter(i => !localItemIds.has(i.id))

  async function handleAdd(item: LibraryItem) {
    if (pendingId) return
    setPendingId(item.id)
    setLocalItemIds(prev => new Set([...prev, item.id]))
    onItemAdded?.(collection.id, item.id)
    const res = await addItemToCollection(item.id, collection.id, username)
    if (res?.error) {
      // Rollback
      setLocalItemIds(prev => { const s = new Set(prev); s.delete(item.id); return s })
      onItemRemoved?.(collection.id, item.id)
    }
    setPendingId(null)
  }

  async function handleRemove(itemId: string) {
    if (pendingId) return
    setPendingId(itemId)
    setLocalItemIds(prev => { const s = new Set(prev); s.delete(itemId); return s })
    onItemRemoved?.(collection.id, itemId)
    const res = await removeItemFromCollection(itemId, collection.id, username)
    if (res?.error) {
      // Rollback
      setLocalItemIds(prev => new Set([...prev, itemId]))
      onItemAdded?.(collection.id, itemId)
    }
    setPendingId(null)
  }

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
    if (!confirm('Delete this collection? Items will stay in your library.')) return
    setDeleting(true)
    startTransition(async () => {
      await deleteCollection(collection.id, username)
      onClose()
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      <div className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl shadow-xl border border-[#e0ddd8] flex flex-col max-h-[85vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="font-serif text-lg font-semibold text-stone-900 truncate">{collection.name}</h2>
            {inCollection.length > 0 && (
              <span className="font-mono text-[9px] text-stone-400 bg-stone-100 px-2 py-0.5 rounded-full">
                {inCollection.length}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setView(v => v === 'items' ? 'details' : 'items')}
              className="font-mono text-[10px] text-stone-400 hover:text-stone-600 transition"
            >
              {view === 'items' ? 'Details' : 'Items'}
            </button>
            <button onClick={onClose} className="font-mono text-xs text-stone-400 hover:text-stone-600 transition">
              Done
            </button>
          </div>
        </div>

        {/* Items view */}
        {view === 'items' && (
          <div className="overflow-y-auto flex-1 pb-6">
            {/* In collection */}
            {inCollection.length > 0 && (
              <div className="px-6 mb-4">
                <p className="font-mono text-[9px] text-stone-400 uppercase tracking-wider mb-2">In collection</p>
                <div className="flex flex-col gap-1">
                  {inCollection.map(item => (
                    <div key={item.id} className="flex items-center gap-3 rounded-xl p-2.5 bg-stone-50">
                      {item.image_url ? (
                        <div className="w-7 h-10 rounded-sm overflow-hidden shrink-0 relative">
                          <Image src={item.image_url} alt={item.title ?? ''} fill className="object-cover" sizes="28px" />
                        </div>
                      ) : (
                        <div className="w-7 h-10 rounded-sm bg-stone-200 shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-serif text-sm text-stone-900 truncate">{item.title}</p>
                        <p className="font-mono text-[9px] text-stone-400 uppercase mt-0.5">{TYPE_LABELS[item.type] ?? item.type}</p>
                      </div>
                      <button
                        onClick={() => handleRemove(item.id)}
                        disabled={pendingId === item.id}
                        className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-stone-300 hover:text-red-400 hover:bg-red-50 transition disabled:opacity-30"
                      >
                        <svg width="10" height="2" viewBox="0 0 10 2" fill="none">
                          <rect width="10" height="2" rx="1" fill="currentColor" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add from library */}
            {notInCollection.length > 0 && (
              <div className="px-6">
                <p className="font-mono text-[9px] text-stone-400 uppercase tracking-wider mb-2">Add from library</p>
                <div className="flex flex-col gap-1">
                  {notInCollection.map(item => (
                    <div key={item.id} className="flex items-center gap-3 rounded-xl p-2.5 hover:bg-stone-50 transition">
                      {item.image_url ? (
                        <div className="w-7 h-10 rounded-sm overflow-hidden shrink-0 relative">
                          <Image src={item.image_url} alt={item.title ?? ''} fill className="object-cover" sizes="28px" />
                        </div>
                      ) : (
                        <div className="w-7 h-10 rounded-sm bg-stone-100 shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-serif text-sm text-stone-700 truncate">{item.title}</p>
                        <p className="font-mono text-[9px] text-stone-400 uppercase mt-0.5">{TYPE_LABELS[item.type] ?? item.type}</p>
                      </div>
                      <button
                        onClick={() => handleAdd(item)}
                        disabled={pendingId === item.id}
                        className="shrink-0 w-6 h-6 rounded-full border border-stone-200 flex items-center justify-center text-stone-400 hover:border-stone-900 hover:text-stone-900 hover:bg-stone-50 transition disabled:opacity-30"
                      >
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                          <rect x="4" width="2" height="10" rx="1" fill="currentColor" />
                          <rect y="4" width="10" height="2" rx="1" fill="currentColor" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {eligibleItems.length === 0 && (
              <div className="px-6 py-8 text-center">
                <p className="font-mono text-xs text-stone-400">Your library is empty.</p>
              </div>
            )}
          </div>
        )}

        {/* Details view */}
        {view === 'details' && (
          <form onSubmit={handleDetailsSubmit} className="flex flex-col gap-4 px-6 pb-6 flex-1">
            <div className="flex flex-col gap-1.5">
              <label className="font-mono text-[10px] text-stone-500 uppercase tracking-wider">Name</label>
              <input
                name="name"
                required
                defaultValue={collection.name}
                className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 font-serif text-base text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900 transition"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="font-mono text-[10px] text-stone-500 uppercase tracking-wider">
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
