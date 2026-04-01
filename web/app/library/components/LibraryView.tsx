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

  // Add book sheet state
  const [showAddBook, setShowAddBook] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [selectedBook, setSelectedBook] = useState<SearchResult | null>(null)
  const [bookStatus, setBookStatus] = useState<string>('want to read')
  const [bookCollection, setBookCollection] = useState<string | null>(null)
  const [addingBook, setAddingBook] = useState(false)
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

  // ─── Handlers ─────────────────────────────────────────────────────────────

  function handleSearch(value: string) {
    setQuery(value)
    setSelectedBook(null)
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    if (!value.trim()) { setResults([]); return }
    searchTimeout.current = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await fetch(`/api/search?type=book&q=${encodeURIComponent(value)}`)
        const data = await res.json()
        setResults(data.results ?? [])
      } finally {
        setSearching(false)
      }
    }, 400)
  }

  async function handleAddBook() {
    if (!selectedBook) return
    setAddingBook(true)
    const res = await addItem({
      collectionId: bookCollection,
      type: 'book',
      title: selectedBook.title,
      image_url: selectedBook.image_url,
      external_id: selectedBook.external_id,
      status: bookStatus,
      metadata: selectedBook.metadata,
      username,
    })
    if (!res?.error) {
      const newItem: Item = {
        id: res.itemId ?? selectedBook.external_id,
        title: selectedBook.title,
        image_url: selectedBook.image_url,
        type: 'book',
        status: bookStatus,
        metadata: selectedBook.metadata,
        collection_id: bookCollection,
        created_at: new Date().toISOString(),
      }
      setLocalItems(prev => [newItem, ...prev])
      closeAddBook()
    }
    setAddingBook(false)
  }

  function closeAddBook() {
    setShowAddBook(false)
    setQuery('')
    setResults([])
    setSelectedBook(null)
    setBookStatus('want to read')
    setBookCollection(null)
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
      setEditingCollection(newCol) // go straight into the collection
    }
    setCreatingCollection(false)
  }

  const alreadyInLibrary = (externalId: string) =>
    localItems.some(i => i.metadata?.google_books_id === externalId || i.id === externalId)

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
            onClick={() => setShowAddBook(true)}
            className="flex items-center gap-1.5 rounded-xl bg-stone-900 px-4 py-2 font-mono text-xs text-white hover:bg-stone-700 transition"
          >
            + Add book
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
                onClick={() => setShowAddBook(true)}
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
        <div className="py-16 text-center">
          <p className="font-serif text-lg text-stone-400">Movies coming soon.</p>
          <p className="font-mono text-xs text-stone-300 mt-1">TMDB integration not wired up yet.</p>
        </div>
      )}

      {/* ── Music tab ───────────────────────────────────────────────────── */}
      {tab === 'music' && (
        <div className="py-16 text-center">
          <p className="font-serif text-lg text-stone-400">Music coming soon.</p>
          <p className="font-mono text-xs text-stone-300 mt-1">Spotify integration not wired up yet.</p>
        </div>
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

      {/* ── Add book sheet ───────────────────────────────────────────────── */}
      {showAddBook && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-black/20" onClick={closeAddBook} />
          <div className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl shadow-xl border border-[#e0ddd8] p-6 pb-8">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-serif text-xl font-semibold text-stone-900">Add a book</h2>
              <button onClick={closeAddBook} className="font-mono text-xs text-stone-400 hover:text-stone-600">Close</button>
            </div>

            {/* Search */}
            <input
              type="search"
              value={query}
              onChange={e => handleSearch(e.target.value)}
              autoFocus
              placeholder="Search by title or author…"
              className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 font-serif text-base text-stone-900 placeholder:text-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-900 transition mb-3"
            />

            {/* Search results */}
            {!selectedBook && (
              <div className="flex flex-col gap-2 max-h-52 overflow-y-auto mb-4">
                {searching && <p className="font-mono text-xs text-stone-400 text-center py-4">Searching…</p>}
                {!searching && results.length === 0 && query && (
                  <p className="font-mono text-xs text-stone-400 text-center py-4">No results</p>
                )}
                {!searching && results.map(result => (
                  <button
                    key={result.external_id}
                    onClick={() => setSelectedBook(result)}
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
                      {result.metadata.author && (
                        <p className="font-mono text-[9px] text-stone-400 mt-0.5">{result.metadata.author as string}</p>
                      )}
                    </div>
                    {alreadyInLibrary(result.external_id) && (
                      <span className="font-mono text-[9px] text-stone-400 shrink-0">In library</span>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Selected book + status picker */}
            {selectedBook && (
              <div className="mb-4">
                {/* Selected item */}
                <div className="flex items-center gap-3 rounded-xl border border-stone-900 bg-stone-50 p-3 mb-4">
                  {selectedBook.image_url ? (
                    <Image src={selectedBook.image_url} alt={selectedBook.title} width={32} height={48} className="rounded object-cover shrink-0" />
                  ) : (
                    <div className="w-8 h-12 rounded bg-stone-100 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-serif text-sm font-medium text-stone-900 truncate">{selectedBook.title}</p>
                    {selectedBook.metadata.author && (
                      <p className="font-mono text-[9px] text-stone-400 mt-0.5">{selectedBook.metadata.author as string}</p>
                    )}
                  </div>
                  <button onClick={() => setSelectedBook(null)} className="font-mono text-xs text-stone-400 hover:text-stone-600 shrink-0">×</button>
                </div>

                {/* Status picker */}
                <p className="font-mono text-[9px] text-stone-400 uppercase tracking-wider mb-2">Status</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {BOOK_STATUSES.map(s => (
                    <button
                      key={s}
                      onClick={() => setBookStatus(s)}
                      className={`px-3 py-1.5 rounded-full font-mono text-[9px] uppercase tracking-wider transition ${
                        bookStatus === s
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
                          onClick={() => setBookCollection(bookCollection === col.id ? null : col.id)}
                          className={`flex items-center justify-between rounded-xl border px-3 py-2 text-left transition ${
                            bookCollection === col.id ? 'border-stone-900 bg-stone-50' : 'border-stone-100 hover:border-stone-200'
                          }`}
                        >
                          <span className="font-serif text-sm text-stone-900">{col.name}</span>
                          {bookCollection === col.id && <span className="font-mono text-xs text-stone-900">✓</span>}
                        </button>
                      ))}
                    </div>
                  </>
                )}

                <button
                  onClick={handleAddBook}
                  disabled={addingBook}
                  className="w-full rounded-xl bg-stone-900 py-3 font-mono text-xs text-white hover:bg-stone-700 disabled:opacity-40 transition"
                >
                  {addingBook ? 'Adding…' : 'Add to library'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
