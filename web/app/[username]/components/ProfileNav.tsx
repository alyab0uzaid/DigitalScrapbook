'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useRef, useLayoutEffect, useState } from 'react'
import { logout } from '@/app/actions/auth'

const MAX_VISIBLE = 5

type NavTab = { href: string; label: string; muted?: boolean }

export default function ProfileNav({
  username,
  sections,
  collections,
  isOwner,
}: {
  username: string
  sections: { slug: string; label: string }[]
  collections: { id: string; name: string; is_public: boolean }[]
  isOwner: boolean
}) {
  const pathname = usePathname()
  const base = `/${username}`

  const contentTabs: NavTab[] = [
    { href: base, label: username },
    ...sections.map(s => ({ href: `${base}/${s.slug}`, label: s.label.toLowerCase() })),
    ...collections.map(c => ({ href: `${base}/c/${c.id}`, label: c.name.toLowerCase() })),
  ]

  // Library is owner-only and lives outside the overflow so it's always accessible
  const mainTabs = contentTabs.slice(0, MAX_VISIBLE)
  const overflowTabs = contentTabs.slice(MAX_VISIBLE)

  const tabRefs = useRef<(HTMLAnchorElement | null)[]>([])
  const [indicator, setIndicator] = useState({ width: 0, left: 0, opacity: 0 })
  const [showMore, setShowMore] = useState(false)
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)

  const activeIdx = mainTabs.findIndex(t => t.href === pathname)

  useLayoutEffect(() => {
    const targetIdx = hoveredIdx ?? activeIdx
    if (targetIdx >= 0 && tabRefs.current[targetIdx]) {
      const el = tabRefs.current[targetIdx]!
      setIndicator({ width: el.offsetWidth, left: el.offsetLeft, opacity: 1 })
    } else {
      setIndicator(prev => ({ ...prev, opacity: 0 }))
    }
  }, [pathname, mainTabs.length, hoveredIdx, activeIdx])

  return (
    <div
      className="pointer-events-auto relative z-50 inline-flex items-center rounded-lg border border-neutral-200 bg-white/70 p-1 shadow-md backdrop-blur-md"
      onMouseLeave={() => setHoveredIdx(null)}
    >
      {/* Sliding indicator */}
      <div
        className="absolute top-1 left-0 -z-10 h-7 rounded bg-neutral-200 backdrop-blur"
        style={{
          width: indicator.width,
          transform: `translateX(${indicator.left}px)`,
          opacity: indicator.opacity,
          transition: 'width 150ms, transform 150ms, opacity 150ms',
        }}
      />

      {mainTabs.map((tab, i) => (
        <Link
          key={tab.href}
          href={tab.href}
          ref={el => { tabRefs.current[i] = el }}
          onMouseEnter={() => setHoveredIdx(i)}
          className={`rounded py-1 px-2 text-sm tracking-tight transition-colors whitespace-nowrap ${
            pathname === tab.href ? 'text-neutral-900' : 'text-neutral-400 hover:text-neutral-900'
          }`}
        >
          {tab.label}
        </Link>
      ))}

      {overflowTabs.length > 0 && (
        <div className="relative">
          <button
            onClick={() => setShowMore(v => !v)}
            className="rounded py-1 px-2 text-sm tracking-tight text-neutral-400 hover:text-neutral-900 transition-colors"
          >
            more ▾
          </button>
          {showMore && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowMore(false)} />
              <div className="absolute top-full right-0 mt-1 z-50 min-w-[160px] rounded-lg border border-neutral-200 bg-white shadow-md p-1">
                {overflowTabs.map(tab => (
                  <Link
                    key={tab.href}
                    href={tab.href}
                    onClick={() => setShowMore(false)}
                    className={`block rounded px-3 py-1.5 text-sm tracking-tight transition-colors ${
                      pathname === tab.href
                        ? 'text-neutral-900 bg-neutral-100'
                        : 'text-neutral-400 hover:text-neutral-900'
                    }`}
                  >
                    {tab.label}
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Library + logout — owner-only, always last, visually separated */}
      {isOwner && (
        <>
          <span className="w-px h-4 bg-neutral-200 mx-0.5" />
          <Link
            href="/library"
            className="rounded py-1 px-2 text-sm tracking-tight text-neutral-300 hover:text-neutral-600 transition-colors whitespace-nowrap"
          >
            library
          </Link>
          <span className="w-px h-4 bg-neutral-200 mx-0.5" />
          <form action={logout}>
            <button
              type="submit"
              className="rounded py-1 px-2 text-sm tracking-tight text-neutral-300 hover:text-neutral-600 transition-colors whitespace-nowrap"
            >
              logout
            </button>
          </form>
        </>
      )}
    </div>
  )
}
