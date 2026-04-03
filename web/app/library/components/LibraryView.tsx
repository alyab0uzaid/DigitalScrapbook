'use client'

import { useState, useTransition, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { addItem, deleteItem } from '@/app/actions/items'
import { createCollection } from '@/app/actions/collections'
import EditCollectionModal from '@/app/[username]/components/EditCollectionModal'

// ─── Types ───────────────────────────────────────────────────────────────────

type Item = {
  id: string
  title: string | null
  image_url: string | null
  type: string
  status: string | null
  metadata: Record<string, unknown>
  collection_id: string | null
  created_at: string
}

type Collection = {
  id: string
  name: string
  type: string
  description: string | null
  created_at: string
}

type SearchResult = {
  external_id: string
  title: string
  image_url: string | null
  metadata: Record<string, unknown>
}

// ─── Constants ───────────────────────────────────────────────────────────────

const BOOK_STATUSES = ['want to read', 'reading', 'read', 'favorite'] as const
const MOVIE_STATUSES = ['want to watch', 'watching', 'watched', 'favorite'] as const
const MUSIC_STATUSES = ['want', 'discovered', 'on repeat', 'loved', 'favorite'] as const

const STATUS_STYLES: Record<string, string> = {
  'reading': 'bg-green-50 text-green-700',
  'read': 'bg-stone-100 text-stone-500',
  'want to read': 'bg-yellow-50 text-yellow-700',
  'favorite': 'bg-amber-50 text-amber-700',
  'watching': 'bg-green-50 text-green-700',
  'watched': 'bg-stone-100 text-stone-500',
  'want to watch': 'bg-yellow-50 text-yellow-700',
  'on repeat': 'bg-green-50 text-green-700',
  'loved': 'bg-stone-100 text-stone-500',
  'discovered': 'bg-blue-50 text-blue-700',
  'own': 'bg-stone-100 text-stone-500',
  'want': 'bg-yellow-50 text-yellow-700',
}

type Tab = 'collections' | 'books' | 'movies' | 'music'

// ─── Status pill ─────────────────────────────────────────────────────────────

function StatusPill({ status }: { status: string | null }) {
  if (!status) return null
  const style = STATUS_STYLES[status] ?? 'bg-stone-100 text-stone-500'
  return (
    <span className={`font-mono text-[8px] uppercase tracking-wider px-1.5 py-0.5 rounded-full ${style}`}>
      {status}
    </span>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function LibraryView({
  items: initialItems,
  collections: initialCollections,
  username,
}: {
  items: Item[]
  collections: Collection[]
  username: string
}) {
  const [tab, setTab] = useState<Tab>('collections')
  const [localItems, setLocalItems] = useState(initialItems)
  const [localCollections, setLocalCollections] = useState(initialCollections)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null)
  const [, startTransition] = useTransition()

  // Add item sheet state (shared for books + movies)
  const [showAddSheet, setShowAddSheet] = useState(false)
  const [addType, setAddType] = useState<'book' | 'movie' | 'music'>('book')
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [selectedItem, setSelectedItem] = useState<SearchResult | null>(null)
  const [itemStatus, setItemStatus] = useState<string>('want to read')
  const [itemCollection, setItemCollection] = useState<string | null>(null)
  const [addingItem, setAddingItem] = useState(false)
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  // New collection sheet state
  const [showNewCollection, setShowNewCollection] = useState(false)
  const [newCollName, setNewCollName] = useState('')
  const [newCollDesc, setNewCollDesc] = useState('')
  const [creatingCollection, setCreatingCollection] = useState(false)
  const [createError, setCreateError] = useState('')

  // ─── Derived data ─────────────────────────────────────────────────────────

  const books = localItems.filter(i => i.type === 'book')
  const movies = localItems.filter(i => i.type === 'movie')
  const music = localItems.filter(i => i.type === 'music')

  function collectionItems(collectionId: string) {
    return localItems.filter(i => i.collection_id === collectionId)
  }

  const statuses = addType === 'book' ? BOOK_STATUSES : addType === 'movie' ? MOVIE_STATUSES : MUSIC_STATUSES
  const defaultStatus = addType === 'book' ? 'want to read' : addType === 'movie' ? 'want to watch' : 'want'

  // ─── Handlers ─────────────────────────────────────────────────────────────

  function openAddSheet(type: 'book' | 'movie' | 'music') {
    setAddType(type)
    setItemStatus(type === 'book' ? 'want to read' : type === 'movie' ? 'want to watch' : 'want')
    setShowAddSheet(true)
  }

  function closeAddSheet() {
    setShowAddSheet(false)
    setQuery('')
    setResults([])
    setSelectedItem(null)
    setItemStatus(defaultStatus)
    setItemCollection(null)
  }

  function handleSearch(value: string) {
    setQuery(value)
    setSelectedItem(null)
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    if (!value.trim()) { setResults([]); return }
    searchTimeout.current = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await fetch(`/api/search?type=${addType}&q=${encodeURIComponent(value)}`)
        const data = await res.json()
        setResults(data.results ?? [])
      } finally {
        setSearching(false)
      }
    }, 400)
  }

  async function handleAddItem() {
    if (!selectedItem) return
    setAddingItem(true)
    const res = await addItem({
      collectionId: itemCollection,
      type: addType,
      title: selectedItem.title,
      image_url: selectedItem.image_url,
      external_id: selectedItem.external_id,
      status: itemStatus,
      metadata: selectedItem.metadata,
      username,
    })
    if (!res?.error) {
      const newItem: Item = {
        id: res.itemId ?? selectedItem.external_id,
        title: selectedItem.title,
        image_url: selectedItem.image_url,
        type: addType,
        status: itemStatus,
        metadata: selectedItem.metadata,
        collection_id: itemCollection,
        created_at: new Date().toISOString(),
      }
      setLocalItems(prev => [newItem, ...prev])
      closeAddSheet()
    }
    setAddingItem(false)
  }

  function handleDelete(itemId: string) {
    setRemovingId(itemId)
    startTransition(async () => {
      await deleteItem(itemId, username)
      setLocalItems(prev => prev.filter(i => i.id !== itemId))
      setRemovingId(null)
    })
  }

  async function handleCreateCollection(e: React.FormEvent) {
    e.preventDefault()
    setCreateError('')
    setCreatingCollection(true)
    const formData = new FormData()
    formData.set('name', newCollName)
    formData.set('description', newCollDesc)
    const result = await createCollection(formData)
    if (result?.error) {
      setCreateError(result.error)
    } else {
      const newCol: Collection = {
        id: result.collectionId ?? '',
        name: newCollName,
        type: 'collection',
        description: newCollDesc || null,
        created_at: new Date().toISOString(),
      }
      setLocalCollections(prev => [newCol, ...prev])
      setShowNewCollection(false)
      setNewCollName('')
      setNewCollDesc('')
      setEditingCollection(newCol)
    }
    setCreatingCollection(false)
  }

  const alreadyInLibrary = (externalId: string) =>
    localItems.some(i => i.id === externalId || String(i.metadata?.tmdb_id) === externalId || i.metadata?.google_books_id === externalId)

  // ─── Render ───────────────────────────────────────────────────────────────

  const TABS: { key: Tab; label: string; count: number }[] = [
    { key: 'collections', label: 'Collections', count: localCollections.length },
    { key: 'books', label: 'Books', count: books.length },
    { key: 'movies', label: 'Movies', count: movies.length },
    { key: 'music', label: 'Music', count: music.length },
  ]

  return (
    <>
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <Link href={`/${username}`} className="font-mono text-xs text-stone-400 hover:text-stone-600 transition">
            ← {username}
          </Link>
          <h1 className="font-serif text-2xl font-semibold text-stone-900 mt-1">Library</h1>
        </div>

        {/* Context-sensitive add button */}
        {tab === 'collections' && (
          <button
            onClick={() => setShowNewCollection(true)}
            className="flex items-center gap-1.5 rounded-xl bg-stone-900 px-4 py-2 font-mono text-xs text-white hover:bg-stone-700 transition"
          >
            + New collection
          </button>
        )}
        {tab === 'books' && (
          <button
            onClick={() => openAddSheet('book')}
            className="flex items-center gap-1.5 rounded-xl bg-stone-900 px-4 py-2 font-mono text-xs text-white hover:bg-stone-700 transition"
          >
            + Add book
          </button>
        )}
        {tab === 'movies' && (
          <button
            onClick={() => openAddSheet('movie')}
            className="flex items-center gap-1.5 rounded-xl bg-stone-900 px-4 py-2 font-mono text-xs text-white hover:bg-stone-700 transition"
          >
            + Add movie
          </button>
        )}
        {tab === 'music' && (
          <button
            onClick={() => openAddSheet('music')}
            className="flex items-center gap-1.5 rounded-xl bg-stone-900 px-4 py-2 font-mono text-xs text-white hover:bg-stone-700 transition"
          >
            + Add music
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-0 mb-8 border-b border-stone-200">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 font-mono text-xs transition border-b-2 -mb-px ${
              tab === t.key
                ? 'border-stone-900 text-stone-900'
                : 'border-transparent text-stone-400 hover:text-stone-600'
            }`}
          >
            {t.label}
            <span className="ml-1.5 text-stone-400">{t.count}</span>
          </button>
        ))}
      </div>

      {/* ── Collections tab ─────────────────────────────────────────────── */}
      {tab === 'collections' && (
        <>
          {localCollections.length === 0 ? (
            <div className="py-16 text-center">
              <p className="font-serif text-lg text-stone-400">No collections yet.</p>
              <button
                onClick={() => setShowNewCollection(true)}
                className="mt-3 font-mono text-xs text-stone-500 underline underline-offset-2 hover:text-stone-700"
              >
                Create your first collection
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {localCollections.map(col => {
                const colItems = collectionItems(col.id)
                return (
                  <button
                    key={col.id}
                    onClick={() => setEditingCollection(col)}
                    className="text-left rounded-2xl border border-[#e0ddd8] bg-white p-4 hover:shadow-md transition group"
                  >
                    <div className="mb-3">
                      <p className="font-serif text-base font-semibold text-stone-900 group-hover:text-stone-700 transition">
                        {col.name}
                      </p>
                      {col.description && (
                        <p className="font-mono text-[9px] text-stone-400 mt-0.5 line-clamp-1">{col.description}</p>
                      )}
                    </div>

                    {/* Item covers preview */}
                    <div className="flex items-end gap-1.5 h-12">
                      {colItems.slice(0, 5).map(item => (
                        item.image_url ? (
                          <div key={item.id} className="relative w-8 h-12 rounded-sm overflow-hidden shrink-0">
                            <Image src={item.image_url} alt={item.title ?? ''} fill className="object-cover" />
                          </div>
                        ) : (
                          <div key={item.id} className="w-8 h-12 rounded-sm bg-stone-100 shrink-0" />
                        )
                      ))}
                      {colItems.length === 0 && (
                        <p className="font-mono text-[9px] text-stone-300">Empty</p>
                      )}
                      {colItems.length > 5 && (
                        <span className="font-mono text-[9px] text-stone-400 ml-1">+{colItems.length - 5}</span>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* ── Books tab ───────────────────────────────────────────────────── */}
      {tab === 'books' && (
        <>
          {books.length === 0 ? (
            <div className="py-16 text-center">
              <p className="font-serif text-lg text-stone-400">No books yet.</p>
              <button
                onClick={() => openAddSheet('book')}
                className="mt-3 font-mono text-xs text-stone-500 underline underline-offset-2 hover:text-stone-700"
              >
                Add your first book
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-x-4 gap-y-6">
              {books.map(item => (
                <div key={item.id} className="group relative">
                  <div className="aspect-[2/3] rounded-lg overflow-hidden bg-stone-100 relative">
                    {item.image_url ? (
                      <Image src={item.image_url} alt={item.title ?? ''} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center p-2">
                        <p className="font-serif text-xs text-stone-400 text-center line-clamp-3">{item.title}</p>
                      </div>
                    )}
                    <button
                      onClick={() => handleDelete(item.id)}
                      disabled={removingId === item.id}
                      className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-black/50 text-white text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition disabled:opacity-40"
                    >
                      {removingId === item.id ? '…' : '×'}
                    </button>
                  </div>
                  <div className="mt-2">
                    <p className="font-serif text-xs font-medium text-stone-900 leading-tight line-clamp-1">{item.title}</p>
                    {item.metadata?.author && (
                      <p className="font-mono text-[9px] text-stone-400 mt-0.5 truncate">{item.metadata.author as string}</p>
                    )}
                    <div className="mt-1">
                      <StatusPill status={item.status} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Movies tab ──────────────────────────────────────────────────── */}
      {tab === 'movies' && (
        <>
          {movies.length === 0 ? (
            <div className="py-16 text-center">
              <p className="font-serif text-lg text-stone-400">No movies yet.</p>
              <button
                onClick={() => openAddSheet('movie')}
                className="mt-3 font-mono text-xs text-stone-500 underline underline-offset-2 hover:text-stone-700"
              >
                Add your first movie
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-x-4 gap-y-6">
              {movies.map(item => (
                <div key={item.id} className="group relative">
                  <div className="aspect-[2/3] rounded-lg overflow-hidden bg-stone-100 relative">
                    {item.image_url ? (
                      <Image src={item.image_url} alt={item.title ?? ''} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center p-2">
                        <p className="font-serif text-xs text-stone-400 text-center line-clamp-3">{item.title}</p>
                      </div>
                    )}
                    <button
                      onClick={() => handleDelete(item.id)}
                      disabled={removingId === item.id}
                      className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-black/50 text-white text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition disabled:opacity-40"
                    >
                      {removingId === item.id ? '…' : '×'}
                    </button>
                  </div>
                  <div className="mt-2">
                    <p className="font-serif text-xs font-medium text-stone-900 leading-tight line-clamp-1">{item.title}</p>
                    {item.metadata?.media_type && (
                      <p className="font-mono text-[9px] text-stone-400 mt-0.5 truncate uppercase">{item.metadata.media_type as string}</p>
                    )}
                    <div className="mt-1">
                      <StatusPill status={item.status} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Music tab ───────────────────────────────────────────────────── */}
      {tab === 'music' && (
        <>
          {music.length === 0 ? (
            <div className="py-16 text-center">
              <p className="font-serif text-lg text-stone-400">No music yet.</p>
              <button
                onClick={() => openAddSheet('music')}
                className="mt-3 font-mono text-xs text-stone-500 underline underline-offset-2 hover:text-stone-700"
              >
                Add your first track or album
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-x-4 gap-y-6">
              {music.map(item => (
                <div key={item.id} className="group relative">
                  <div className="aspect-square rounded-lg overflow-hidden bg-stone-100 relative">
                    {item.image_url ? (
                      <Image src={item.image_url} alt={item.title ?? ''} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center p-2">
                        <p className="font-serif text-xs text-stone-400 text-center line-clamp-3">{item.title}</p>
                      </div>
                    )}
                    <button
                      onClick={() => handleDelete(item.id)}
                      disabled={removingId === item.id}
                      className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-black/50 text-white text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition disabled:opacity-40"
                    >
                      {removingId === item.id ? '…' : '×'}
                    </button>
                  </div>
                  <div className="mt-2">
                    <p className="font-serif text-xs font-medium text-stone-900 leading-tight line-clamp-1">{item.title}</p>
                    {item.metadata?.artist && (
                      <p className="font-mono text-[9px] text-stone-400 mt-0.5 truncate">{item.metadata.artist as string}</p>
                    )}
                    <div className="mt-1">
                      <StatusPill status={item.status} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Edit collection modal ────────────────────────────────────────── */}
      {editingCollection && (
        <EditCollectionModal
          collection={editingCollection}
          items={collectionItems(editingCollection.id)}
          libraryItems={localItems}
          username={username}
          onClose={() => setEditingCollection(null)}
        />
      )}

      {/* ── New collection sheet ─────────────────────────────────────────── */}
      {showNewCollection && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-black/20" onClick={() => setShowNewCollection(false)} />
          <div className="relative w-full sm:max-w-sm bg-white rounded-t-3xl sm:rounded-2xl shadow-xl border border-[#e0ddd8] p-6 pb-8">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-serif text-xl font-semibold text-stone-900">New collection</h2>
              <button onClick={() => setShowNewCollection(false)} className="font-mono text-xs text-stone-400 hover:text-stone-600">Close</button>
            </div>

            <form onSubmit={handleCreateCollection} className="flex flex-col gap-4">
              <input
                required
                autoFocus
                value={newCollName}
                onChange={e => setNewCollName(e.target.value)}
                placeholder="Collection name"
                className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 font-serif text-base text-stone-900 placeholder:text-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-900 transition"
              />

              <input
                value={newCollDesc}
                onChange={e => setNewCollDesc(e.target.value)}
                placeholder="Description (optional)"
                className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 font-serif text-sm text-stone-900 placeholder:text-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-900 transition"
              />

              {createError && <p className="font-mono text-xs text-red-500">{createError}</p>}

              <button
                type="submit"
                disabled={creatingCollection || !newCollName.trim()}
                className="w-full rounded-xl bg-stone-900 py-3 font-mono text-xs text-white hover:bg-stone-700 disabled:opacity-40 transition"
              >
                {creatingCollection ? 'Creating…' : 'Create collection'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Add item sheet (books + movies) ─────────────────────────────── */}
      {showAddSheet && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-black/20" onClick={closeAddSheet} />
          <div className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl shadow-xl border border-[#e0ddd8] p-6 pb-8">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-serif text-xl font-semibold text-stone-900">
                {addType === 'book' ? 'Add a book' : addType === 'movie' ? 'Add a movie or show' : 'Add music'}
              </h2>
              <button onClick={closeAddSheet} className="font-mono text-xs text-stone-400 hover:text-stone-600">Close</button>
            </div>

            {/* Search */}
            <input
              type="search"
              value={query}
              onChange={e => handleSearch(e.target.value)}
              autoFocus
              placeholder={addType === 'book' ? 'Search by title or author…' : addType === 'movie' ? 'Search movies and TV shows…' : 'Search songs and albums…'}
              className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 font-serif text-base text-stone-900 placeholder:text-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-900 transition mb-3"
            />

            {/* Search results */}
            {!selectedItem && (
              <div className="flex flex-col gap-2 max-h-52 overflow-y-auto mb-4">
                {searching && <p className="font-mono text-xs text-stone-400 text-center py-4">Searching…</p>}
                {!searching && results.length === 0 && query && (
                  <p className="font-mono text-xs text-stone-400 text-center py-4">No results</p>
                )}
                {!searching && results.map(result => (
                  <button
                    key={result.external_id}
                    onClick={() => setSelectedItem(result)}
                    disabled={alreadyInLibrary(result.external_id)}
                    className={`flex items-center gap-3 rounded-xl border p-3 text-left transition ${
                      alreadyInLibrary(result.external_id)
                        ? 'border-stone-100 opacity-40 cursor-not-allowed'
                        : 'border-stone-100 hover:border-stone-300'
                    }`}
                  >
                    {result.image_url ? (
                      <Image src={result.image_url} alt={result.title} width={32} height={48} className="rounded object-cover shrink-0" />
                    ) : (
                      <div className="w-8 h-12 rounded bg-stone-100 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-serif text-sm font-medium text-stone-900 truncate">{result.title}</p>
                      {addType === 'book' && result.metadata.author && (
                        <p className="font-mono text-[9px] text-stone-400 mt-0.5">{result.metadata.author as string}</p>
                      )}
                      {addType === 'movie' && result.metadata.release_year && (
                        <p className="font-mono text-[9px] text-stone-400 mt-0.5">{result.metadata.release_year as string}</p>
                      )}
                      {addType === 'music' && result.metadata.artist && (
                        <p className="font-mono text-[9px] text-stone-400 mt-0.5">{result.metadata.artist as string}{result.metadata.media_type === 'album' ? ' · album' : ''}</p>
                      )}
                    </div>
                    {alreadyInLibrary(result.external_id) && (
                      <span className="font-mono text-[9px] text-stone-400 shrink-0">In library</span>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Selected item + status picker */}
            {selectedItem && (
              <div className="mb-4">
                {/* Selected item */}
                <div className="flex items-center gap-3 rounded-xl border border-stone-900 bg-stone-50 p-3 mb-4">
                  {selectedItem.image_url ? (
                    <Image src={selectedItem.image_url} alt={selectedItem.title} width={32} height={48} className="rounded object-cover shrink-0" />
                  ) : (
                    <div className="w-8 h-12 rounded bg-stone-100 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-serif text-sm font-medium text-stone-900 truncate">{selectedItem.title}</p>
                    {addType === 'book' && selectedItem.metadata.author && (
                      <p className="font-mono text-[9px] text-stone-400 mt-0.5">{selectedItem.metadata.author as string}</p>
                    )}
                    {addType === 'movie' && selectedItem.metadata.release_year && (
                      <p className="font-mono text-[9px] text-stone-400 mt-0.5">{selectedItem.metadata.release_year as string}</p>
                    )}
                    {addType === 'music' && selectedItem.metadata.artist && (
                      <p className="font-mono text-[9px] text-stone-400 mt-0.5">{selectedItem.metadata.artist as string}{selectedItem.metadata.media_type === 'album' ? ' · album' : ''}</p>
                    )}
                  </div>
                  <button onClick={() => setSelectedItem(null)} className="font-mono text-xs text-stone-400 hover:text-stone-600 shrink-0">×</button>
                </div>

                {/* Status picker */}
                <p className="font-mono text-[9px] text-stone-400 uppercase tracking-wider mb-2">Status</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {statuses.map(s => (
                    <button
                      key={s}
                      onClick={() => setItemStatus(s)}
                      className={`px-3 py-1.5 rounded-full font-mono text-[9px] uppercase tracking-wider transition ${
                        itemStatus === s
                          ? (STATUS_STYLES[s] ?? 'bg-stone-900 text-white') + ' ring-1 ring-offset-1 ring-stone-400'
                          : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>

                {/* Optional collection */}
                {localCollections.length > 0 && (
                  <>
                    <p className="font-mono text-[9px] text-stone-400 uppercase tracking-wider mb-2">Add to collection <span className="normal-case">(optional)</span></p>
                    <div className="flex flex-col gap-1.5 max-h-28 overflow-y-auto mb-4">
                      {localCollections.map(col => (
                        <button
                          key={col.id}
                          onClick={() => setItemCollection(itemCollection === col.id ? null : col.id)}
                          className={`flex items-center justify-between rounded-xl border px-3 py-2 text-left transition ${
                            itemCollection === col.id ? 'border-stone-900 bg-stone-50' : 'border-stone-100 hover:border-stone-200'
                          }`}
                        >
                          <span className="font-serif text-sm text-stone-900">{col.name}</span>
                          {itemCollection === col.id && <span className="font-mono text-xs text-stone-900">✓</span>}
                        </button>
                      ))}
                    </div>
                  </>
                )}

                <button
                  onClick={handleAddItem}
                  disabled={addingItem}
                  className="w-full rounded-xl bg-stone-900 py-3 font-mono text-xs text-white hover:bg-stone-700 disabled:opacity-40 transition"
                >
                  {addingItem ? 'Adding…' : 'Add to library'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
