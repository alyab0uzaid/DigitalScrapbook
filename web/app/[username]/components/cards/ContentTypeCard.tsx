import Image from 'next/image'

type Item = {
  id: string
  title: string | null
  image_url: string | null
  type: string
}

const TYPE_META: Record<string, { label: string }> = {
  book:  { label: 'Reads'  },
  movie: { label: 'Flicks' },
  music: { label: 'Music'  },
  photo: { label: 'Photos' },
  link:  { label: 'Links'  },
  note:  { label: 'Notes'  },
  item:  { label: 'Items'  },
}

const CARD_CONFIG = [
  { rot: -16, z: 1,  lift: 'group-hover:-translate-y-3' },
  { rot: -5,  z: 4,  lift: 'group-hover:-translate-y-5' },
  { rot: 5,   z: 3,  lift: 'group-hover:-translate-y-5' },
  { rot: 16,  z: 2,  lift: 'group-hover:-translate-y-3' },
]

function getCoverDimensions(type: string, small?: boolean): React.CSSProperties {
  if (small) {
    switch (type) {
      case 'music': case 'photo': case 'link': case 'note': case 'item':
        return { width: 68, height: 68 }
      default:
        return { width: 48, height: 72 }
    }
  }
  switch (type) {
    case 'music': case 'photo': case 'link': case 'note': case 'item':
      return { width: 126, height: 126 }
    default:
      return { width: 90, height: 136 }
  }
}

function FanCards({ covers, count, small }: { covers: Item[]; count: number; small?: boolean }) {
  const overlap = small ? -18 : -30
  const bleed = small ? '-bottom-4' : '-bottom-6'

  return (
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
      }) : Array.from({ length: Math.min(count || 4, 4) }).map((_, i) => {
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
  )
}

export function ContentTypeCard1x1({ itemType, items }: { itemType: string; items: Item[] }) {
  const meta = TYPE_META[itemType] ?? { label: itemType }
  const covers = items.filter(i => i.image_url).slice(0, 4)
  const count = items.length

  return (
    <div className="absolute inset-0 flex flex-col p-4 sm:p-5">
      <div>
        <p className="font-mono text-[9px] text-stone-400 uppercase tracking-wider leading-none mb-1">
          Collection
        </p>
        <p className="font-serif text-sm font-medium text-stone-900 leading-snug line-clamp-2">
          {meta.label}
        </p>
        {count > 0 && (
          <p className="font-mono text-[9px] text-stone-300 mt-0.5">
            {count} {count === 1 ? 'item' : 'items'}
          </p>
        )}
      </div>
      <FanCards covers={covers} count={count} small />
    </div>
  )
}

export function ContentTypeCard2x1({ itemType, items }: { itemType: string; items: Item[] }) {
  const meta = TYPE_META[itemType] ?? { label: itemType }
  const covers = items.filter(i => i.image_url).slice(0, 4)
  const count = items.length

  return (
    <div className="absolute inset-0 flex flex-col p-4 sm:p-5">
      <div>
        <p className="font-mono text-[9px] text-stone-400 uppercase tracking-wider leading-none mb-1">
          Collection
        </p>
        <p className="font-serif text-base font-medium text-stone-900 leading-snug line-clamp-2">
          {meta.label}
        </p>
        {count > 0 && (
          <p className="font-mono text-[9px] text-stone-300 mt-0.5">
            {count} {count === 1 ? 'item' : 'items'}
          </p>
        )}
      </div>
      <FanCards covers={covers} count={count} />
    </div>
  )
}

export function ContentTypeCard1x2({ itemType, items }: { itemType: string; items: Item[] }) {
  const meta = TYPE_META[itemType] ?? { label: itemType }
  const covers = items.filter(i => i.image_url).slice(0, 4)
  const count = items.length

  return (
    <div className="absolute inset-0 flex flex-col p-4 sm:p-5">
      <div>
        <p className="font-mono text-[9px] text-stone-400 uppercase tracking-wider leading-none mb-1">
          Collection
        </p>
        <p className="font-serif text-base font-medium text-stone-900 leading-snug line-clamp-2">
          {meta.label}
        </p>
        {count > 0 && (
          <p className="font-mono text-[9px] text-stone-300 mt-0.5">
            {count} {count === 1 ? 'item' : 'items'}
          </p>
        )}
      </div>
      <FanCards covers={covers} count={count} small />
    </div>
  )
}
