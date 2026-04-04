type Item = {
  id: string
  title: string | null
  image_url: string | null
  status: string | null
  metadata: Record<string, unknown>
  created_at?: string
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

function NoteCardInner({ item, titleSize }: { item: Item; titleSize: 'base' | 'xl' | '2xl' }) {
  const excerpt = item.metadata?.excerpt as string | null

  const titleClass = {
    base: 'text-base',
    xl: 'text-xl',
    '2xl': 'text-2xl',
  }[titleSize]

  return (
    <div className="absolute inset-0 flex flex-col justify-between p-5">
      {/* Top — label */}
      <div>
        <p className="font-mono text-[9px] uppercase tracking-wider text-stone-400">Writing · Note</p>
      </div>

      {/* Middle — title + date + excerpt */}
      <div>
        <p className={`font-serif font-medium text-stone-900 leading-tight line-clamp-3 mb-1.5 ${titleClass}`}>
          {item.title}
        </p>
        {item.created_at && (
          <p className="font-mono text-[9px] text-stone-400 mb-2">{formatDate(item.created_at)}</p>
        )}
        {excerpt && (
          <p className="font-mono text-[9px] text-stone-400 line-clamp-3 leading-relaxed">{excerpt}</p>
        )}
      </div>
    </div>
  )
}

export function NoteCard1x1({ item }: { item: Item }) {
  return <NoteCardInner item={item} titleSize="base" />
}

export function NoteCard1x2({ item }: { item: Item }) {
  return <NoteCardInner item={item} titleSize="xl" />
}

export function NoteCard2x1({ item }: { item: Item }) {
  return <NoteCardInner item={item} titleSize="2xl" />
}
