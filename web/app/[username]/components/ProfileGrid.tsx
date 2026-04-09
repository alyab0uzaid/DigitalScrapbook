'use client'

import { useState, useTransition, useRef, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverEvent,
  DragCancelEvent,
  DragOverlay,
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  rectSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { removeWidget, reorderWidgets } from '@/app/actions/widgets'
import { BookCard1x1, BookCard1x2, BookCard2x1 } from './cards/BookCard'
import { MovieCard1x1, MovieCard2x1 } from './cards/MovieCard'
import { MusicCard1x1, MusicCard2x1 } from './cards/MusicCard'
import { PhotoCard } from './cards/PhotoCard'
import { LinkCard1x1, LinkCard2x1 } from './cards/LinkCard'
import { NoteCard1x1, NoteCard1x2, NoteCard2x1 } from './cards/NoteCard'
import { ItemCard1x1, ItemCard2x1 } from './cards/ItemCard'
import { MapCard } from './cards/MapCard'
import { ContentTypeCard1x1, ContentTypeCard1x2, ContentTypeCard2x1 } from './cards/ContentTypeCard'
import { CollectionCard1x1, CollectionCard2x1 } from './cards/CollectionCard'
import AddWidgetSheet from './AddWidgetSheet'
import { typeToSlug } from '../lib/sections'

// ─── Types ────────────────────────────────────────────────────────────────────

type PlaceItem = {
  id: string
  title: string | null
  metadata: Record<string, unknown>
}

type Item = {
  id: string
  title: string | null
  image_url: string | null
  type: string
  status: string | null
  metadata: Record<string, unknown>
  created_at?: string
}

type Collection = {
  id: string
  name: string
  type: string
  description: string | null
  collection_items?: { display_order: number; item: { id: string; title: string | null; image_url: string | null; type: string } | null }[]
}

type Widget = {
  id: string
  widget_size: string
  widget_title: string | null
  item_type: string | null
  item: Item | null
  collection: Collection | null
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SIZE_CLASSES: Record<string, string> = {
  '1x1': 'col-span-1 row-span-1',
  '1x2': 'col-span-1 row-span-2',
  '2x1': 'col-span-2 row-span-1',
  '2x2': 'col-span-2 row-span-2',
}

const COLLECTION_TYPE_LABELS: Record<string, string> = {
  favorites: 'Favorites',
  collection: 'Collection',
  log: 'Log',
  blog: 'Blog',
}

// ─── Widget link helper ───────────────────────────────────────────────────────

function widgetHref(widget: Widget, username: string): string | null {
  if (widget.item_type) {
    if (widget.item_type === 'link') return null // link cards handle their own external navigation
    const slug = typeToSlug(widget.item_type)
    return slug ? `/${username}/${slug}` : null
  }
  if (widget.collection) {
    if (widget.collection.type === 'map') return null
    return `/${username}/c/${widget.collection.id}`
  }
  if (widget.item) {
    if (widget.item.type === 'link') return null // link cards handle their own external navigation
    const slug = typeToSlug(widget.item.type)
    return slug ? `/${username}/${slug}` : null
  }
  return null
}

function isLinkWidget(widget: Widget): boolean {
  return widget.item?.type === 'link' || widget.item_type === 'link'
}

// ─── Card content ─────────────────────────────────────────────────────────────

function CardContent({ widget, places, items }: {
  widget: Widget
  places: PlaceItem[]
  items: { id: string; title: string | null; type: string; image_url: string | null; status: string | null }[]
}) {
  const size = (widget.widget_size as '1x1' | '1x2' | '2x1') || '1x1'
  const item = widget.item
  const col = widget.collection

  if (widget.item_type) {
    const typeItems = items.filter(i => i.type === widget.item_type)
    if (size === '1x1') return <ContentTypeCard1x1 itemType={widget.item_type} items={typeItems} />
    if (size === '1x2') return <ContentTypeCard1x2 itemType={widget.item_type} items={typeItems} />
    if (size === '2x1') return <ContentTypeCard2x1 itemType={widget.item_type} items={typeItems} />
    return <ContentTypeCard1x1 itemType={widget.item_type} items={typeItems} />
  }

  if (item) {
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
    if (item.type === 'photo') return <PhotoCard item={item} />
    if (item.type === 'link') {
      if (size === '1x1') return <LinkCard1x1 item={item} />
      if (size === '2x1') return <LinkCard2x1 item={item} />
    }
    if (item.type === 'item') {
      if (size === '1x1') return <ItemCard1x1 item={item} />
      if (size === '2x1') return <ItemCard2x1 item={item} />
    }
    if (item.type === 'note') {
      if (size === '1x1') return <NoteCard1x1 item={item} />
      if (size === '1x2') return <NoteCard1x2 item={item} />
      if (size === '2x1') return <NoteCard2x1 item={item} />
    }
    return (
      <div className="flex flex-col justify-end h-full p-4">
        <p className="font-serif text-sm font-medium text-stone-900 line-clamp-2">{item.title}</p>
        <p className="font-mono text-[9px] text-stone-400 uppercase tracking-wider mt-0.5">{item.type}</p>
      </div>
    )
  }

  if (col) {
    if (col.type === 'map') {
      return <MapCard places={places} size={widget.widget_size === '2x2' ? '2x2' : '2x1'} />
    }
    if (size === '2x1') return <CollectionCard2x1 collection={col} />
    return <CollectionCard1x1 collection={col} />
  }

  return null
}

// ─── Sortable widget card ─────────────────────────────────────────────────────

function SortableWidgetCard({
  widget,
  editMode,
  isDraggingAny,
  onRemove,
  removing,
  places,
  items,
  onMeasure,
  username,
}: {
  widget: Widget
  editMode: boolean
  isDraggingAny: boolean
  onRemove: () => void
  removing: boolean
  places: PlaceItem[]
  items: { id: string; title: string | null; type: string; image_url: string | null; status: string | null }[]
  onMeasure: (id: string, el: HTMLDivElement | null) => void
  username: string
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useSortable({
    id: widget.id,
    disabled: !editMode,
  })

  const sizeClass = SIZE_CLASSES[widget.widget_size] ?? 'col-span-1 row-span-1'
  const href = widgetHref(widget, username)

  const refCallback = useCallback((el: HTMLDivElement | null) => {
    setNodeRef(el)
    onMeasure(widget.id, el)
  }, [widget.id, setNodeRef, onMeasure])

  return (
    // Outer div: grid sizing + overflow visible so the delete badge isn't clipped
    <motion.div
      layout={!isDragging}
      transition={{ type: 'spring', damping: 30, stiffness: 300, mass: 0.8 }}
      ref={refCallback}
      data-widget-id={widget.id}
      className={`${sizeClass} group relative ${isDragging ? 'opacity-0' : ''}`}
    >
      {/* Inner card: overflow-hidden for content clipping */}
      <div className={`absolute inset-0 rounded-lg overflow-hidden bg-stone-50 transition-colors ${
        !isDraggingAny ? 'hover:bg-stone-100' : ''
      } ${editMode ? 'ring-2 ring-stone-200' : ''}`}>

        {/* Drag handle (edit mode) */}
        {editMode && (
          <div
            {...attributes}
            {...listeners}
            className="absolute inset-0 z-10 cursor-grab active:cursor-grabbing"
          />
        )}

        {/* Navigation link (view mode) */}
        {!editMode && href && (
          <Link href={href} className="absolute inset-0 z-10" aria-label="View" />
        )}

        {/* Widget title */}
        {widget.widget_title && (
          <p className="relative z-20 font-mono text-[9px] text-stone-400 uppercase tracking-wider p-4 pb-0 truncate pointer-events-none">
            {widget.widget_title}
          </p>
        )}

        {/* Card content */}
        <div className={`absolute inset-0 ${isLinkWidget(widget) ? '' : 'pointer-events-none'}`}>
          <CardContent widget={widget} places={places} items={items} />
        </div>
      </div>

      {/* Remove button — outside overflow-hidden, centered on top-left corner */}
      {editMode && (
        <button
          onPointerDown={e => e.stopPropagation()}
          onClick={e => { e.stopPropagation(); onRemove() }}
          disabled={removing}
          className="absolute -top-2.5 -left-2.5 z-20 w-5 h-5 rounded-full bg-red-500 hover:bg-red-600 active:bg-red-700 flex items-center justify-center shadow-md transition-colors disabled:opacity-40"
        >
          {removing ? (
            <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
              <circle cx="4" cy="4" r="3" stroke="white" strokeWidth="1.5" strokeDasharray="6 3" />
            </svg>
          ) : (
            <svg width="8" height="2" viewBox="0 0 8 2" fill="none">
              <rect x="0" y="0.5" width="8" height="1" rx="0.5" fill="white" />
            </svg>
          )}
        </button>
      )}
    </motion.div>
  )
}

// ─── Profile grid ─────────────────────────────────────────────────────────────

export default function ProfileGrid({
  widgets: initialWidgets,
  username,
  isOwner,
  collections,
  items,
  places,
  editMode,
  onEditToggle,
}: {
  widgets: Widget[]
  username: string
  isOwner: boolean
  collections: { id: string; name: string; type: string }[]
  items: { id: string; title: string | null; type: string; image_url: string | null; status: string | null }[]
  places: PlaceItem[]
  editMode: boolean
  onEditToggle: () => void
}) {
  const router = useRouter()

  // Sync when server pushes fresh props after router.refresh()
  useEffect(() => {
    if (!activeId) {
      setWidgets(initialWidgets)
      committedRef.current = initialWidgets
    }
  }, [initialWidgets])

  const [showAddSheet, setShowAddSheet] = useState(false)

  useEffect(() => {
    if (!editMode) setShowAddSheet(false)
  }, [editMode])
  const [widgets, setWidgets] = useState(initialWidgets)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [activeDimensions, setActiveDimensions] = useState<{ width: number; height: number } | null>(null)
  const [, startTransition] = useTransition()

  const nodeRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const committedRef = useRef(initialWidgets)
  // Always-current widgets without closure capture
  const widgetsRef = useRef(widgets)
  widgetsRef.current = widgets

  const handleMeasure = useCallback((id: string, el: HTMLDivElement | null) => {
    if (el) nodeRefs.current.set(id, el)
    else nodeRefs.current.delete(id)
  }, [])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  )

  // All handlers are stable — they only read from refs, never from closed-over state
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const id = event.active.id as string
    committedRef.current = widgetsRef.current
    setActiveId(id)
    const el = nodeRefs.current.get(id)
    if (el) {
      const rect = el.getBoundingClientRect()
      setActiveDimensions({ width: rect.width, height: rect.height })
    }
  }, []) // no deps — only touches refs and setters

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    setWidgets(prev => {
      const oldIndex = prev.findIndex(w => w.id === active.id)
      const newIndex = prev.findIndex(w => w.id === over.id)
      if (oldIndex === -1 || newIndex === -1) return prev
      return arrayMove(prev, oldIndex, newIndex)
    })
  }, []) // no deps — only touches setter

  const usernameRef = useRef(username)
  usernameRef.current = username

  const handleDragEnd = useCallback((_event: DragEndEvent) => {
    setActiveId(null)
    setActiveDimensions(null)
    const final = widgetsRef.current
    const committed = committedRef.current
    const changed = final.some((w, i) => w.id !== committed[i]?.id)
    if (!changed) return
    committedRef.current = final
    // Fire-and-forget — no startTransition needed
    reorderWidgets(final.map(w => w.id), usernameRef.current)
  }, []) // no deps — only touches refs

  const handleDragCancel = useCallback((_event: DragCancelEvent) => {
    setActiveId(null)
    setActiveDimensions(null)
    setWidgets(committedRef.current)
  }, []) // no deps

  function handleRemove(widgetId: string) {
    setRemovingId(widgetId)
    startTransition(async () => {
      await removeWidget(widgetId, username)
      setWidgets(prev => prev.filter(w => w.id !== widgetId))
      committedRef.current = committedRef.current.filter(w => w.id !== widgetId)
      setRemovingId(null)
      router.refresh()
    })
  }

  const activeWidget = activeId ? committedRef.current.find(w => w.id === activeId) ?? null : null

  if (widgets.length === 0 && !editMode) {
    return (
      <div className="text-center py-24">
        {isOwner ? (
          <div className="flex flex-col items-center gap-4">
            <p className="font-serif text-lg text-stone-400">Your profile is empty.</p>
            <button
              onClick={onEditToggle}
              className="rounded-xl bg-stone-900 px-5 py-2.5 font-mono text-xs text-white hover:bg-stone-700 transition"
            >
              + Add to profile
            </button>
            <p className="font-mono text-xs text-stone-400">
              or add things to your{' '}
              <a href="/library" className="underline underline-offset-2 hover:text-stone-600">library</a>
              {' '}first
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
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <SortableContext items={widgets.map(w => w.id)} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 auto-rows-[155px] sm:auto-rows-[235px]">
            {widgets.map(widget => (
              <SortableWidgetCard
                key={widget.id}
                widget={widget}
                editMode={editMode}
                isDraggingAny={activeId !== null}
                onRemove={() => handleRemove(widget.id)}
                removing={removingId === widget.id}
                places={places}
                items={items}
                onMeasure={handleMeasure}
                username={username}
              />
            ))}

            {editMode && isOwner && (
              <button
                onClick={() => setShowAddSheet(true)}
                className="col-span-1 row-span-1 rounded-[14px] border-2 border-dashed border-stone-200 flex items-center justify-center text-stone-300 hover:border-stone-400 hover:text-stone-400 transition"
              >
                <span className="font-mono text-2xl leading-none">+</span>
              </button>
            )}
          </div>
        </SortableContext>

        <DragOverlay dropAnimation={{ duration: 180, easing: 'cubic-bezier(0.25, 1, 0.5, 1)' }}>
          {activeWidget && activeDimensions && (
            <div
              style={{ width: activeDimensions.width, height: activeDimensions.height }}
              className="relative bg-stone-50 rounded-lg overflow-hidden shadow-2xl ring-2 ring-stone-300"
            >
              <div className="absolute inset-0">
                <CardContent widget={activeWidget} places={places} items={items} />
              </div>
            </div>
          )}
        </DragOverlay>
      </DndContext>

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
