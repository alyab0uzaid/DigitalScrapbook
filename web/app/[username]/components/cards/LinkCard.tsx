type Item = {
  id: string
  title: string | null
  image_url: string | null
  status: string | null
  metadata: Record<string, unknown>
}

function ArrowIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
      <path fillRule="evenodd" d="M5.22 14.78a.75.75 0 001.06 0l7.22-7.22v5.69a.75.75 0 001.5 0v-7.5a.75.75 0 00-.75-.75h-7.5a.75.75 0 000 1.5h5.69l-7.22 7.22a.75.75 0 000 1.06z" clipRule="evenodd" />
    </svg>
  )
}

function LinkCardInner({ item, large }: { item: Item; large?: boolean }) {
  const url = item.metadata?.url as string | null
  const siteName = item.metadata?.site_name as string | null
  const favicon = item.metadata?.favicon as string | null

  return (
    <div className="absolute inset-0 flex flex-col justify-between p-5">
      {/* Arrow — top right */}
      {url && (
        <div className="flex justify-end">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="relative flex h-7 w-7 items-center justify-center text-stone-400 group-hover:text-stone-700 transition-colors duration-200"
          >
            {/* Background circle — scales independently */}
            <span className="absolute inset-0 rounded-full bg-white shadow-sm scale-75 opacity-0 transition-all duration-200 group-hover:scale-100 group-hover:opacity-100" />
            <span className="relative"><ArrowIcon /></span>
          </a>
        </div>
      )}

      {/* Bottom — app icon + title + site name */}
      <div>
        {/* App icon */}
        <div className="mb-3 transition-transform duration-300 ease-out group-hover:scale-110 inline-block">
          <div className="w-10 h-10 rounded-lg bg-white shadow-sm flex items-center justify-center">
            {favicon
              ? <img src={favicon} alt="" className="w-6 h-6 rounded-sm" />
              : <div className="w-6 h-6 rounded-sm bg-stone-200" />
            }
          </div>
        </div>

        <p className={`font-serif font-medium text-stone-900 leading-tight mb-1.5 ${large ? 'text-2xl line-clamp-3' : 'text-base line-clamp-3'}`}>
          {item.title}
        </p>
        {siteName && (
          <p className="font-mono text-[9px] uppercase tracking-wider text-stone-400 truncate">
            {siteName}
          </p>
        )}
      </div>
    </div>
  )
}

export function LinkCard1x1({ item }: { item: Item }) {
  return <LinkCardInner item={item} />
}

export function LinkCard2x1({ item }: { item: Item }) {
  return <LinkCardInner item={item} large />
}
