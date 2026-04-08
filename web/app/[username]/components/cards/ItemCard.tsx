import Image from 'next/image'

type Item = {
  id: string
  title: string | null
  image_url: string | null
  status: string | null
  metadata: Record<string, unknown>
}

const STATUS_STYLES: Record<string, string> = {
  'want': 'bg-yellow-50 text-yellow-700',
  'own': 'bg-stone-100 text-stone-500',
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

// ── 1x1 ───────────────────────────────────────────────────────────────────────
export function ItemCard1x1({ item }: { item: Item }) {
  const brand = item.metadata?.brand as string | null

  return (
    <div className="absolute inset-0 grid grid-cols-2 items-end gap-4 p-6">
      {item.image_url && (
        <div className="flex items-end justify-center">
          <Image
            src={item.image_url}
            alt={item.title ?? ''}
            width={0}
            height={0}
            sizes="180px"
            className="transition-all duration-300 ease-out group-hover:-rotate-3 group-hover:scale-110"
            style={{
              width: '100%',
              height: 'auto',
              maxHeight: 120,
              objectFit: 'contain',
              filter: 'drop-shadow(0 6px 16px rgba(0,0,0,0.15))',
            }}
          />
        </div>
      )}
      <div>
        <StatusPill status={item.status} />
        <p className="font-serif text-sm font-medium text-stone-900 leading-tight line-clamp-3 mt-1">{item.title}</p>
        {brand && <p className="font-mono text-[9px] text-stone-400 mt-0.5">{brand}</p>}
      </div>
    </div>
  )
}

// ── 2x1 ───────────────────────────────────────────────────────────────────────
export function ItemCard2x1({ item }: { item: Item }) {
  const brand = item.metadata?.brand as string | null

  return (
    <div className="absolute inset-0 flex">
      {/* Left half — product image centered */}
      <div className="w-1/2 h-full flex items-center justify-center p-6">
        {item.image_url && (
          <Image
            src={item.image_url}
            alt={item.title ?? ''}
            width={0}
            height={0}
            sizes="300px"
            className="transition-all duration-300 ease-out group-hover:scale-110"
            style={{
              width: 'auto',
              height: 160,
              maxWidth: 160,
              objectFit: 'contain',
              filter: 'drop-shadow(0 8px 20px rgba(0,0,0,0.15))',
            }}
          />
        )}
      </div>
      {/* Right half — text bottom */}
      <div className="w-1/2 h-full flex flex-col items-start justify-end gap-1.5 pb-6 pr-6">
        <StatusPill status={item.status} />
        <p className="font-serif text-2xl font-semibold text-stone-900 leading-tight line-clamp-3">{item.title}</p>
        {brand && <p className="font-mono text-[9px] text-stone-400">{brand}</p>}
      </div>
    </div>
  )
}
