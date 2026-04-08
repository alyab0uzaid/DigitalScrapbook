import Image from 'next/image'

type Item = {
  id: string
  title: string | null
  image_url: string | null
  type: string
}

const TYPE_META: Record<string, { label: string; aspect: string }> = {
  book:  { label: 'Reads',  aspect: 'aspect-[2/3]' },
  movie: { label: 'Flicks', aspect: 'aspect-[2/3]' },
  music: { label: 'Music',  aspect: 'aspect-square' },
  photo: { label: 'Photos', aspect: 'aspect-square' },
  link:  { label: 'Links',  aspect: 'aspect-square' },
  note:  { label: 'Notes',  aspect: 'aspect-square' },
  item:  { label: 'Items',  aspect: 'aspect-square' },
}

function Cover({ src, alt, aspect }: { src: string | null; alt: string; aspect: string }) {
  return (
    <div className={`relative bg-stone-100 overflow-hidden ${aspect}`} style={{ clipPath: 'inset(0 round 3px)' }}>
      {src && (
        <Image src={src} alt={alt} fill className="object-cover" sizes="120px" />
      )}
    </div>
  )
}

// ── 1x1 — 2×2 cover grid + label ─────────────────────────────────────────────
export function ContentTypeCard1x1({ itemType, items }: { itemType: string; items: Item[] }) {
  const meta = TYPE_META[itemType] ?? { label: itemType, aspect: 'aspect-square' }
  const covers = items.filter(i => i.image_url).slice(0, 4)
  const count = items.length

  return (
    <div className="absolute inset-0 flex flex-col gap-3 p-4">
      {covers.length > 0 ? (
        <div className="flex-1 grid grid-cols-2 gap-1.5 overflow-hidden">
          {[0, 1, 2, 3].map(i => (
            <div key={i} className="relative bg-stone-100 overflow-hidden rounded-sm">
              {covers[i]?.image_url && (
                <Image
                  src={covers[i].image_url!}
                  alt={covers[i].title ?? ''}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <p className="font-serif text-4xl font-medium text-stone-200">{meta.label[0]}</p>
        </div>
      )}
      <div className="flex items-baseline justify-between shrink-0">
        <p className="font-serif text-sm font-medium text-stone-900">{meta.label}</p>
        <p className="font-mono text-[9px] text-stone-400">{count}</p>
      </div>
    </div>
  )
}

// ── 2x1 — row of covers + label right ────────────────────────────────────────
export function ContentTypeCard2x1({ itemType, items }: { itemType: string; items: Item[] }) {
  const meta = TYPE_META[itemType] ?? { label: itemType, aspect: 'aspect-[2/3]' }
  const covers = items.filter(i => i.image_url).slice(0, 4)
  const count = items.length

  return (
    <div className="absolute inset-0 flex items-center">
      {/* Covers */}
      <div className="flex items-center gap-3 pl-5 flex-1 h-full py-5">
        {covers.length > 0
          ? covers.map((c, i) => (
              <Cover key={c.id} src={c.image_url} alt={c.title ?? ''} aspect={meta.aspect} />
            ))
          : <div className="w-full h-full flex items-center justify-center">
              <p className="font-serif text-5xl font-medium text-stone-200">{meta.label[0]}</p>
            </div>
        }
      </div>
      {/* Label */}
      <div className="w-28 shrink-0 flex flex-col items-start justify-end gap-1 p-5 pl-3 h-full">
        <p className="font-serif text-xl font-medium text-stone-900 leading-tight">{meta.label}</p>
        <p className="font-mono text-[9px] text-stone-400">{count} items</p>
      </div>
    </div>
  )
}

// ── 1x2 — stacked covers + label ─────────────────────────────────────────────
export function ContentTypeCard1x2({ itemType, items }: { itemType: string; items: Item[] }) {
  const meta = TYPE_META[itemType] ?? { label: itemType, aspect: 'aspect-[2/3]' }
  const covers = items.filter(i => i.image_url).slice(0, 2)
  const count = items.length

  return (
    <div className="absolute inset-0 flex flex-col gap-3 p-4">
      <div className="flex-1 flex flex-col gap-2 overflow-hidden">
        {[0, 1].map(i => (
          <div key={i} className="relative flex-1 bg-stone-100 rounded-sm overflow-hidden">
            {covers[i]?.image_url && (
              <Image
                src={covers[i].image_url!}
                alt={covers[i].title ?? ''}
                fill
                className="object-cover"
                sizes="180px"
              />
            )}
          </div>
        ))}
      </div>
      <div className="flex items-baseline justify-between shrink-0">
        <p className="font-serif text-base font-medium text-stone-900">{meta.label}</p>
        <p className="font-mono text-[9px] text-stone-400">{count}</p>
      </div>
    </div>
  )
}
