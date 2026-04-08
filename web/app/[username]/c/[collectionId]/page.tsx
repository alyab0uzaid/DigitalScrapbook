import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import ProfileNav from '../../components/ProfileNav'
import { getNavData } from '../../lib/getNavData'
import { BookCard1x1 } from '../../components/cards/BookCard'
import { MovieCard1x1 } from '../../components/cards/MovieCard'
import { MusicCard1x1 } from '../../components/cards/MusicCard'
import { PhotoCard } from '../../components/cards/PhotoCard'
import { LinkCard1x1 } from '../../components/cards/LinkCard'
import { NoteCard1x1 } from '../../components/cards/NoteCard'
import { ItemCard1x1 } from '../../components/cards/ItemCard'

type Item = {
  id: string
  title: string | null
  image_url: string | null
  type: string
  status: string | null
  metadata: Record<string, unknown>
  created_at: string
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

export default async function CollectionPage({
  params,
}: {
  params: Promise<{ username: string; collectionId: string }>
}) {
  const { username, collectionId } = await params
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('users')
    .select('id, username')
    .eq('username', username)
    .single()

  if (!profile) notFound()

  const { data: { user } } = await supabase.auth.getUser()
  const isOwner = user?.id === profile.id
  const navData = await getNavData(profile.id, isOwner, supabase)

  const { data: collection } = await supabase
    .from('collections')
    .select('id, name, description, is_public, type')
    .eq('id', collectionId)
    .eq('user_id', profile.id)
    .single()

  if (!collection) notFound()
  if (!collection.is_public && !isOwner) notFound()

  const { data: collectionItems } = await supabase
    .from('collection_items')
    .select('display_order, item:items(id, title, image_url, type, status, metadata, created_at)')
    .eq('collection_id', collectionId)
    .order('display_order', { ascending: true })

  const items: Item[] = (collectionItems ?? [])
    .map(ci => ci.item as unknown as Item | null)
    .filter((i): i is Item => i !== null)
    .filter((item, idx, arr) => arr.findIndex(x => x.id === item.id) === idx)

  const count = items.length

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <div className="flex mb-8">
        <ProfileNav username={username} sections={navData.sections} collections={navData.collections} isOwner={isOwner} />
      </div>
      <div className="mb-10">
        <h1 className="font-serif text-6xl font-light text-stone-900 leading-none">{collection.name.toLowerCase()}</h1>
        <p className="font-serif text-sm text-stone-500 mt-3">
          {collection.description ?? `${count} ${count === 1 ? 'item' : 'items'} · @${username}`}
        </p>
      </div>

      {count === 0 ? (
        <p className="font-serif text-lg text-stone-400">Nothing here yet.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 auto-rows-[170px] sm:auto-rows-[235px]">
          {items.map(item => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  )
}
