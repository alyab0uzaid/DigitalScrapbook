import Image from 'next/image'

type Item = {
  id: string
  title: string | null
  image_url: string | null
  status: string | null
  metadata: Record<string, unknown>
}

const STATUS_STYLES: Record<string, string> = {
  'reading': 'bg-green-50 text-green-700',
  'read': 'bg-stone-100 text-stone-500',
  'want to read': 'bg-yellow-50 text-yellow-700',
  'favorite': 'bg-amber-50 text-amber-700',
}

function StatusPill({ status }: { status: string | null }) {
  if (!status) return null
  const style = STATUS_STYLES[status] ?? 'bg-stone-100 text-stone-500'
  return (
    <span className={`inline-block whitespace-nowrap font-mono text-[8px] uppercase tracking-wider px-2 py-0.5 rounded-full ${style}`}>
      {status}
    </span>
  )
}

const coverShadow = 'drop-shadow(0 4px 12px rgba(0,0,0,0.18))'

// Fixed height, natural width, clipped with rounded corners + drop shadow
function BookCover({ src, alt, height, maxWidth }: { src: string; alt: string; height: number; maxWidth: number }) {
  return (
    <div style={{ clipPath: 'inset(0 round 3px)', flexShrink: 0, filter: coverShadow }}>
      <Image
        src={src}
        alt={alt}
        width={0}
        height={0}
        sizes={`${maxWidth * 2}px`}
        style={{ height, width: 'auto', maxWidth, display: 'block' }}
      />
    </div>
  )
}

// ── 1x1 ──────────────────────────────────────────────────────────────────────
// Two-column grid, both items-end, pb-10 px-7 gap-6 — matches reference
export function BookCard1x1({ item }: { item: Item }) {
  const author = item.metadata?.author as string | null
  return (
    <div className="absolute inset-0 grid grid-cols-2 items-end gap-6 p-7">
      {item.image_url && (
        <Image
          src={item.image_url}
          alt={item.title ?? ''}
          width={0}
          height={0}
          sizes="180px"
          className="rounded transition-all duration-300 ease-out group-hover:-rotate-3 group-hover:scale-110 group-hover:shadow-xl"
          style={{ width: '100%', height: 'auto', boxShadow: '0 4px 12px rgba(0,0,0,0.18)' }}
        />
      )}
      <div>
        <StatusPill status={item.status} />
        <p className="font-serif text-sm font-medium text-stone-900 leading-tight line-clamp-3 mt-1">{item.title}</p>
        {author && <p className="font-mono text-[9px] text-stone-400 mt-0.5">{author}</p>}
      </div>
    </div>
  )
}

// ── 1x2 ──────────────────────────────────────────────────────────────────────
// Cover top, info anchored bottom
export function BookCard1x2({ item }: { item: Item }) {
  const author = item.metadata?.author as string | null
  return (
    <div className="absolute inset-0 flex flex-col p-4">
      {item.image_url && (
        <div className="flex justify-center">
          <BookCover src={item.image_url} alt={item.title ?? ''} height={220} maxWidth={220} />
        </div>
      )}
      <div className="flex flex-col gap-1 mt-auto">
        <StatusPill status={item.status} />
        <p className="font-serif text-base font-medium text-stone-900 leading-tight line-clamp-2">{item.title}</p>
        {author && <p className="font-mono text-[9px] text-stone-400">{author}</p>}
      </div>
    </div>
  )
}

// ── 2x1 ──────────────────────────────────────────────────────────────────────
export function BookCard2x1({ item }: { item: Item }) {
  const author = item.metadata?.author as string | null
  return (
    <div className="absolute inset-0 flex">
      {/* Left half — cover centered */}
      <div className="w-1/2 h-full flex items-center justify-center p-6">
        {item.image_url && (
          <div
            className="transition-all duration-300 ease-out group-hover:-rotate-3 group-hover:scale-110 group-hover:shadow-xl"
            style={{ filter: coverShadow }}
          >
            <div style={{ clipPath: 'inset(0 round 3px)' }}>
              <Image
                src={item.image_url}
                alt={item.title ?? ''}
                width={0}
                height={0}
                sizes="300px"
                style={{ height: 175, width: 'auto', maxWidth: 160, display: 'block' }}
              />
            </div>
          </div>
        )}
      </div>
      {/* Right half — text at bottom, left-aligned */}
      <div className="w-1/2 h-full flex flex-col items-start justify-end gap-1.5 pb-6 pr-6">
        <StatusPill status={item.status} />
        <p className="font-serif text-2xl font-semibold text-stone-900 leading-tight line-clamp-3">{item.title}</p>
        {author && <p className="font-mono text-[9px] text-stone-400">{author}</p>}
      </div>
    </div>
  )
}
