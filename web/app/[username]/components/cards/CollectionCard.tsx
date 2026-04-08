import Image from 'next/image'

type CollectionItem = {
  id: string
  title: string | null
  image_url: string | null
  type: string
}

type Collection = {
  id: string
  name: string
  type: string
  description: string | null
  collection_items?: { display_order: number; item: CollectionItem | null }[]
}

const TYPE_LABELS: Record<string, string> = {
  favorites:  'Favorites',
  collection: 'Collection',
  log:        'Log',
  blog:       'Blog',
}

// Each card: [rotation, z-index, hover-lift class]
// Outer cards tilt more, inner tilt less, center cards on top
const CARD_CONFIG = [
  { rot: -16, z: 1,  lift: 'group-hover:-translate-y-3' },
  { rot: -5,  z: 4,  lift: 'group-hover:-translate-y-5' },
  { rot: 5,   z: 3,  lift: 'group-hover:-translate-y-5' },
  { rot: 16,  z: 2,  lift: 'group-hover:-translate-y-3' },
]

function getCoverDimensions(type: string, small?: boolean): React.CSSProperties {
  if (small) {
    switch (type) {
      case 'music':
      case 'photo':
        return { width: 68, height: 68 }
      default:
        return { width: 48, height: 72 }
    }
  }
  switch (type) {
    case 'music':
    case 'photo':
      return { width: 126, height: 126 }
    default:
      return { width: 90, height: 136 }
  }
}

function CollectionFan({ collection, small }: { collection: Collection; small?: boolean }) {
  const allItems = (collection.collection_items ?? [])
    .sort((a, b) => a.display_order - b.display_order)
    .map(ci => ci.item)
    .filter((i): i is CollectionItem => i !== null)

  const covers = allItems.filter(i => i.image_url).slice(0, 4)
  const totalCount = allItems.length
  const typeLabel = TYPE_LABELS[collection.type] ?? collection.type
  const overlap = small ? -18 : -30
  const bleed = small ? '-bottom-4' : '-bottom-6'

  return (
    <div className="absolute inset-0 flex flex-col p-4 sm:p-5">
      <div>
        <p className="font-mono text-[9px] text-stone-400 uppercase tracking-wider leading-none mb-1">
          {typeLabel}
        </p>
        <p className={`font-serif font-medium text-stone-900 leading-snug line-clamp-2 ${small ? 'text-sm' : 'text-base'}`}>
          {collection.name}
        </p>
        {totalCount > 0 && (
          <p className="font-mono text-[9px] text-stone-300 mt-0.5">
            {totalCount} {totalCount === 1 ? 'item' : 'items'}
          </p>
        )}
      </div>

      <div className={`absolute ${bleed} left-0 right-0 flex justify-center items-end`}>
        {covers.length > 0 ? covers.map((cover, i) => {
          const config = CARD_CONFIG[i] ?? CARD_CONFIG[0]
          const dims = getCoverDimensions(cover.type, small)
          return (
            <div
              key={cover.id}
              className="relative shrink-0"
              style={{
                marginLeft: i > 0 ? overlap : 0,
                zIndex: config.z,
                transformOrigin: 'bottom center',
                transform: `rotate(${config.rot}deg)`,
              }}
            >
              <div className={`transition-transform duration-200 ease-out ${config.lift} group-hover:scale-105`}>
                <div style={{ borderRadius: 4, overflow: 'hidden', boxShadow: '0 6px 18px rgba(0,0,0,0.28)' }}>
                  <Image
                    src={cover.image_url!}
                    alt={cover.title ?? ''}
                    width={0}
                    height={0}
                    sizes="120px"
                    style={{ ...dims, display: 'block' }}
                  />
                </div>
              </div>
            </div>
          )
        }) : Array.from({ length: Math.min(totalCount || 4, 4) }).map((_, i) => {
          const config = CARD_CONFIG[i] ?? CARD_CONFIG[0]
          const dims = getCoverDimensions('book', small)
          return (
            <div
              key={i}
              className="relative shrink-0"
              style={{
                marginLeft: i > 0 ? overlap : 0,
                zIndex: config.z,
                transformOrigin: 'bottom center',
                transform: `rotate(${config.rot}deg)`,
              }}
            >
              <div
                className={`transition-transform duration-200 ease-out ${config.lift}`}
                style={{ ...dims, borderRadius: 4, overflow: 'hidden', boxShadow: '0 6px 18px rgba(0,0,0,0.15)' }}
              >
                <div className="w-full h-full bg-stone-200" />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function CollectionCard1x1({ collection }: { collection: Collection }) {
  return <CollectionFan collection={collection} small />
}

export function CollectionCard2x1({ collection }: { collection: Collection }) {
  return <CollectionFan collection={collection} />
}
