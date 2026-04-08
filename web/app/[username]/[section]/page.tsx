import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { SECTIONS, slugToType } from '../lib/sections'
import { BookCard1x1 } from '../components/cards/BookCard'
import { MovieCard1x1 } from '../components/cards/MovieCard'
import { MusicCard1x1 } from '../components/cards/MusicCard'
import { PhotoCard } from '../components/cards/PhotoCard'
import { LinkCard1x1 } from '../components/cards/LinkCard'
import { NoteCard1x1 } from '../components/cards/NoteCard'
import { ItemCard1x1 } from '../components/cards/ItemCard'
import { MapCard } from '../components/cards/MapCard'
import ProfileNav from '../components/ProfileNav'
import { getNavData } from '../lib/getNavData'

type Item = {
  id: string
  title: string | null
  image_url: string | null
  type: string
  status: string | null
  metadata: Record<string, unknown>
  created_at: string
}

const STATUS_STYLES: Record<string, string> = {
  'visited':    'bg-stone-100 text-stone-500',
  'want to go': 'bg-yellow-50 text-yellow-700',
}

function ItemCard({ item }: { item: Item }) {
  const el = (() => {
    switch (item.type) {
      case 'book':  return <BookCard1x1 item={item} />
      case 'movie': return <MovieCard1x1 item={item} />
      case 'music': return <MusicCard1x1 item={item} />
      case 'photo': return <PhotoCard item={item} />
      case 'link':  return <LinkCard1x1 item={item} />
      case 'note':  return <NoteCard1x1 item={item} />
      case 'item':  return <ItemCard1x1 item={item} />
      default:      return null
    }
  })()
  if (!el) return null
  return (
    <div className="relative rounded-lg overflow-hidden bg-stone-50 group">
      {el}
    </div>
  )
}

export default async function SectionPage({
  params,
}: {
  params: Promise<{ username: string; section: string }>
}) {
  const { username, section } = await params
  const supabase = await createClient()

  const itemType = slugToType(section)
  if (!itemType) notFound()

  const { data: profile } = await supabase
    .from('users')
    .select('id, username, full_name')
    .eq('username', username)
    .single()

  if (!profile) notFound()

  const { data: { user } } = await supabase.auth.getUser()
  const isOwner = user?.id === profile.id
  const navData = await getNavData(profile.id, isOwner, supabase)

  const { data: items } = await supabase
    .from('items')
    .select('id, title, image_url, type, status, metadata, created_at')
    .eq('user_id', profile.id)
    .eq('type', itemType)
    .order('created_at', { ascending: false })

  const sectionMeta = SECTIONS.find(s => s.slug === section)!
  const count = items?.length ?? 0

  // ── Places page ──────────────────────────────────────────────────────────────
  if (itemType === 'place') {
    const places = (items ?? []).map(i => ({
      id: i.id,
      title: i.title,
      metadata: i.metadata,
    }))

    return (
      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex mb-8">
          <ProfileNav username={username} sections={navData.sections} collections={navData.collections} isOwner={isOwner} />
        </div>
        <div className="mb-10">
          <h1 className="font-serif text-6xl font-light text-stone-900 leading-none">places</h1>
          <p className="font-serif text-sm text-stone-500 mt-3">
            {count} {count === 1 ? 'city' : 'cities'} saved · @{username}
          </p>
        </div>

        {/* Map — full width */}
        {count > 0 && (
          <div className="relative w-full h-64 sm:h-80 rounded-xl overflow-hidden mb-8">
            <MapCard places={places} size="2x1" />
          </div>
        )}

        {/* Place list */}
        {count === 0 ? (
          <p className="font-serif text-lg text-stone-400">No places yet.</p>
        ) : (
          <div className="flex flex-col divide-y divide-stone-100">
            {(items ?? []).map(place => {
              const city = (place.metadata?.city as string) ?? place.title ?? ''
              const country = (place.metadata?.country as string) ?? ''
              const statusStyle = STATUS_STYLES[place.status ?? ''] ?? 'bg-stone-100 text-stone-500'
              return (
                <div key={place.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-serif text-base text-stone-900">{city}</p>
                    {country && <p className="font-mono text-[9px] text-stone-400 mt-0.5">{country}</p>}
                  </div>
                  {place.status && (
                    <span className={`font-mono text-[8px] uppercase tracking-wider px-2 py-0.5 rounded-full ${statusStyle}`}>
                      {place.status}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  // ── Standard content page ─────────────────────────────────────────────────────
  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <div className="mb-8">
        <ProfileNav username={username} sections={navData.sections} collections={navData.collections} isOwner={isOwner} />
      </div>
      <div className="mb-10">
        <h1 className="font-serif text-6xl font-light text-stone-900 leading-none">{sectionMeta.label.toLowerCase()}</h1>
        <p className="font-serif text-sm text-stone-500 mt-3">
          {count} {count === 1 ? 'item' : 'items'} · @{username}
        </p>
      </div>

      {count === 0 ? (
        <p className="font-serif text-lg text-stone-400">Nothing here yet.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 auto-rows-[170px] sm:auto-rows-[235px]">
          {(items ?? []).map(item => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  )
}
