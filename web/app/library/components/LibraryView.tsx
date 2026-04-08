'use client'

import { useState, useTransition, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { addItem, deleteItem } from '@/app/actions/items'
import { createCollection, toggleCollectionPublic } from '@/app/actions/collections'
import { uploadPhoto } from '@/app/actions/photos'
import NoteEditor from './NoteEditor'
import AddItemSheet from './AddItemSheet'
import AddPlaceSheet from './AddPlaceSheet'
import EditCollectionModal from '@/app/[username]/components/EditCollectionModal'
import ProfileNav from '@/app/[username]/components/ProfileNav'
import { CollectionCard1x1 } from '@/app/[username]/components/cards/CollectionCard'
import { BookCard1x1 } from '@/app/[username]/components/cards/BookCard'
import { MovieCard1x1 } from '@/app/[username]/components/cards/MovieCard'
import { MusicCard1x1 } from '@/app/[username]/components/cards/MusicCard'
import { PhotoCard } from '@/app/[username]/components/cards/PhotoCard'
import { ItemCard1x1 } from '@/app/[username]/components/cards/ItemCard'

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
  is_public: boolean
  created_at: string
  collection_items?: { item_id: string }[]
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
  'visited': 'bg-stone-100 text-stone-500',
  'want to go': 'bg-yellow-50 text-yellow-700',
}

