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
  'discovered': 'bg-blue-50 text-blue-700',
  'on repeat': 'bg-green-50 text-green-700',
  'loved': 'bg-stone-100 text-stone-500',
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

function Vinyl({ size }: { size: number }) {
  const cx = size / 2
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: 'block' }}>
      {/* Main disc */}
      <circle cx={cx} cy={cx} r={cx} fill="#1a1a1a" />
      {/* Grooves */}
      {[0.82, 0.72, 0.62, 0.52, 0.43].map((r, i) => (
        <circle key={i} cx={cx} cy={cx} r={cx * r} fill="none" stroke="#2e2e2e" strokeWidth="1" />
      ))}
      {/* Label area */}
      <circle cx={cx} cy={cx} r={cx * 0.28} fill="#2a2a2a" />
      {/* Center hole */}
      <circle cx={cx} cy={cx} r={cx * 0.06} fill="#888" />
    </svg>
  )
}

// ── 1x1 — album art with vinyl peeking out on hover ──────────────────────────
export function MusicCard1x1({ item }: { item: Item }) {
  const artist = item.metadata?.artist as string | null
  const size = 90

  return (
    <div className="absolute inset-0 flex flex-col justify-end p-5 gap-3">
      {item.image_url && (
        <div className="relative" style={{ width: size, height: size }}>
          {/* Vinyl — same size as cover, fully hidden behind it, slides right on hover */}
          <div
            className="absolute inset-0 transition-transform duration-300 ease-out group-hover:translate-x-[22%]"
            style={{ zIndex: 0 }}
          >
            <Vinyl size={size} />
          </div>

          {/* Cover — on top */}
          <div className="absolute inset-0" style={{ zIndex: 1, filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.18))' }}>
            <Image
              src={item.image_url}
              alt={item.title ?? ''}
              width={0}
              height={0}
              sizes="180px"
              className="rounded-sm"
              style={{ width: size, height: size, display: 'block' }}
            />
          </div>
        </div>
      )}
      <div>
        <StatusPill status={item.status} />
        <p className="font-serif text-sm font-medium text-stone-900 leading-tight line-clamp-2 mt-1">{item.title}</p>
        {artist && <p className="font-mono text-[9px] text-stone-400 mt-0.5">{artist}</p>}
      </div>
    </div>
  )
}

// ── 2x1 — cover centered with vinyl peeking on hover ─────────────────────────
export function MusicCard2x1({ item }: { item: Item }) {
  const artist = item.metadata?.artist as string | null
  const size = 160

  return (
    <div className="absolute inset-0 flex">
      <div className="w-1/2 h-full flex items-center justify-center p-6">
        {item.image_url && (
          <div className="relative" style={{ width: size, height: size }}>
            {/* Vinyl — same size as cover, hidden behind, slides right */}
            <div
              className="absolute inset-0 transition-transform duration-300 ease-out group-hover:translate-x-[22%]"
              style={{ zIndex: 0 }}
            >
              <Vinyl size={size} />
            </div>

            {/* Cover — on top */}
            <div className="absolute inset-0" style={{ zIndex: 1, filter: coverShadow }}>
              <Image
                src={item.image_url}
                alt={item.title ?? ''}
                width={0}
                height={0}
                sizes="300px"
                className="rounded-sm"
                style={{ width: size, height: size, display: 'block' }}
              />
            </div>
          </div>
        )}
      </div>
      <div className="w-1/2 h-full flex flex-col items-start justify-end gap-1.5 pb-6 pr-6">
        <StatusPill status={item.status} />
        <p className="font-serif text-2xl font-medium text-stone-900 leading-tight line-clamp-3">{item.title}</p>
        {artist && <p className="font-mono text-[9px] text-stone-400">{artist}</p>}
      </div>
    </div>
  )
}