type Tab = 'collections' | 'reads' | 'flicks' | 'music' | 'photos' | 'links' | 'notes' | 'items' | 'places'

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
  navSections,
  navCollections,
}: {
  items: Item[]
  collections: Collection[]
  username: string
  navSections: { slug: string; label: string }[]
  navCollections: { id: string; name: string; is_public: boolean }[]
}) {
  const [tab, setTab] = useState<Tab>('collections')
  const [localItems, setLocalItems] = useState(initialItems)
  const [localCollections, setLocalCollections] = useState(initialCollections)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null)
  const [, startTransition] = useTransition()

  // Add item sheet state (shared for reads + flicks)
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

  // Link state
  const [showAddLink, setShowAddLink] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const [linkPreview, setLinkPreview] = useState<{ title: string | null; description: string | null; image: string | null; favicon: string | null; site_name: string | null } | null>(null)
  const [fetchingLink, setFetchingLink] = useState(false)
  const [linkFetchError, setLinkFetchError] = useState('')
  const [addingLink, setAddingLink] = useState(false)
  const linkTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Note editor state
  const [showNoteEditor, setShowNoteEditor] = useState(false)
  // Item sheet state
  const [showAddItemSheet, setShowAddItemSheet] = useState(false)
  // Place sheet state
  const [showAddPlaceSheet, setShowAddPlaceSheet] = useState(false)

  // Photo upload state
  const [showUploadPhoto, setShowUploadPhoto] = useState(false)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoTitle, setPhotoTitle] = useState('')
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [uploadPhotoError, setUploadPhotoError] = useState('')

  // New collection sheet state
  const [showNewCollection, setShowNewCollection] = useState(false)
  const [newCollName, setNewCollName] = useState('')
  const [newCollDesc, setNewCollDesc] = useState('')
  const [creatingCollection, setCreatingCollection] = useState(false)
  const [createError, setCreateError] = useState('')

  // ─── Derived data ─────────────────────────────────────────────────────────

  const reads = localItems.filter(i => i.type === 'book')
  const flicks = localItems.filter(i => i.type === 'movie')
  const music = localItems.filter(i => i.type === 'music')
  const photos = localItems.filter(i => i.type === 'photo')
  const links = localItems.filter(i => i.type === 'link')
  const notes = localItems.filter(i => i.type === 'note')
  const physicalItems = localItems.filter(i => i.type === 'item')
  const places = localItems.filter(i => i.type === 'place')

  function collectionItems(collectionId: string) {
    const col = localCollections.find(c => c.id === collectionId)
    const ids = new Set(col?.collection_items?.map(ci => ci.item_id) ?? [])
    return localItems.filter(i => ids.has(i.id))
  }

  function handleItemAdded(collectionId: string, itemId: string) {
    setLocalCollections(prev => prev.map(c =>
      c.id === collectionId
        ? { ...c, collection_items: [...(c.collection_items ?? []), { item_id: itemId }] }
        : c
    ))
  }

  function handleItemRemoved(collectionId: string, itemId: string) {
    setLocalCollections(prev => prev.map(c =>
      c.id === collectionId
        ? { ...c, collection_items: (c.collection_items ?? []).filter(ci => ci.item_id !== itemId) }
        : c
    ))
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

  function handlePhotoFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    setPhotoFile(file)
    if (file) {
      const url = URL.createObjectURL(file)
      setPhotoPreview(url)
    } else {
      setPhotoPreview(null)
    }
  }

  function closeUploadPhoto() {
    setShowUploadPhoto(false)
    setPhotoFile(null)
    setPhotoTitle('')
    setPhotoPreview(null)
    setUploadPhotoError('')
  }

  async function handleUploadPhoto(e: React.FormEvent) {
    e.preventDefault()
    if (!photoFile || !photoTitle.trim()) return
    setUploadingPhoto(true)
    setUploadPhotoError('')
    const formData = new FormData()
    formData.set('file', photoFile)
    formData.set('title', photoTitle.trim())
    formData.set('username', username)
    const res = await uploadPhoto(formData)
    if (res?.error) {
      setUploadPhotoError(res.error)
      setUploadingPhoto(false)
      return
    }
    if (res?.itemId) {
      const newItem: Item = {
        id: res.itemId,
        title: photoTitle.trim(),
        image_url: null, // blob URL won't persist; real URL loads on next page visit
        type: 'photo',
        status: null,
        metadata: {},
        collection_id: null,
        created_at: new Date().toISOString(),
      }
      setLocalItems(prev => [newItem, ...prev])
      closeUploadPhoto()
    }
    setUploadingPhoto(false)
  }

  function closeAddLink() {
    setShowAddLink(false)
    setLinkUrl('')
    setLinkPreview(null)
    setLinkFetchError('')
  }

  function handleLinkUrlChange(value: string) {
    setLinkUrl(value)
    setLinkPreview(null)
    setLinkFetchError('')
    if (linkTimeout.current) clearTimeout(linkTimeout.current)
    if (!value.trim()) return
    linkTimeout.current = setTimeout(async () => {
      setFetchingLink(true)
      try {
        const res = await fetch(`/api/link-preview?url=${encodeURIComponent(value)}`)
        const data = await res.json()
        if (data.error) setLinkFetchError(data.error)
        else setLinkPreview(data)
      } catch {
        setLinkFetchError('Could not fetch page')
      } finally {
        setFetchingLink(false)
      }
    }, 600)
  }

  async function handleAddLink() {
    if (!linkPreview || !linkUrl) return
    setAddingLink(true)
    const res = await addItem({
      type: 'link',
      title: linkPreview.title ?? linkUrl,
      image_url: linkPreview.image,
      external_id: linkUrl,
      status: null,
      metadata: {
        url: linkUrl,
        description: linkPreview.description,
        favicon: linkPreview.favicon,
        site_name: linkPreview.site_name,
      },
      username,
    })
    if (!res?.error && res?.itemId) {
      const newItem: Item = {
        id: res.itemId,
        title: linkPreview.title ?? linkUrl,
        image_url: linkPreview.image,
        type: 'link',
        status: null,
        metadata: {
          url: linkUrl,
          description: linkPreview.description,
          favicon: linkPreview.favicon,
          site_name: linkPreview.site_name,
        },
        collection_id: null,
        created_at: new Date().toISOString(),
      }
      setLocalItems(prev => [newItem, ...prev])
      closeAddLink()
    }
    setAddingLink(false)
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
        is_public: true,
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
    { key: 'reads', label: 'Reads', count: reads.length },
    { key: 'flicks', label: 'Flicks', count: flicks.length },
    { key: 'music', label: 'Music', count: music.length },
    { key: 'photos', label: 'Photos', count: photos.length },
    { key: 'links', label: 'Links', count: links.length },
    { key: 'notes', label: 'Notes', count: notes.length },
    { key: 'items', label: 'Items', count: physicalItems.length },
    { key: 'places', label: 'Places', count: places.length },
  ]

  return (
    <>
      {/* Nav */}
      <div className="flex mb-8">
        <ProfileNav
          username={username}
          sections={navSections}
          collections={navCollections}
          isOwner={true}
        />
      </div>

      {/* Header */}
      <div className="flex items-end justify-between mb-10">
        <div>
          <h1 className="font-serif text-6xl font-light text-stone-900 leading-none">library</h1>
          <p className="font-serif text-sm text-stone-500 mt-3">
            {localItems.length} {localItems.length === 1 ? 'item' : 'items'} · {localCollections.length} {localCollections.length === 1 ? 'collection' : 'collections'}
          </p>
        </div>
        {/* Context-sensitive add button */}
        <div className="shrink-0">
          {tab === 'collections' && (
            <button onClick={() => setShowNewCollection(true)} className="rounded-lg bg-stone-900 px-4 py-2 font-mono text-xs text-white hover:bg-stone-700 transition">
              + New collection
            </button>
          )}
          {tab === 'reads' && (
            <button onClick={() => openAddSheet('book')} className="rounded-lg bg-stone-900 px-4 py-2 font-mono text-xs text-white hover:bg-stone-700 transition">
              + Add a read
            </button>
          )}
          {tab === 'flicks' && (
            <button onClick={() => openAddSheet('movie')} className="rounded-lg bg-stone-900 px-4 py-2 font-mono text-xs text-white hover:bg-stone-700 transition">
              + Add a flick
            </button>
          )}
          {tab === 'music' && (
            <button onClick={() => openAddSheet('music')} className="rounded-lg bg-stone-900 px-4 py-2 font-mono text-xs text-white hover:bg-stone-700 transition">
              + Add music
            </button>
          )}
          {tab === 'items' && (
            <button onClick={() => setShowAddItemSheet(true)} className="rounded-lg bg-stone-900 px-4 py-2 font-mono text-xs text-white hover:bg-stone-700 transition">
              + Add item
            </button>
          )}
          {tab === 'places' && (
            <button onClick={() => setShowAddPlaceSheet(true)} className="rounded-lg bg-stone-900 px-4 py-2 font-mono text-xs text-white hover:bg-stone-700 transition">
              + Add place
            </button>
          )}
          {tab === 'notes' && (
            <button onClick={() => setShowNoteEditor(true)} className="rounded-lg bg-stone-900 px-4 py-2 font-mono text-xs text-white hover:bg-stone-700 transition">
              + New note
            </button>
          )}
          {tab === 'links' && (
            <button onClick={() => setShowAddLink(true)} className="rounded-lg bg-stone-900 px-4 py-2 font-mono text-xs text-white hover:bg-stone-700 transition">
              + Add link
            </button>
          )}
          {tab === 'photos' && (
            <button onClick={() => setShowUploadPhoto(true)} className="rounded-lg bg-stone-900 px-4 py-2 font-mono text-xs text-white hover:bg-stone-700 transition">
              + Upload photo
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 mb-8 border-b border-stone-100">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 font-mono text-xs transition border-b-2 -mb-px ${
              tab === t.key
                ? 'border-stone-900 text-stone-900'
                : 'border-transparent text-stone-400 hover:text-stone-600'
            }`}
          >
            {t.label}
            {t.count > 0 && <span className="ml-1.5 text-stone-300">{t.count}</span>}
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
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 auto-rows-[170px] sm:auto-rows-[235px]">
              {localCollections.map(col => {
                const colItems = collectionItems(col.id)
                const cardCol = {
                  ...col,
                  collection_items: colItems.map((item, i) => ({ display_order: i, item })),
                }
                return (
                  <div key={col.id} className="relative rounded-lg overflow-hidden bg-stone-50 group">
                    <button
                      className="absolute inset-0 w-full h-full z-10"
                      onClick={() => setEditingCollection(col)}
                    />
                    <CollectionCard1x1 collection={cardCol} />
                    {/* Public/private badge */}
                    <button
                      onClick={async (e) => {
                        e.stopPropagation()
                        const next = !col.is_public
                        setLocalCollections(prev => prev.map(c => c.id === col.id ? { ...c, is_public: next } : c))
                        await toggleCollectionPublic(col.id, next, username)
                      }}
                      className="absolute top-2 right-2 z-20 font-mono text-[8px] px-1.5 py-0.5 rounded-full transition hover:opacity-80"
                      style={col.is_public
                        ? { background: 'rgb(240 253 244)', color: 'rgb(21 128 61)' }
                        : { background: 'rgb(245 245 244)', color: 'rgb(120 113 108)' }
                      }
                    >
                      {col.is_public ? 'public' : 'private'}
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* ── Reads tab ───────────────────────────────────────────────────── */}
      {tab === 'reads' && (
        <>
          {reads.length === 0 ? (
            <div className="py-16 text-center">
              <p className="font-serif text-lg text-stone-400">No reads yet.</p>
              <button
                onClick={() => openAddSheet('book')}
                className="mt-3 font-mono text-xs text-stone-500 underline underline-offset-2 hover:text-stone-700"
              >
                Add your first read
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 auto-rows-[170px] sm:auto-rows-[235px]">
              {reads.map(item => (
                <div key={item.id} className="relative rounded-lg overflow-hidden bg-stone-50 group">
                  <BookCard1x1 item={item} />
                  <button
                    onClick={() => handleDelete(item.id)}
                    disabled={removingId === item.id}
                    className="absolute top-1.5 right-1.5 z-10 w-5 h-5 rounded-full bg-black/50 text-white text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition disabled:opacity-40"
                  >
                    {removingId === item.id ? '…' : '×'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Flicks tab ──────────────────────────────────────────────────── */}
      {tab === 'flicks' && (
        <>
          {flicks.length === 0 ? (
            <div className="py-16 text-center">
              <p className="font-serif text-lg text-stone-400">No flicks yet.</p>
              <button
                onClick={() => openAddSheet('movie')}
                className="mt-3 font-mono text-xs text-stone-500 underline underline-offset-2 hover:text-stone-700"
              >
                Add your first flick
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 auto-rows-[170px] sm:auto-rows-[235px]">
              {flicks.map(item => (
                <div key={item.id} className="relative rounded-lg overflow-hidden bg-stone-50 group">
                  <MovieCard1x1 item={item} />
                  <button
                    onClick={() => handleDelete(item.id)}
                    disabled={removingId === item.id}
                    className="absolute top-1.5 right-1.5 z-10 w-5 h-5 rounded-full bg-black/50 text-white text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition disabled:opacity-40"
                  >
                    {removingId === item.id ? '…' : '×'}
                  </button>
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
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 auto-rows-[170px] sm:auto-rows-[235px]">
              {music.map(item => (
                <div key={item.id} className="relative rounded-lg overflow-hidden bg-stone-50 group">
                  <MusicCard1x1 item={item} />
                  <button
                    onClick={() => handleDelete(item.id)}
                    disabled={removingId === item.id}
                    className="absolute top-1.5 right-1.5 z-10 w-5 h-5 rounded-full bg-black/50 text-white text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition disabled:opacity-40"
                  >
                    {removingId === item.id ? '…' : '×'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Items tab ───────────────────────────────────────────────────── */}
      {tab === 'items' && (
        <>
          {physicalItems.length === 0 ? (
            <div className="py-16 text-center">
              <p className="font-serif text-lg text-stone-400">No items yet.</p>
              <button
                onClick={() => setShowAddItemSheet(true)}
                className="mt-3 font-mono text-xs text-stone-500 underline underline-offset-2 hover:text-stone-700"
              >
                Add your first item
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 auto-rows-[170px] sm:auto-rows-[235px]">
              {physicalItems.map(item => (
                <div key={item.id} className="relative rounded-lg overflow-hidden bg-stone-50 group">
                  <ItemCard1x1 item={item} />
                  <button
                    onClick={() => handleDelete(item.id)}
                    disabled={removingId === item.id}
                    className="absolute top-1.5 right-1.5 z-10 w-5 h-5 rounded-full bg-black/50 text-white text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition disabled:opacity-40"
                  >
                    {removingId === item.id ? '…' : '×'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Add item sheet ───────────────────────────────────────────────── */}
      {showAddItemSheet && (
        <AddItemSheet
          username={username}
          onSave={item => {
            setLocalItems(prev => [item as Item, ...prev])
            setShowAddItemSheet(false)
          }}
          onClose={() => setShowAddItemSheet(false)}
        />
      )}

      {/* ── Places tab ──────────────────────────────────────────────────── */}
      {tab === 'places' && (
        <>
          {places.length === 0 ? (
            <div className="py-16 text-center">
              <p className="font-serif text-lg text-stone-400">No places yet.</p>
              <button
                onClick={() => setShowAddPlaceSheet(true)}
                className="mt-3 font-mono text-xs text-stone-500 underline underline-offset-2 hover:text-stone-700"
              >
                Add your first place
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {places.map(item => (
                <div key={item.id} className="group flex items-center gap-3 rounded-2xl border border-[#e0ddd8] bg-white p-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-serif text-sm font-medium text-stone-900 truncate">{item.title}</p>
                    {(item.metadata?.country as string | null) && (
                      <p className="font-mono text-[9px] text-stone-400 uppercase tracking-wider mt-0.5">{item.metadata.country as string}</p>
                    )}
                  </div>
                  <StatusPill status={item.status} />
                  <button
                    onClick={() => handleDelete(item.id)}
                    disabled={removingId === item.id}
                    className="w-5 h-5 rounded-full bg-stone-100 text-stone-400 text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition disabled:opacity-40 shrink-0"
                  >
                    {removingId === item.id ? '…' : '×'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Add place sheet ──────────────────────────────────────────────── */}
      {showAddPlaceSheet && (
        <AddPlaceSheet
          username={username}
          onSave={item => {
            setLocalItems(prev => [item as Item, ...prev])
            setShowAddPlaceSheet(false)
          }}
          onClose={() => setShowAddPlaceSheet(false)}
        />
      )}

      {/* ── Notes tab ───────────────────────────────────────────────────── */}
      {tab === 'notes' && (
        <>
          {notes.length === 0 ? (
            <div className="py-16 text-center">
              <p className="font-serif text-lg text-stone-400">No notes yet.</p>
              <button
                onClick={() => setShowNoteEditor(true)}
                className="mt-3 font-mono text-xs text-stone-500 underline underline-offset-2 hover:text-stone-700"
              >
                Write your first note
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {notes.map(item => (
                <div key={item.id} className="group flex items-start gap-3 rounded-2xl border border-[#e0ddd8] bg-white p-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-serif text-sm font-medium text-stone-900 truncate">{item.title}</p>
                    {(item.metadata?.excerpt as string | null) && (
                      <p className="font-mono text-[9px] text-stone-400 mt-0.5 line-clamp-2">{item.metadata.excerpt as string}</p>
                    )}
                    <p className="font-mono text-[8px] text-stone-300 mt-1">
                      {new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(item.id)}
                    disabled={removingId === item.id}
                    className="w-5 h-5 rounded-full bg-stone-100 text-stone-400 text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition disabled:opacity-40 shrink-0 mt-0.5"
                  >
                    {removingId === item.id ? '…' : '×'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Note editor modal ────────────────────────────────────────────── */}
      {showNoteEditor && (
        <NoteEditor
          username={username}
          onSave={item => {
            setLocalItems(prev => [item as Item, ...prev])
            setShowNoteEditor(false)
          }}
          onClose={() => setShowNoteEditor(false)}
        />
      )}

      {/* ── Links tab ───────────────────────────────────────────────────── */}
      {tab === 'links' && (
        <>
          {links.length === 0 ? (
            <div className="py-16 text-center">
              <p className="font-serif text-lg text-stone-400">No links yet.</p>
              <button
                onClick={() => setShowAddLink(true)}
                className="mt-3 font-mono text-xs text-stone-500 underline underline-offset-2 hover:text-stone-700"
              >
                Add your first link
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {links.map(item => (
                <div key={item.id} className="group flex items-center gap-3 rounded-2xl border border-[#e0ddd8] bg-white p-3">
                  {(item.metadata?.favicon as string | null) && (
                    <Image src={item.metadata.favicon as string} alt="" width={20} height={20} className="rounded-sm shrink-0" style={{ width: 20, height: 20 }} />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-serif text-sm font-medium text-stone-900 truncate">{item.title}</p>
                    {(item.metadata?.site_name as string | null) && (
                      <p className="font-mono text-[9px] text-stone-400 uppercase tracking-wider mt-0.5">{item.metadata.site_name as string}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleDelete(item.id)}
                    disabled={removingId === item.id}
                    className="w-5 h-5 rounded-full bg-stone-100 text-stone-400 text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition disabled:opacity-40 shrink-0"
                  >
                    {removingId === item.id ? '…' : '×'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Add link sheet ───────────────────────────────────────────────── */}
      {showAddLink && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-black/20" onClick={closeAddLink} />
          <div className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl shadow-xl border border-[#e0ddd8] p-6 pb-8">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-serif text-xl font-semibold text-stone-900">Add a link</h2>
              <button onClick={closeAddLink} className="font-mono text-xs text-stone-400 hover:text-stone-600">Close</button>
            </div>

            <input
              type="url"
              value={linkUrl}
              onChange={e => handleLinkUrlChange(e.target.value)}
              autoFocus
              placeholder="https://…"
              className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 font-mono text-sm text-stone-900 placeholder:text-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-900 transition mb-4"
            />

            {fetchingLink && (
              <p className="font-mono text-xs text-stone-400 text-center py-4">Fetching preview…</p>
            )}

            {linkFetchError && (
              <p className="font-mono text-xs text-red-500 mb-4">{linkFetchError}</p>
            )}

            {linkPreview && !fetchingLink && (
              <div className="rounded-xl border border-stone-200 overflow-hidden mb-5">
                {linkPreview.image && (
                  <div className="relative w-full h-36">
                    <Image src={linkPreview.image} alt="" fill className="object-cover" />
                  </div>
                )}
                <div className="p-3 flex items-start gap-2">
                  {linkPreview.favicon && (
                    <Image src={linkPreview.favicon} alt="" width={16} height={16} className="rounded-sm mt-0.5 shrink-0" style={{ width: 16, height: 16 }} />
                  )}
                  <div className="min-w-0">
                    <p className="font-serif text-sm font-medium text-stone-900 line-clamp-2">{linkPreview.title}</p>
                    {linkPreview.site_name && (
                      <p className="font-mono text-[9px] text-stone-400 uppercase tracking-wider mt-0.5">{linkPreview.site_name}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={handleAddLink}
              disabled={addingLink || !linkPreview || fetchingLink}
              className="w-full rounded-xl bg-stone-900 py-3 font-mono text-xs text-white hover:bg-stone-700 disabled:opacity-40 transition"
            >
              {addingLink ? 'Adding…' : 'Add to library'}
            </button>
          </div>
        </div>
      )}

      {/* ── Photos tab ──────────────────────────────────────────────────── */}
      {tab === 'photos' && (
        <>
          {photos.length === 0 ? (
            <div className="py-16 text-center">
              <p className="font-serif text-lg text-stone-400">No photos yet.</p>
              <button
                onClick={() => setShowUploadPhoto(true)}
                className="mt-3 font-mono text-xs text-stone-500 underline underline-offset-2 hover:text-stone-700"
              >
                Upload your first photo
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 auto-rows-[170px] sm:auto-rows-[235px]">
              {photos.map(item => (
                <div key={item.id} className="relative rounded-lg overflow-hidden bg-stone-50 group">
                  <PhotoCard item={item} />
                  <button
                    onClick={() => handleDelete(item.id)}
                    disabled={removingId === item.id}
                    className="absolute top-1.5 right-1.5 z-10 w-5 h-5 rounded-full bg-black/50 text-white text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition disabled:opacity-40"
                  >
                    {removingId === item.id ? '…' : '×'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Upload photo sheet ───────────────────────────────────────────── */}
      {showUploadPhoto && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-black/20" onClick={closeUploadPhoto} />
          <div className="relative w-full sm:max-w-sm bg-white rounded-t-3xl sm:rounded-2xl shadow-xl border border-[#e0ddd8] p-6 pb-8">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-serif text-xl font-semibold text-stone-900">Upload a photo</h2>
              <button onClick={closeUploadPhoto} className="font-mono text-xs text-stone-400 hover:text-stone-600">Close</button>
            </div>

            <form onSubmit={handleUploadPhoto} className="flex flex-col gap-4">
              {/* File picker / preview */}
              <label className="relative cursor-pointer">
                {photoPreview ? (
                  <div className="relative w-full aspect-square rounded-xl overflow-hidden">
                    <Image src={photoPreview} alt="Preview" fill className="object-cover" />
                  </div>
                ) : (
                  <div className="w-full aspect-square rounded-xl border-2 border-dashed border-stone-200 flex flex-col items-center justify-center gap-2 hover:border-stone-400 transition">
                    <p className="font-mono text-xs text-stone-400">Click to choose a photo</p>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </label>

              <input
                required
                value={photoTitle}
                onChange={e => setPhotoTitle(e.target.value)}
                placeholder="Title"
                className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 font-serif text-base text-stone-900 placeholder:text-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-900 transition"
              />

              {uploadPhotoError && (
                <p className="font-mono text-xs text-red-500">{uploadPhotoError}</p>
              )}

              <button
                type="submit"
                disabled={uploadingPhoto || !photoFile || !photoTitle.trim()}
                className="w-full rounded-xl bg-stone-900 py-3 font-mono text-xs text-white hover:bg-stone-700 disabled:opacity-40 transition"
              >
                {uploadingPhoto ? 'Uploading…' : 'Upload to library'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Edit collection modal ────────────────────────────────────────── */}
      {editingCollection && (
        <EditCollectionModal
          collection={editingCollection}
          libraryItems={localItems}
          initialItemIds={collectionItems(editingCollection.id).map(i => i.id)}
          username={username}
          onClose={() => setEditingCollection(null)}
          onItemAdded={handleItemAdded}
          onItemRemoved={handleItemRemoved}
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

      {/* ── Add item sheet (reads + flicks) ─────────────────────────────── */}
      {showAddSheet && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-black/20" onClick={closeAddSheet} />
          <div className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl shadow-xl border border-[#e0ddd8] p-6 pb-8">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-serif text-xl font-semibold text-stone-900">
                {addType === 'book' ? 'Add a read' : addType === 'movie' ? 'Add a flick or show' : 'Add music'}
              </h2>
              <button onClick={closeAddSheet} className="font-mono text-xs text-stone-400 hover:text-stone-600">Close</button>
            </div>

            {/* Search */}
            <input
              type="search"
              value={query}
              onChange={e => handleSearch(e.target.value)}
              autoFocus
              placeholder={addType === 'book' ? 'Search by title or author…' : addType === 'movie' ? 'Search flicks and shows…' : 'Search songs and albums…'}
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
                      {addType === 'book' && (result.metadata.author as string | null) && (
                        <p className="font-mono text-[9px] text-stone-400 mt-0.5">{result.metadata.author as string}</p>
                      )}
                      {addType === 'movie' && (result.metadata.release_year as string | null) && (
                        <p className="font-mono text-[9px] text-stone-400 mt-0.5">{result.metadata.release_year as string}</p>
                      )}
                      {addType === 'music' && (result.metadata.artist as string | null) && (
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
                    {addType === 'book' && (selectedItem.metadata.author as string | null) && (
                      <p className="font-mono text-[9px] text-stone-400 mt-0.5">{selectedItem.metadata.author as string}</p>
                    )}
                    {addType === 'movie' && (selectedItem.metadata.release_year as string | null) && (
                      <p className="font-mono text-[9px] text-stone-400 mt-0.5">{selectedItem.metadata.release_year as string}</p>
                    )}
                    {addType === 'music' && (selectedItem.metadata.artist as string | null) && (
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
